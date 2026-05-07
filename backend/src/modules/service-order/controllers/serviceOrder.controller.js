const db = require('../../../models');
const { ServiceOrder, ServiceItem, ServiceProviderProfile } = db;

const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data });
const fail = (res, msg, statusCode = 400) => res.status(statusCode).json({ code: 1, msg });
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
    status: row.status,
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
    const serviceId = Number(body.service_id || body.serviceId || 0);
    const providerId = Number(body.provider_id || body.providerId || 0);
    if (!serviceId && !providerId) return fail(res, '缺少 service_id 或 provider_id');

    let service = null;
    if (serviceId) {
      service = await ServiceItem.findByPk(serviceId);
      if (!service) return fail(res, '服务不存在', 404);
    }

    const orderNo = `SV${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
    const row = await ServiceOrder.create({
      order_no: orderNo,
      user_id: userId,
      provider_id: providerId || (service ? service.provider_id : null),
      service_id: serviceId || null,
      service_title_snapshot: service ? (service.title || service.name) : (body.service_title || body.title || ''),
      status: 'pending_pay',
      pay_status: 'unpaid',
      pay_amount: parseFloat(body.pay_amount || body.amount || 0) || 0,
      amount: parseFloat(body.amount || body.pay_amount || 0) || 0,
      contact_name: String(body.contact_name || body.name || '').trim() || null,
      contact_phone: String(body.contact_phone || body.phone || '').trim() || null,
      address: String(body.address || body.service_address || '').trim() || null,
      service_address: String(body.service_address || body.address || '').trim() || null,
      appointment_time: body.appointment_time || body.book_time || null,
      book_time: String(body.book_time || body.appointment_time || '').trim() || null,
      remark: String(body.remark || '').trim() || null
    });
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
    // DEBUG: 打印查询参数
    console.log('[DEBUG service-order/my] query=', query, 'where=', where, 'userId=', userId);
    const { count, rows } = await ServiceOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    console.log('[DEBUG service-order/my] result count=', count, 'rows=', rows.length, 'statuses=', rows.map(r => r.status));
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
    await row.update({ status: 'pending_accept', pay_status: 'paid', paid_at: new Date() });
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
