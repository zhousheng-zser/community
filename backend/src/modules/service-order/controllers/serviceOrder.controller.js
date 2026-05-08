const db = require('../../../models');
const { ServiceOrder, ServiceItem, ServiceProviderProfile, WorkerApplication } = db;

const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data });
const fail = (res, msg, statusCode = 400) => res.status(statusCode).json({ code: 1, msg });

const STATUS_LABELS = {
  pending_pay: '待付款',
  paid_pending_dispatch: '待平台派单',
  pending_accept: '待接单',
  dispatched: '已派单',
  in_service: '服务中',
  pending_user_confirm: '待用户确认完成',
  completed: '已完成',
  cancelled: '已取消'
};

function parseMoney(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const m = String(v).match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

function remarkWithGroup(body) {
  const gk = String((body || {}).group_key || '').trim();
  let remarkFinal = String((body || {}).remark || '').trim() || '';
  if (gk) {
    remarkFinal = (remarkFinal ? `${remarkFinal} ` : '') + `[类目:${gk}]`;
  }
  return remarkFinal || null;
}

/** 支付完成后的状态：有服务商 → 待接单；已带技工账号 → 已派单；否则进管理员派单队列 */
function resolvePayNextStatus(row) {
  const prov = row.provider_id != null && Number(row.provider_id) > 0;
  const merchantUid = row.provider_user_id != null && Number(row.provider_user_id) > 0;
  if (prov || merchantUid) return 'pending_accept';
  const wu = row.worker_user_id != null ? Number(row.worker_user_id) : 0;
  if (wu > 0) return 'dispatched';
  return 'paid_pending_dispatch';
}
let soTablesReady = false;

async function ensureSoTables() {
  if (soTablesReady) return;
  await Promise.all([
    ServiceOrder && ServiceOrder.sync ? ServiceOrder.sync() : Promise.resolve(),
    ServiceItem && ServiceItem.sync ? ServiceItem.sync() : Promise.resolve(),
    ServiceProviderProfile && ServiceProviderProfile.sync ? ServiceProviderProfile.sync() : Promise.resolve()
  ]);
  soTablesReady = true;
}

function getUserId(req) {
  return req.user && req.user.id ? Number(req.user.id) : 0;
}

function normalizeServiceOrder(row) {
  if (!row) return null;
  let evidenceImages = [];
  try { evidenceImages = JSON.parse(row.evidence_images || '[]'); } catch (e) {}
  return {
    id: row.id,
    order_no: row.order_no,
    orderNo: row.order_no,
    user_id: row.user_id,
    provider_id: row.provider_id,
    service_id: row.service_id,
    service_title: row.service_title_snapshot || '',
    title: row.service_title_snapshot || '',
    worker_id: row.worker_id,
    worker_user_id: row.worker_user_id != null ? row.worker_user_id : null,
    provider_user_id: row.provider_user_id != null ? row.provider_user_id : null,
    status: row.status,
    status_text: STATUS_LABELS[row.status] || row.status || '',
    pay_status: row.pay_status,
    pay_amount: Number(row.pay_amount || row.amount || 0).toFixed(2),
    amount: Number(row.pay_amount || row.amount || 0).toFixed(2),
    contact_name: row.contact_name || '',
    contact_phone: row.contact_phone || '',
    address: row.address || row.service_address || '',
    service_address: row.service_address || row.address || '',
    appointment_time: row.appointment_time || row.book_time || '',
    book_time: row.book_time || row.appointment_time || '',
    remark: row.remark || '',
    cancel_reason: row.cancel_reason || '',
    check_in_at: row.check_in_at,
    check_in_location: row.check_in_location || '',
    evidence_images: evidenceImages,
    evidence_note: row.evidence_note || '',
    completed_at: row.completed_at,
    paid_at: row.paid_at,
    cancelled_at: row.cancelled_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// POST /service-orders
exports.create = async (req, res) => {
  try {
    await ensureSoTables();
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);
    const body = req.body || {};
    const qty = Math.min(Math.max(Number(body.qty || body.quantity || 1), 1), 99);
    let serviceId = Number(body.service_id || body.serviceId || 0);
    let providerIdIn = Number(body.provider_id || body.providerId || 0);
    const workerUserCandidate = Number(body.worker_id || body.worker_user_id || 0);

    let workerUserId = 0;
    if (workerUserCandidate > 0) {
      if (!WorkerApplication) {
        workerUserId = workerUserCandidate;
      } else {
        const appr = await WorkerApplication.findOne({
          where: { user_id: workerUserCandidate, status: 'approved' }
        });
        if (!appr) {
          return fail(res, '直约技工未通过认证或不存在', 400);
        }
        workerUserId = workerUserCandidate;
      }
    }

    const goodsName = String(body.goods_name || '').trim();
    const titleFromBody = String(body.service_title || body.title || '').trim();
    let service = null;
    let snapshotTitle = '';

    if (serviceId > 0 && ServiceItem) {
      service = await ServiceItem.findByPk(serviceId);
      if (!service && !goodsName && !providerIdIn) {
        return fail(res, '服务不存在', 404);
      }
      if (!service && goodsName) {
        serviceId = 0;
      }
    }

    if (!serviceId && !providerIdIn && !goodsName) {
      return fail(res, '缺少 service_id、provider_id 或 goods_name');
    }

    let resolvedPid = providerIdIn > 0 ? providerIdIn : null;
    let resolvedSid = serviceId > 0 ? serviceId : null;

    if (service) {
      snapshotTitle = String(service.title || service.name || '').trim();
      const spid = Number(service.provider_id || 0);
      if (!resolvedPid && spid > 0) resolvedPid = spid;
    }

    if (!snapshotTitle) snapshotTitle = goodsName || titleFromBody;
    if (!snapshotTitle) snapshotTitle = '到家服务';

    let unitPrice = parseMoney(body.goods_price);
    if (!unitPrice) unitPrice = parseMoney(body.pay_amount);
    if (!unitPrice) unitPrice = parseMoney(body.amount);
    if (service && (!unitPrice || unitPrice <= 0) && service.price != null) {
      const p = Number(service.price);
      if (Number.isFinite(p) && p >= 0) unitPrice = p;
    }

    let total = unitPrice * qty;
    if (!total || total <= 0) {
      total = parseMoney(body.pay_amount) || parseMoney(body.amount) || 0;
    }

    const rowPayload = {
      order_no: `SV${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`,
      user_id: userId,
      provider_id: resolvedPid,
      service_id: resolvedSid || null,
      service_title_snapshot: snapshotTitle,
      status: 'pending_pay',
      pay_status: 'unpaid',
      pay_amount: total,
      amount: total,
      contact_name: String(body.contact_name || body.name || '').trim() || null,
      contact_phone: String(body.contact_phone || body.phone || '').trim() || null,
      address: String(body.address || body.service_address || '').trim() || null,
      service_address: String(body.service_address || body.address || '').trim() || null,
      appointment_time: body.appointment_time || body.book_time || null,
      book_time: String(body.book_time || body.appointment_time || '').trim() || null,
      remark: remarkWithGroup(body)
    };

    if (workerUserId > 0) {
      rowPayload.worker_user_id = workerUserId;
      rowPayload.worker_id = workerUserId;
    }

    const row = await ServiceOrder.create(rowPayload);
    ok(res, { id: row.id, orderNo: row.order_no, status: row.status, pay_status: row.pay_status }, '订单创建成功');
  } catch (err) {
    console.error('[service-order/create]', err);
    fail(res, '创建订单失败', 500);
  }
};

// GET /service-orders/:id
exports.getDetail = async (req, res) => {
  try {
    await ensureSoTables();
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);
    const id = Number(req.params.id);
    if (!id) return fail(res, '无效订单ID');
    const row = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!row) return fail(res, '订单不存在', 404);
    ok(res, { order: normalizeServiceOrder(row) });
  } catch (err) {
    console.error('[service-order/detail]', err);
    fail(res, '获取订单详情失败', 500);
  }
};

// GET /service-orders/my
exports.getMyList = async (req, res) => {
  try {
    await ensureSoTables();
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);
    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit || query.page_size, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const where = { user_id: userId };
    if (query.status) where.status = String(query.status);
    const { count, rows } = await ServiceOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    ok(res, { list: rows.map(normalizeServiceOrder), total: count, page, limit });
  } catch (err) {
    console.error('[service-order/list]', err);
    fail(res, '获取订单列表失败', 500);
  }
};

// POST /service-orders/:id/mock-pay
exports.mockPay = async (req, res) => {
  try {
    await ensureSoTables();
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);
    const id = Number(req.params.id);
    if (!id) return fail(res, '无效订单ID');
    const row = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!row) return fail(res, '订单不存在', 404);
    if (row.status !== 'pending_pay') return fail(res, '当前订单不可支付');
    await row.update({
      status: resolvePayNextStatus(row),
      pay_status: 'paid',
      paid_at: new Date()
    });
    ok(res, { id: row.id, status: row.status, pay_status: row.pay_status }, '支付成功');
  } catch (err) {
    console.error('[service-order/mock-pay]', err);
    fail(res, '支付失败', 500);
  }
};

// POST /service-orders/:id/confirm
exports.confirm = async (req, res) => {
  try {
    await ensureSoTables();
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);
    const id = Number(req.params.id);
    if (!id) return fail(res, '无效订单ID');
    const row = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!row) return fail(res, '订单不存在', 404);
    if (row.status !== 'pending_user_confirm') return fail(res, '当前订单不可确认完成');
    await row.update({ status: 'completed' });
    ok(res, { id: row.id, status: row.status }, '确认完成');
  } catch (err) {
    console.error('[service-order/confirm]', err);
    fail(res, '确认失败', 500);
  }
};
