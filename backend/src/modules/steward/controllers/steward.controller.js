const db = require('../../../models');
const { CommunityStewardApplication, CommunityStewardProfile, User } = db;

function requireAdmin(req, res) {
  if (req.user && (req.user.admin === true || req.user.role === 'admin')) return true;
  res.status(403).json({ code: 1, msg: '无权限' });
  return false;
}

async function upsertProfileFromApplication(record) {
  const payload = {
    user_id: record.user_id,
    community_id: record.community_id || null,
    community_name: record.community_name || '',
    name: record.name || '',
    phone: record.phone || '',
    status: 'active'
  };
  const [profile] = await CommunityStewardProfile.findOrCreate({
    where: { user_id: record.user_id },
    defaults: payload
  });
  if (profile) await profile.update(payload);
}

// POST /steward/apply
exports.apply = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const body = req.body || {};
    const payload = {
      user_id: userId,
      name: body.name || '',
      phone: body.phone || '',
      gender: body.gender || '',
      community_id: body.community_id ? Number(body.community_id) : null,
      community_name: body.community_name || body.community || '',
      id_card: body.id_card || '',
      id_card_url: body.id_card_url || '',
      intro: body.intro || '',
      status: 'pending',
      reject_reason: ''
    };
    if (!payload.name || !payload.phone || !payload.community_name) {
      return res.status(400).json({ code: 1, msg: '请填写姓名、手机号与服务社区' });
    }
    const [record, created] = await CommunityStewardApplication.findOrCreate({
      where: { user_id: userId },
      defaults: payload
    });
    if (!created && record) {
      if (record.status === 'approved') {
        return res.json({ code: 0, msg: '您已是认证小区管家', data: { status: 'approved' } });
      }
      await record.update(Object.assign({}, payload, {
        status: 'pending',
        reject_reason: '',
        reviewed_by: null,
        reviewed_at: null
      }));
    }
    return res.json({ code: 0, msg: '提交成功', data: { status: 'pending' } });
  } catch (err) {
    console.error('[steward/apply]', err);
    return res.status(500).json({ code: 1, msg: '提交失败，请重试' });
  }
};

// GET /steward/application/me
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const record = await CommunityStewardApplication.findOne({ where: { user_id: userId } });
    if (!record) return res.status(404).json({ code: 1, msg: '暂无申请记录' });
    return res.json({ code: 0, data: record });
  } catch (err) {
    console.error('[steward/application/me]', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

// GET /steward/profile/me
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    const app = await CommunityStewardApplication.findOne({ where: { user_id: userId } });
    if (!app || app.status !== 'approved') {
      return res.status(403).json({ code: 1, msg: '尚未通过管家入驻审核' });
    }
    const profile = await CommunityStewardProfile.findOne({ where: { user_id: userId } });
    return res.json({
      code: 0,
      data: {
        application: app,
        profile: profile || {
          community_name: app.community_name,
          name: app.name,
          phone: app.phone,
          hotline: ''
        }
      }
    });
  } catch (err) {
    console.error('[steward/profile/me]', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

// GET /steward/applications
exports.getApplications = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { status, page = 1, pageSize = 20 } = req.query || {};
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await CommunityStewardApplication.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize)
    });
    return res.json({
      code: 0,
      data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (err) {
    console.error('[steward/applications]', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

// POST /steward/applications/:id/review
exports.reviewApplication = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const id = Number(req.params.id);
    const reviewerId = req.user && req.user.id ? Number(req.user.id) : 0;
    const { status, reject_reason } = req.body || {};
    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 1, msg: '参数错误' });
    }
    const record = await CommunityStewardApplication.findByPk(id);
    if (!record) return res.status(404).json({ code: 1, msg: '申请记录不存在' });
    await record.update({
      status,
      reject_reason: status === 'rejected' ? (reject_reason || '') : '',
      reviewed_by: reviewerId,
      reviewed_at: new Date()
    });
    if (status === 'approved') {
      await upsertProfileFromApplication(record);
      if (User) {
        try {
          await User.update(
            { steward_status: 'approved' },
            { where: { id: record.user_id } }
          );
        } catch (e) { /* User 表可能无 steward_status 列 */ }
      }
    }
    return res.json({ code: 0, msg: '审核完成', data: { id, status } });
  } catch (err) {
    console.error('[steward/applications/review]', err);
    return res.status(500).json({ code: 1, msg: '审核失败' });
  }
};
