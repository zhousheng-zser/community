const { User } = require('../../../models');
const { MerchantShop } = require('../../../models');

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
          'worker_status', 'workerStatus', 'created_at', 'updated_at']
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
      workerStatus: user && (user.worker_status || user.workerStatus) ? (user.worker_status || user.workerStatus) : (baseUser.worker_status || baseUser.workerStatus || '')
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
