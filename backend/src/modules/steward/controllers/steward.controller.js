const db = require('../../../models');
const { CommunityStewardApplication, CommunityStewardProfile, User } = db;

function resolveUserId(req) {
  const raw = req.user && (req.user.id != null ? req.user.id : req.user.sub);
  if (raw == null || raw === '') return null;
  return String(raw);
}

function requireAdmin(req, res) {
  if (req.user && (req.user.admin === true || req.user.role === 'admin')) return true;
  res.status(403).json({ code: 1, msg: '无权限' });
  return false;
}

function reviewerIdFromReq(req) {
  if (!req.user) return null;
  const raw = req.user.id != null ? req.user.id : req.user.sub;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function syncUserStewardStatus(userId, status) {
  if (!User || !userId) return;
  try {
    await User.update({ steward_status: status }, { where: { id: userId } });
  } catch (e) { /* User 表可能无 steward_status 列 */ }
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

// GET /steward/public/info — 居民侧展示本小区管家热线（无需登录，可选带 community_id）
exports.getPublicInfo = async (req, res) => {
  try {
    const communityId = req.query.community_id ? Number(req.query.community_id) : null;
    const communityName = (req.query.community_name || req.query.community || '').trim();
    if (!communityId && !communityName) {
      return res.status(400).json({ code: 1, msg: '请传 community_id 或 community_name' });
    }
    const where = { status: 'active' };
    if (communityId) where.community_id = communityId;
    else where.community_name = communityName;

    const profile = await CommunityStewardProfile.findOne({
      where,
      order: [['updated_at', 'DESC']]
    });
    if (!profile) {
      return res.json({
        code: 0,
        data: { name: '', phone: '', hotline: '400-000-0000', community_name: communityName || '' }
      });
    }
    const p = profile.get ? profile.get({ plain: true }) : profile;
    return res.json({
      code: 0,
      data: {
        name: p.name || '',
        phone: p.phone || '',
        hotline: p.hotline || p.phone || '400-000-0000',
        community_name: p.community_name || communityName || '',
        community_id: p.community_id || communityId || null
      }
    });
  } catch (err) {
    console.error('[steward/public/info]', err);
    return res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

// POST /steward/apply
exports.apply = async (req, res) => {
  try {
    const userId = resolveUserId(req);
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
    await syncUserStewardStatus(userId, 'pending');
    return res.json({ code: 0, msg: '提交成功', data: { status: 'pending' } });
  } catch (err) {
    console.error('[steward/apply]', err);
    return res.status(500).json({ code: 1, msg: '提交失败，请重试' });
  }
};

// GET /steward/application/me
exports.getMyApplication = async (req, res) => {
  try {
    const userId = resolveUserId(req);
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
    const userId = resolveUserId(req);
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
    const reviewerId = reviewerIdFromReq(req);
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
      await syncUserStewardStatus(record.user_id, 'approved');
    } else if (status === 'rejected') {
      await syncUserStewardStatus(record.user_id, 'rejected');
    }
    return res.json({ code: 0, msg: '审核完成', data: { id, status } });
  } catch (err) {
    console.error('[steward/applications/review]', err);
    return res.status(500).json({ code: 1, msg: '审核失败' });
  }
};
