const { User } = require('../../../models');
const { MerchantShop } = require('../../../models');
const crypto = require('crypto');

const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data });
const fail = (res, msg, statusCode = 400) => res.status(statusCode).json({ code: 1, msg });

// GET /user/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return fail(res, '未登录', 401);

    // 优先从本地 User 表查询
    let user = null;
    try {
      user = await User.findByPk(userId, {
        attributes: ['id', 'nickname', 'userName', 'name', 'avatar_url', 'avatarUrl', 'avatar',
          'phone', 'userMobile', 'mobile', 'role', 'roles', 'community_id', 'communityId',
          'worker_status', 'workerStatus', 'points', 'created_at', 'updated_at']
      });
    } catch (e) {
      // User 表可能由主后端管理，本地缺失则跳过
    }

    // 基础用户信息（从 JWT token 中回退）
    const baseUser = req.user || {};
    const result = {
      id: userId,
      nickname: user && (user.nickname || user.userName || user.name) ? (user.nickname || user.userName || user.name) : (baseUser.nickname || baseUser.name || ''),
      userName: user && (user.nickname || user.userName || user.name) ? (user.nickname || user.userName || user.name) : (baseUser.nickname || baseUser.name || ''),
      name: user && (user.nickname || user.userName || user.name) ? (user.nickname || user.userName || user.name) : (baseUser.nickname || baseUser.name || ''),
      avatar_url: user && (user.avatar_url || user.avatarUrl || user.avatar) ? (user.avatar_url || user.avatarUrl || user.avatar) : (baseUser.avatar_url || baseUser.avatar || ''),
      avatarUrl: user && (user.avatar_url || user.avatarUrl || user.avatar) ? (user.avatar_url || user.avatarUrl || user.avatar) : (baseUser.avatar_url || baseUser.avatar || ''),
      phone: user && (user.phone || user.userMobile || user.mobile) ? (user.phone || user.userMobile || user.mobile) : (baseUser.phone || baseUser.mobile || ''),
      userMobile: user && (user.phone || user.userMobile || user.mobile) ? (user.phone || user.userMobile || user.mobile) : (baseUser.phone || baseUser.mobile || ''),
      role: user && user.role ? user.role : (baseUser.role || 'user'),
      roles: user && user.roles ? user.roles : (baseUser.roles || [baseUser.role || 'user']),
      community_id: user && (user.community_id != null ? user.community_id : user.communityId) ? (user.community_id != null ? user.community_id : user.communityId) : (baseUser.community_id || baseUser.communityId || null),
      communityId: user && (user.community_id != null ? user.community_id : user.communityId) ? (user.community_id != null ? user.community_id : user.communityId) : (baseUser.community_id || baseUser.communityId || null),
      worker_status: user && (user.worker_status || user.workerStatus) ? (user.worker_status || user.workerStatus) : (baseUser.worker_status || baseUser.workerStatus || ''),
      workerStatus: user && (user.worker_status || user.workerStatus) ? (user.worker_status || user.workerStatus) : (baseUser.worker_status || baseUser.workerStatus || ''),
      points: user && user.points != null ? Number(user.points) : (baseUser.points || 0)
    };

    // 查询集市商家店铺信息
    try {
      const shop = await MerchantShop.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });
      if (shop) {
        result.merchant_status = shop.status;
        result.merchantStatus = shop.status;
        result.shop_id = shop.id;
        result.shopId = shop.id;
        result.shop_name = shop.name;
        result.shopName = shop.name;
        result.shop_status = shop.status;
        result.shopStatus = shop.status;
      } else {
        result.merchant_status = '';
        result.merchantStatus = '';
        result.shop_id = null;
        result.shopId = null;
        result.shop_name = '';
        result.shopName = '';
      }
    } catch (e) {
      result.merchant_status = '';
      result.merchantStatus = '';
      result.shop_id = null;
      result.shopId = null;
    }

    ok(res, result);
  } catch (err) {
    console.error('[user/profile]', err);
    fail(res, '获取用户信息失败', 500);
  }
};

// PATCH /user/profile
exports.updateProfile = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /user/addresses
exports.getAddresses = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /user/addresses
exports.addAddress = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /user/addresses/:id
exports.updateAddress = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /user/addresses/:id
exports.deleteAddress = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /user/invite-code
exports.getInviteCode = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return fail(res, '未登录', 401);

    const user = await User.findByPk(userId);
    if (!user) return fail(res, '用户不存在', 404);

    let code = user.invite_code;
    if (!code) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await User.findOne({ where: { invite_code: code } });
      if (existing) code = userId.toString(36).toUpperCase() + code.slice(0, 3);
      await user.update({ invite_code: code });
    }

    const inviteeCount = await User.count({ where: { invited_by: userId } });
    let inviterNickname = null;
    if (user.invited_by) {
      const inviter = await User.findByPk(user.invited_by, { attributes: ['nickname', 'userName', 'name'] });
      if (inviter) inviterNickname = inviter.nickname || inviter.userName || inviter.name;
    }

    ok(res, {
      invite_code: code,
      invitee_count: inviteeCount,
      invited_by: user.invited_by || null,
      inviter_nickname: inviterNickname,
      inviter: user.invited_by ? { nickname: inviterNickname } : null
    });
  } catch (err) {
    console.error('[user/invite-code]', err);
    fail(res, '获取邀请码失败', 500);
  }
};

// POST /user/bind-inviter
exports.bindInviter = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return fail(res, '未登录', 401);

    const { invite_code } = req.body;
    if (!invite_code) return fail(res, '请输入邀请码');

    const user = await User.findByPk(userId);
    if (!user) return fail(res, '用户不存在', 404);
    if (user.invited_by) return fail(res, '已绑定邀请人，不可重复绑定');

    const inviter = await User.findOne({ where: { invite_code: String(invite_code).trim() } });
    if (!inviter) return fail(res, '邀请码无效');
    if (inviter.id === userId) return fail(res, '不能邀请自己');

    await user.update({ invited_by: inviter.id });

    const commissionService = require('../../commission/services/commission.service');
    try {
      await commissionService.assignPromoterRole(inviter.id);
    } catch (e) {
      console.warn('[bind-inviter] auto-assign promoter role failed:', e.message);
    }

    ok(res, {
      inviter_id: inviter.id,
      inviter_nickname: inviter.nickname || inviter.userName || inviter.name || '',
      inviter: { nickname: inviter.nickname || inviter.userName || inviter.name || '' }
    }, '绑定成功');
  } catch (err) {
    console.error('[user/bind-inviter]', err);
    fail(res, '绑定邀请人失败', 500);
  }
};

// GET /user/invitees
exports.getInvitees = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : 0;
    if (!userId) return fail(res, '未登录', 401);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await User.findAndCountAll({
      where: { invited_by: userId },
      attributes: ['id', 'nickname', 'userName', 'name', 'avatar_url', 'avatarUrl', 'phone', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const list = result.rows.map(u => ({
      id: u.id,
      nickname: u.nickname || u.userName || u.name || '',
      avatar_url: u.avatar_url || u.avatarUrl || '',
      created_at: u.created_at
    }));

    ok(res, { list, total: result.count, page });
  } catch (err) {
    console.error('[user/invitees]', err);
    fail(res, '获取邀请列表失败', 500);
  }
};
