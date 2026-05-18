const { Op } = require('sequelize');
const { ServiceOrder, Service, User, WorkerApplication, WorkerProfile } = require('../models');
const { resolveUserId } = require('../utils/resolveUserId');

function authUserId(req) {
  return resolveUserId(req.user && req.user.id);
}

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

const STATUS_TEXT = {
  pending_pay: '待支付',
  pending_accept: '待接单',
  pending_worker_accept: '待技工接单',
  paid_pending_dispatch: '待派单',
  dispatched: '待接单',
  in_service: '服务中',
  pending_user_confirm: '待用户确认完成',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

function workerOrderWhere(workerId, extra = {}) {
  return {
    assigned_worker_id: workerId,
    status: { [Op.notIn]: ['cancelled', 'closed', 'pending_pay'] },
    ...extra
  };
}

function maskPhone(p) {
  if (!p || String(p).length < 7) return p ? `${String(p).slice(0, 3)}****` : '';
  const s = String(p);
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
}

async function assertWorker(userId) {
  const app = await WorkerApplication.findOne({ where: { user_id: userId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: userId, status: 'active' } });
  return !!(app && prof);
}

function baseInclude() {
  return [
    { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] },
    { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] },
    { model: User, as: 'assignedWorker', attributes: ['id', 'nickname'], required: false }
  ];
}

function serializeOrder(row, { detail = false } = {}) {
  const j = row.get ? row.get({ plain: true }) : row;
  const buyer = j.buyer || {};
  const svc = j.service || {};
  const out = {
    id: j.id,
    status: j.status,
    status_text: STATUS_TEXT[j.status] || j.status,
    pay_status: j.pay_status,
    amount: j.amount != null ? String(j.amount) : '',
    appointment_time: j.appointment_time,
    created_at: j.created_at,
    address_snapshot: j.address_snapshot,
    remark: j.remark,
    fulfillment_meta: j.fulfillment_meta || {},
    service: svc.id ? { id: svc.id, title: svc.title, cover_image: svc.cover_image, price: svc.price } : null,
    service_title: svc.title || ''
  };
  if (detail) {
    out.buyer_user_id = buyer.id;
    out.buyer_name = buyer.nickname || '';
    out.buyer_phone = buyer.phone || '';
    out.buyer_phone_masked = maskPhone(buyer.phone);
  }
  return out;
}

exports.listOrders = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const where = workerOrderWhere(userId);
    if (req.query.status) where.status = req.query.status;

    const sortField = req.query.sort === 'appointment_asc' ? 'appointment_time' : 'created_at';
    const sortDir = req.query.sort === 'appointment_asc' ? 'ASC' : 'DESC';
    const { rows, count } = await ServiceOrder.findAndCountAll({
      where,
      include: baseInclude(),
      order: [[sortField, sortDir]],
      limit,
      offset
    });
    return ok(res, {
      list: rows.map((r) => serializeOrder(r)),
      total: count,
      page,
      limit
    });
  } catch (e) {
    console.error('workerPortal listOrders', e);
    return fail(res, 500, '查询失败', 500);
  }
};

exports.getOrder = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await ServiceOrder.findOne({
      where: workerOrderWhere(userId, { id }),
      include: baseInclude()
    });
    if (!order) return fail(res, 404, '订单不存在', 404);
    return ok(res, serializeOrder(order, { detail: true }));
  } catch (e) {
    console.error('workerPortal getOrder', e);
    return fail(res, 500, '查询失败', 500);
  }
};

exports.accept = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    const order = await ServiceOrder.findOne({ where: workerOrderWhere(userId, { id }) });
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.status === 'pending_worker_accept') {
      order.status = 'in_service';
    } else if (order.status === 'dispatched') {
      order.status = 'in_service';
    } else {
      return fail(res, 400, '当前状态不可接单');
    }
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: STATUS_TEXT[order.status] });
  } catch (e) {
    console.error('workerPortal accept', e);
    return fail(res, 500, '操作失败', 500);
  }
};

exports.reject = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    const reason = (req.body && (req.body.reason || req.body.reject_reason)) || '';
    const order = await ServiceOrder.findOne({ where: workerOrderWhere(userId, { id }) });
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.status !== 'dispatched' && order.status !== 'pending_worker_accept') {
      return fail(res, 400, '当前状态不可拒单');
    }
    const meta = { ...(order.fulfillment_meta || {}) };
    meta.worker_reject = { at: new Date().toISOString(), reason: String(reason).slice(0, 500) };
    order.fulfillment_meta = meta;
    order.status = order.pay_status === 'paid' ? 'paid_pending_dispatch' : 'pending_pay';
    order.assigned_worker_id = null;
    order.dispatch_at = null;
    order.dispatch_by = null;
    await order.save();
    return ok(res, { id: order.id, status: order.status });
  } catch (e) {
    console.error('workerPortal reject', e);
    return fail(res, 500, '操作失败', 500);
  }
};

exports.checkIn = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    const { latitude, longitude, accuracy } = req.body || {};
    if (latitude == null || longitude == null) return fail(res, 400, '缺少 latitude / longitude');
    const order = await ServiceOrder.findOne({ where: workerOrderWhere(userId, { id }) });
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
    console.error('workerPortal checkIn', e);
    return fail(res, 500, '打卡失败', 500);
  }
};

exports.evidence = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    const kind = req.body && req.body.kind;
    const urls = req.body && req.body.urls;
    if (!kind || !['before', 'after'].includes(String(kind))) return fail(res, 400, 'kind 须为 before 或 after');
    if (!Array.isArray(urls) || urls.length === 0) return fail(res, 400, 'urls 须为非空数组');
    const order = await ServiceOrder.findOne({ where: workerOrderWhere(userId, { id }) });
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
    console.error('workerPortal evidence', e);
    return fail(res, 500, '上传失败', 500);
  }
};

exports.addonRequest = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    const remark = (req.body && (req.body.remark || req.body.content)) || '';
    if (!String(remark).trim()) return fail(res, 400, '请填写加项说明');
    const order = await ServiceOrder.findOne({ where: workerOrderWhere(userId, { id }) });
    if (!order) return fail(res, 404, '订单不存在', 404);
    const meta0 = order.fulfillment_meta || {};
    const addonRequests = [...((meta0.addon_requests || [])).map((x) => x)];
    addonRequests.push({
      at: new Date().toISOString(),
      remark: String(remark).slice(0, 2000)
    });
    const meta = { ...meta0, addon_requests: addonRequests };
    order.fulfillment_meta = meta;
    order.changed('fulfillment_meta', true);
    await order.save();
    return ok(res, { id: order.id, addon_requests: meta.addon_requests });
  } catch (e) {
    console.error('workerPortal addonRequest', e);
    return fail(res, 500, '提交失败', 500);
  }
};

exports.complete = async (req, res) => {
  try {
    const userId = authUserId(req);
    if (!userId) return fail(res, 401, '未登录', 401);
    if (!(await assertWorker(userId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    const order = await ServiceOrder.findOne({ where: workerOrderWhere(userId, { id }) });
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.status !== 'in_service') return fail(res, 400, '当前状态不可完成服务');
    const meta = { ...(order.fulfillment_meta || {}) };
    if (meta.await_user_confirm) {
      order.status = 'pending_user_confirm';
    } else {
      order.status = 'completed';
    }
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('workerPortal complete', e);
    return fail(res, 500, '操作失败', 500);
  }
};
