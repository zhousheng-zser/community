const { WorkerApplication } = require('../../../models');

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

// GET /worker/service-orders
exports.getOrders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /worker/service-orders/:id
exports.getOrderDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/accept
exports.acceptOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/reject
exports.rejectOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/check-in
exports.checkIn = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/evidence
exports.uploadEvidence = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/complete
exports.completeOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
