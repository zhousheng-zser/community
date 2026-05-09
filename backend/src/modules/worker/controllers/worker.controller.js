const db = require('../../../models');
const { WorkerApplication, ServiceOrder } = db;
const orderPoints = require('../../../services/orderPoints.service');

// POST /worker/apply
exports.apply = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) {
      return res.status(401).json({ code: 1, msg: '未登录' });
    }
    const body = req.body || {};
    const payload = {
      user_id: userId,
      name: body.name || '',
      phone: body.phone || '',
      industry: body.industry || '',
      education: body.education || '',
      city: body.city || '',
      resume: body.resume || '',
      id_card_url: body.id_card_url || '',
      work_photo_url: body.work_photo_url || '',
      certificate_url: body.certificate_url || [],
      services: body.services || [],
      status: 'pending',
      reject_reason: ''
    };
    // 同一用户若有已存在的申请记录，更新它（避免重复提交多条）
    const [record, created] = await WorkerApplication.findOrCreate({
      where: { user_id: userId },
      defaults: payload
    });
    if (!created && record) {
      // 若已有记录且状态为 pending/rejected，允许更新；approved 则不允许覆盖
      if (record.status === 'approved') {
        return res.json({ code: 0, msg: '您已是认证技工，无需重复申请', data: { status: 'approved' } });
      }
      await record.update(Object.assign({}, payload, { status: 'pending', reject_reason: '', reviewed_by: null, reviewed_at: null }));
    }
    return res.json({ code: 0, msg: '提交成功', data: { status: 'pending' } });
  } catch (err) {
    console.error('[worker/apply] error:', err);
    return res.status(500).json({ code: 1, msg: '提交失败，请重试' });
  }
};

// GET /worker/applications
exports.getApplications = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query || {};
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await WorkerApplication.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize)
    });
    return res.json({ code: 0, data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('[worker/applications] error:', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

// POST /worker/applications/:id/review
exports.reviewApplication = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reviewerId = req.user && req.user.id ? Number(req.user.id) : 0;
    const { status, reject_reason } = req.body || {};
    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 1, msg: '参数错误' });
    }
    const record = await WorkerApplication.findByPk(id);
    if (!record) {
      return res.status(404).json({ code: 1, msg: '申请记录不存在' });
    }
    await record.update({
      status,
      reject_reason: status === 'rejected' ? (reject_reason || '') : '',
      reviewed_by: reviewerId,
      reviewed_at: new Date()
    });
    return res.json({ code: 0, msg: '审核完成', data: { id, status } });
  } catch (err) {
    console.error('[worker/applications/review] error:', err);
    return res.status(500).json({ code: 1, msg: '审核失败' });
  }
};

// GET /worker/application/me
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) {
      return res.status(401).json({ code: 1, msg: '未登录' });
    }
    const record = await WorkerApplication.findOne({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
    if (!record) {
      return res.status(404).json({ code: 1, msg: '暂无申请记录' });
    }
    return res.json({ code: 0, data: record });
  } catch (err) {
    console.error('[worker/application/me] error:', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

function getWorkerUserId(req) {
  return req.user && req.user.id ? Number(req.user.id) : 0;
}

function normalizeWorkerOrder(row) {
  if (!row) return null;
  let evidenceImages = [];
  try { evidenceImages = JSON.parse(row.evidence_images || '[]'); } catch (e) {}
  return {
    id: row.id,
    order_no: row.order_no,
    orderNo: row.order_no,
    user_id: row.user_id,
    customer_user_id: row.user_id,
    provider_id: row.provider_id,
    service_id: row.service_id,
    service_title: row.service_title_snapshot || '',
    title: row.service_title_snapshot || '',
    worker_id: row.worker_id,
    worker_user_id: row.worker_user_id,
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

// GET /worker/service-orders
exports.getOrders = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const where = { worker_user_id: userId };
    if (query.status) where.status = String(query.status);
    const { count, rows } = await ServiceOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return res.json({ code: 0, data: { list: rows.map(normalizeWorkerOrder), total: count, page, limit } });
  } catch (err) {
    console.error('[worker/orders]', err);
    return res.status(500).json({ code: 1, msg: '获取订单列表失败' });
  }
};

// GET /worker/service-orders/:id
exports.getOrderDetail = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ code: 1, msg: '无效订单ID' });
    const row = await ServiceOrder.findOne({ where: { id, worker_user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '订单不存在' });
    return res.json({ code: 0, data: { order: normalizeWorkerOrder(row) } });
  } catch (err) {
    console.error('[worker/order/detail]', err);
    return res.status(500).json({ code: 1, msg: '获取订单详情失败' });
  }
};

// POST /worker/service-orders/:id/accept
exports.acceptOrder = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ code: 1, msg: '无效订单ID' });
    const row = await ServiceOrder.findOne({ where: { id, worker_user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (row.status !== 'dispatched') return res.status(400).json({ code: 1, msg: '当前状态不可接单' });
    await row.update({ status: 'in_service', worker_user_id: userId });
    return res.json({ code: 0, data: { id: row.id, status: row.status }, msg: '接单成功' });
  } catch (err) {
    console.error('[worker/order/accept]', err);
    return res.status(500).json({ code: 1, msg: '接单失败' });
  }
};

// POST /worker/service-orders/:id/reject
exports.rejectOrder = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ code: 1, msg: '无效订单ID' });
    const row = await ServiceOrder.findOne({ where: { id, worker_user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (row.status !== 'dispatched') return res.status(400).json({ code: 1, msg: '当前状态不可拒单' });
    const note = String((req.body || {}).reason || '技工拒单').trim();
    if (row.pay_status === 'paid') {
      await orderPoints.revokePointsOnOrderRefund(ServiceOrder, row, null);
    }
    await row.update({
      status: 'cancelled',
      pay_status: row.pay_status === 'paid' ? 'refunded' : row.pay_status,
      cancel_reason: note,
      cancelled_at: new Date()
    });
    return res.json({ code: 0, data: { id: row.id, status: row.status }, msg: '已拒单' });
  } catch (err) {
    console.error('[worker/order/reject]', err);
    return res.status(500).json({ code: 1, msg: '拒单失败' });
  }
};

// POST /worker/service-orders/:id/check-in
exports.checkIn = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ code: 1, msg: '无效订单ID' });
    const row = await ServiceOrder.findOne({ where: { id, worker_user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (!['dispatched', 'in_service'].includes(String(row.status))) {
      return res.status(400).json({ code: 1, msg: '当前状态不可打卡' });
    }
    const body = req.body || {};
    const location = body.location || body.check_in_location || '';
    await row.update({
      status: 'in_service',
      check_in_at: new Date(),
      check_in_location: location,
      worker_user_id: userId
    });
    return res.json({ code: 0, data: { id: row.id, status: row.status, check_in_at: row.check_in_at }, msg: '打卡成功' });
  } catch (err) {
    console.error('[worker/order/check-in]', err);
    return res.status(500).json({ code: 1, msg: '打卡失败' });
  }
};

// POST /worker/service-orders/:id/evidence
exports.uploadEvidence = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ code: 1, msg: '无效订单ID' });
    const row = await ServiceOrder.findOne({ where: { id, worker_user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (!['in_service', 'dispatched'].includes(String(row.status))) {
      return res.status(400).json({ code: 1, msg: '当前状态不可上传凭证' });
    }
    const body = req.body || {};
    const images = Array.isArray(body.urls) ? body.urls : (Array.isArray(body.proof_images) ? body.proof_images : []);
    const note = String(body.note || '').trim();
    let existing = [];
    try { existing = JSON.parse(row.evidence_images || '[]'); } catch (e) {}
    const merged = Array.isArray(existing) ? existing.concat(images) : images;
    await row.update({ evidence_images: JSON.stringify(merged.slice(0, 10)), evidence_note: note || row.evidence_note || '' });
    return res.json({ code: 0, data: { id: row.id, evidence_images: merged.slice(0, 10) }, msg: '上传成功' });
  } catch (err) {
    console.error('[worker/order/evidence]', err);
    return res.status(500).json({ code: 1, msg: '上传凭证失败' });
  }
};

// POST /worker/service-orders/:id/complete
exports.completeOrder = async (req, res) => {
  try {
    const userId = getWorkerUserId(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ code: 1, msg: '无效订单ID' });
    const row = await ServiceOrder.findOne({ where: { id, worker_user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (!['in_service', 'dispatched'].includes(String(row.status))) {
      return res.status(400).json({ code: 1, msg: '当前状态不可完成' });
    }
    await row.update({ status: 'pending_user_confirm', completed_at: new Date() });
    return res.json({ code: 0, data: { id: row.id, status: row.status }, msg: '服务已完成' });
  } catch (err) {
    console.error('[worker/order/complete]', err);
    return res.status(500).json({ code: 1, msg: '完成服务失败' });
  }
};

// ===== 技工服务管理 =====

const db = require('../../../models');
const WorkerService = db.WorkerService;

// GET /worker/services
exports.getMyServices = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;

    const { count, rows } = await WorkerService.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page,
        limit
      }
    });
  } catch (err) {
    console.error('[worker/services] error:', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

// POST /worker/services
exports.createService = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });

    const { name, price, desc } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ code: 1, msg: '服务名称不能为空' });
    }

    const row = await WorkerService.create({
      user_id: userId,
      name: String(name).trim(),
      price: price != null ? String(price) : null,
      desc: desc || null,
      status: 'active'
    });

    return res.json({ code: 0, msg: '创建成功', data: row });
  } catch (err) {
    console.error('[worker/services/create] error:', err);
    return res.status(500).json({ code: 1, msg: '创建失败' });
  }
};

// PATCH /worker/services/:id
exports.updateService = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });

    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ code: 1, msg: '无效服务ID' });

    const row = await WorkerService.findOne({ where: { id, user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '服务不存在' });

    const { name, price, desc, status } = req.body || {};
    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (price !== undefined) updateData.price = price != null ? String(price) : null;
    if (desc !== undefined) updateData.desc = desc || null;
    if (status !== undefined) updateData.status = status;

    await row.update(updateData);
    return res.json({ code: 0, msg: '更新成功', data: row });
  } catch (err) {
    console.error('[worker/services/update] error:', err);
    return res.status(500).json({ code: 1, msg: '更新失败' });
  }
};

// POST /worker/services/:id/delete
exports.deleteService = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });

    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ code: 1, msg: '无效服务ID' });

    const row = await WorkerService.findOne({ where: { id, user_id: userId } });
    if (!row) return res.status(404).json({ code: 1, msg: '服务不存在' });

    await row.destroy();
    return res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    console.error('[worker/services/delete] error:', err);
    return res.status(500).json({ code: 1, msg: '删除失败' });
  }
};
