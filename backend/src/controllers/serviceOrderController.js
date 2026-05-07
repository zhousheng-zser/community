const { Op } = require('sequelize');
const {
  ServiceOrder,
  Service,
  User,
  UserAddress,
  WorkerApplication,
  WorkerProfile,
  WorkerService,
  ServiceProviderProfile,
  ServiceOrderComplaint
} = require('../models');
const {
  resolveProviderContext,
  buildProviderOrderWhereClause,
  findProviderOrderById,
  providerOrderInclude
} = require('../utils/serviceProviderOrderScope');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

const SERVICE_ORDER_STATUS_TEXT = {
  pending_pay: '待支付',
  pending_accept: '待服务商接单',
  pending_worker_accept: '待技工接单',
  paid_pending_dispatch: '待派单',
  dispatched: '已派单',
  in_service: '服务中',
  pending_user_confirm: '待用户确认完成',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

function genOrderNo() {
  const r = Math.floor(Math.random() * 900000 + 100000);
  return `SO${Date.now()}${r}`;
}

async function assertWorkerForCommunity(workerUserId, communityId) {
  const app = await WorkerApplication.findOne({ where: { user_id: workerUserId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: workerUserId, status: 'active' } });
  if (!app || !prof) return { ok: false, reason: '技工未入驻' };
  if (communityId != null && prof.community_id != null && Number(prof.community_id) !== Number(communityId)) {
    return { ok: false, reason: '技工不接该小区' };
  }
  return { ok: true, prof };
}

async function assertWorkerSellsService(workerUserId, serviceId) {
  const n = await WorkerService.count({ where: { worker_user_id: workerUserId } });
  if (n === 0) return true;
  const row = await WorkerService.findOne({
    where: { worker_user_id: workerUserId, service_id: serviceId, enabled: 1 }
  });
  return !!row;
}

function serializeOrderRow(plain, { withDetail = false } = {}) {
  const amt = plain.amount != null ? String(plain.amount) : '';
  const w = plain.assignedWorker;
  const svc = plain.service;
  const out = {
    id: plain.id,
    order_no: plain.order_no || null,
    status: plain.status,
    status_text: SERVICE_ORDER_STATUS_TEXT[plain.status] || plain.status,
    pay_status: plain.pay_status,
    service_id: plain.service_id,
    service_title: svc ? svc.title : (plain.goods_name || ''),
    amount: amt,
    pay_amount: amt,
    created_at: plain.created_at,
    appointment_time: plain.appointment_time,
    community_id: plain.community_id,
    group_key: plain.group_key || null,
    worker_id: plain.assigned_worker_id || null,
    provider_user_id: plain.provider_user_id || null,
    merchant_user_id: plain.provider_user_id || null,
    contact_name: plain.contact_name || null,
    contact_phone: plain.contact_phone || null,
    qty: plain.qty != null ? plain.qty : 1,
    remark: plain.remark || null,
    fulfillment_meta: plain.fulfillment_meta || {},
    assigned_worker: w
      ? { id: w.id, nickname: w.nickname, name: w.nickname || '', avatar_url: w.avatar_url || '', worker_user_id: w.id }
      : null
  };
  if (withDetail) {
    out.address_snapshot = plain.address_snapshot || null;
    out.service = svc || null;
  }
  return out;
}

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const {
      service_id,
      worker_id,
      community_id,
      address_id,
      address_snapshot,
      appointment_time,
      remark,
      group_key,
      address,
      contact_name,
      contact_phone,
      goods_name,
      goods_price,
      qty
    } = body;
    if (!service_id) return fail(res, 400, '缺少 service_id');
    const service = await Service.findByPk(service_id);
    if (!service) return fail(res, 404, '服务不存在');
    const sj = service.toJSON();
    const pub = sj.is_published;
    if (pub === 0 || pub === false) return fail(res, 400, '服务未上架');

    let snap = address_snapshot || null;
    if (!snap && address_id) {
      const addr = await UserAddress.findOne({ where: { id: address_id, user_id: userId } });
      if (addr) snap = addr.toJSON();
    }
    if (!snap && (address || contact_phone)) {
      snap = {
        detail: address || '',
        contact_name: contact_name || '',
        contact_phone: contact_phone || ''
      };
    }

    let commId = community_id != null ? parseInt(community_id, 10) : null;
    if (!commId) {
      const u = await User.findByPk(userId, { attributes: ['community_id'] });
      commId = u && u.community_id != null ? Number(u.community_id) : null;
    }

    const q = qty != null ? parseInt(qty, 10) : 1;
    const qSafe = Number.isFinite(q) && q > 0 ? q : 1;
    let amount = Number(service.price) * qSafe;
    if (goods_price != null && goods_price !== '') {
      amount = Number(goods_price) * qSafe;
    }
    if (!Number.isFinite(amount) || amount < 0) amount = Number(service.price) * qSafe;

    let assigned_worker_id = null;
    let status = 'pending_pay';
    let fulfillment_meta = {};

    if (worker_id != null && worker_id !== '') {
      const wid = parseInt(worker_id, 10);
      const chk = await assertWorkerForCommunity(wid, commId);
      if (!chk.ok) return fail(res, 400, chk.reason || '技工不可用');
      const sells = await assertWorkerSellsService(wid, Number(service_id));
      if (!sells) return fail(res, 400, '该技工未上架此服务');
      assigned_worker_id = wid;
      status = 'pending_worker_accept';
      fulfillment_meta = { await_user_confirm: true, direct_worker: true };
    } else {
      /** 非直约单（含先支付后运营派单）：与直约一致，技工完工后待用户确认 */
      fulfillment_meta = { await_user_confirm: true };
    }

    let provider_user_id = null;
    if (sj.provider_id != null) {
      const spp = await ServiceProviderProfile.findByPk(sj.provider_id);
      if (spp && spp.status === 'active') provider_user_id = spp.user_id;
    }

    const row = await ServiceOrder.create({
      user_id: userId,
      community_id: commId,
      service_id: Number(service_id),
      group_key: group_key || null,
      amount,
      address_id: address_id ? parseInt(address_id, 10) : null,
      address_snapshot: snap,
      appointment_time: appointment_time || null,
      remark: remark || null,
      status,
      pay_status: 'unpaid',
      assigned_worker_id,
      order_no: genOrderNo(),
      contact_name: contact_name || null,
      contact_phone: contact_phone || null,
      goods_name: goods_name || sj.title || null,
      qty: qSafe,
      provider_user_id,
      fulfillment_meta: Object.keys(fulfillment_meta).length ? fulfillment_meta : null
    });
    return ok(res, {
      id: row.id,
      order_id: row.id,
      order_no: row.order_no,
      status: row.status,
      pay_status: row.pay_status
    });
  } catch (e) {
    console.error('serviceOrder create', e);
    return fail(res, 500, '创建失败');
  }
};

/** POST /service-orders/bundle 服务商多 SKU 打包单 */
exports.createBundle = async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const {
      provider_id,
      items,
      address,
      contact_name,
      contact_phone,
      remark,
      community_id
    } = body;
    if (!provider_id || !Array.isArray(items) || items.length === 0) {
      return fail(res, 400, '缺少 provider_id 或 items');
    }
    const prof = await ServiceProviderProfile.findOne({
      where: { user_id: parseInt(provider_id, 10), status: 'active' }
    });
    if (!prof) return fail(res, 404, '服务商不存在');

    let commId = community_id != null ? parseInt(community_id, 10) : null;
    if (!commId) {
      const u = await User.findByPk(userId, { attributes: ['community_id'] });
      commId = u && u.community_id != null ? Number(u.community_id) : null;
    }
    const pj = prof.toJSON ? prof.toJSON() : prof;
    if (pj.community_id != null && commId != null) {
      if (Number(pj.community_id) !== Number(commId)) {
        return fail(res, 400, '服务商不接该小区');
      }
    }

    const lines = [];
    let total = 0;
    for (const it of items) {
      const sid = parseInt(it.service_id, 10);
      const svc = await Service.findByPk(sid);
      if (!svc) return fail(res, 400, `服务不存在: ${sid}`);
      const sj = svc.toJSON();
      if (sj.is_published === 0 || sj.is_published === false) return fail(res, 400, '含未上架服务');
      const q = it.qty != null ? parseInt(it.qty, 10) : 1;
      const qSafe = Number.isFinite(q) && q > 0 ? q : 1;
      const lineAmt = Number(sj.price) * qSafe;
      total += lineAmt;
      lines.push({
        service_id: sid,
        group_key: it.group_key || null,
        qty: qSafe,
        title: it.title || sj.title,
        unit_price: sj.price
      });
    }

    const first = lines[0];
    const row = await ServiceOrder.create({
      user_id: userId,
      community_id: commId,
      service_id: first.service_id,
      group_key: first.group_key || null,
      amount: total,
      address_snapshot: {
        detail: address || '',
        contact_name: contact_name || '',
        contact_phone: contact_phone || ''
      },
      remark: remark || null,
      status: 'pending_pay',
      pay_status: 'unpaid',
      provider_user_id: prof.user_id || parseInt(provider_id, 10),
      order_no: genOrderNo(),
      contact_name: contact_name || null,
      contact_phone: contact_phone || null,
      goods_name: `打包单(${lines.length}项)`,
      qty: 1,
      fulfillment_meta: { bundle_lines: lines, mode: 'sp_bundle', await_user_confirm: true }
    });
    return ok(res, { id: row.id, order_no: row.order_no, status: row.status, amount: String(total) });
  } catch (e) {
    console.error('serviceOrder createBundle', e);
    return fail(res, 500, '创建失败');
  }
};

exports.getDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await ServiceOrder.findOne({
      where: { id, user_id: userId },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price', 'description'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url', 'phone'], required: false }
      ]
    });
    if (!order) return fail(res, 404, '订单不存在', 404);
    return ok(res, serializeOrderRow(order.get({ plain: true }), { withDetail: true }));
  } catch (e) {
    console.error('serviceOrder getDetail', e);
    return fail(res, 500, '查询失败');
  }
};

exports.getByOrderNo = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderNo = req.query.order_no != null ? String(req.query.order_no).trim() : '';
    if (!orderNo) return fail(res, 400, '请传 order_no');
    const order = await ServiceOrder.findOne({
      where: { order_no: orderNo, user_id: userId },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price', 'description'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url', 'phone'], required: false }
      ]
    });
    if (!order) return fail(res, 404, '订单不存在', 404);
    return ok(res, serializeOrderRow(order.get({ plain: true }), { withDetail: true }));
  } catch (e) {
    console.error('serviceOrder getByOrderNo', e);
    return fail(res, 500, '查询失败');
  }
};

exports.complaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { content, images } = req.body || {};
    if (!id) return fail(res, 400, '无效订单 id');
    if (!content || !String(content).trim()) return fail(res, 400, '请填写投诉内容');
    const order = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在', 404);
    const row = await ServiceOrderComplaint.create({
      order_id: id,
      user_id: userId,
      content: String(content).slice(0, 4000),
      images_json: Array.isArray(images) ? images : null,
      status: 'open'
    });
    return ok(res, { id: row.id });
  } catch (e) {
    console.error('serviceOrder complaint', e);
    return fail(res, 500, '提交失败');
  }
};

exports.confirmComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.status !== 'pending_user_confirm') return fail(res, 400, '当前状态不可确认');
    order.status = 'completed';
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT.completed });
  } catch (e) {
    console.error('serviceOrder confirmComplete', e);
    return fail(res, 500, '操作失败');
  }
};

exports.myList = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = req.query.limit != null && req.query.limit !== '' ? req.query.limit : req.query.page_size;
    let limit = parseInt(limitRaw, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const { rows, count } = await ServiceOrder.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url'], required: false }
      ]
    });
    const list = rows.map((row) => serializeOrderRow(row.get({ plain: true })));
    return ok(res, { list, total: count, page, limit });
  } catch (e) {
    console.error('serviceOrder myList', e);
    return fail(res, 500, '查询失败');
  }
};

exports.mockPay = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在');
    if (order.pay_status === 'paid') return fail(res, 400, '已支付');
    order.pay_status = 'paid';
    if (order.status === 'pending_pay' || order.status === 'pending_worker_accept') {
      if (order.provider_user_id) {
        order.status = 'pending_accept';
      } else if (order.assigned_worker_id) {
        order.status = 'dispatched';
      } else {
        order.status = 'paid_pending_dispatch';
      }
    }
    await order.save();
    try {
      await Service.increment('sales_count', { by: 1, where: { id: order.service_id } });
      await Service.increment('order_count', { by: 1, where: { id: order.service_id } });
    } catch (err) { /* ignore */ }
    await order.reload({ include: [{ model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] }] });
    return ok(res, order.get({ plain: true }));
  } catch (e) {
    console.error('serviceOrder mockPay', e);
    return fail(res, 500, '支付失败');
  }
};

async function assertServiceProvider(userId) {
  const prof = await ServiceProviderProfile.findOne({ where: { user_id: userId, status: 'active' } });
  return !!prof;
}

exports.providerListOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const ctx = await resolveProviderContext(userId);
    if (!ctx) return fail(res, 403, '非已入驻服务商', 403);
    const { profile, serviceIds } = ctx;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const scope = buildProviderOrderWhereClause(profile, serviceIds);
    const where = { [Op.and]: [scope] };
    if (req.query.status) {
      where[Op.and].push({ status: String(req.query.status) });
    } else {
      where[Op.and].push({ status: { [Op.notIn]: ['cancelled', 'closed'] } });
    }
    const { rows, count } = await ServiceOrder.findAndCountAll({
      where,
      include: providerOrderInclude(),
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return ok(res, { list: rows.map((r) => serializeOrderRow(r.get({ plain: true }))), total: count, page, limit });
  } catch (e) {
    console.error('serviceOrder providerListOrders', e);
    return fail(res, 500, '查询失败', 500);
  }
};

exports.providerGetOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const ctx = await resolveProviderContext(userId);
    if (!ctx) return fail(res, 403, '非已入驻服务商', 403);
    const { profile, serviceIds } = ctx;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return fail(res, 404, '订单不存在', 404);
    return ok(res, serializeOrderRow(order.get({ plain: true }), { withDetail: true }));
  } catch (e) {
    console.error('serviceOrder providerGetOrder', e);
    return fail(res, 500, '查询失败', 500);
  }
};

exports.providerAccept = async (req, res) => {
  try {
    const userId = req.user.id;
    const ctx = await resolveProviderContext(userId);
    if (!ctx) return fail(res, 403, '非已入驻服务商', 403);
    const { profile, serviceIds } = ctx;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.pay_status !== 'paid') return fail(res, 400, '订单未支付');
    if (order.status !== 'pending_accept') return fail(res, 400, '当前状态不可接单');
    order.status = 'in_service';
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('serviceOrder providerAccept', e);
    return fail(res, 500, '操作失败', 500);
  }
};

exports.providerCheckIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const ctx = await resolveProviderContext(userId);
    if (!ctx) return fail(res, 403, '非已入驻服务商', 403);
    const { profile, serviceIds } = ctx;
    const id = parseInt(req.params.id, 10);
    const { latitude, longitude, accuracy } = req.body || {};
    if (latitude == null || longitude == null) return fail(res, 400, '缺少 latitude / longitude');
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return fail(res, 404, '订单不存在', 404);
    const meta0 = order.fulfillment_meta || {};
    const checkIns = [...((meta0.check_ins || [])).map((x) => x)];
    checkIns.push({
      at: new Date().toISOString(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy != null ? Number(accuracy) : null
    });
    const meta = { ...meta0, check_ins: checkIns };
    order.fulfillment_meta = meta;
    order.changed('fulfillment_meta', true);
    await order.save();
    return ok(res, { id: order.id, check_ins: meta.check_ins });
  } catch (e) {
    console.error('serviceOrder providerCheckIn', e);
    return fail(res, 500, '打卡失败', 500);
  }
};

exports.providerEvidence = async (req, res) => {
  try {
    const userId = req.user.id;
    const ctx = await resolveProviderContext(userId);
    if (!ctx) return fail(res, 403, '非已入驻服务商', 403);
    const { profile, serviceIds } = ctx;
    const id = parseInt(req.params.id, 10);
    const kind = req.body && req.body.kind;
    const urls = req.body && req.body.urls;
    if (!kind || !['before', 'after'].includes(String(kind))) return fail(res, 400, 'kind 须为 before 或 after');
    if (!Array.isArray(urls) || urls.length === 0) return fail(res, 400, 'urls 须为非空数组');
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return fail(res, 404, '订单不存在', 404);
    const meta0 = order.fulfillment_meta || {};
    const e0 = meta0.evidence || {};
    const evidence = {
      before: [...((e0.before || [])).map((x) => x)],
      after: [...((e0.after || [])).map((x) => x)]
    };
    const key = kind === 'before' ? 'before' : 'after';
    evidence[key] = [...(evidence[key] || []), ...urls.map((u) => String(u).slice(0, 512))];
    const meta = { ...meta0, evidence };
    order.fulfillment_meta = meta;
    order.changed('fulfillment_meta', true);
    await order.save();
    return ok(res, { id: order.id, evidence: meta.evidence });
  } catch (e) {
    console.error('serviceOrder providerEvidence', e);
    return fail(res, 500, '上传失败', 500);
  }
};

exports.providerComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const ctx = await resolveProviderContext(userId);
    if (!ctx) return fail(res, 403, '非已入驻服务商', 403);
    const { profile, serviceIds } = ctx;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.status !== 'in_service') return fail(res, 400, '当前状态不可完成服务');
    const meta = { ...(order.fulfillment_meta || {}) };
    if (meta.await_user_confirm) {
      order.status = 'pending_user_confirm';
    } else {
      order.status = 'completed';
    }
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('serviceOrder providerComplete', e);
    return fail(res, 500, '操作失败', 500);
  }
};
