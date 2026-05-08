"""Patch serviceProviderPortalAuthMiddleware.js to accept user JWT (like merchantPortalAuthMiddleware)"""

NEW_CONTENT = r"""const jwt = require('jsonwebtoken');
const { sequelize } = require('../models');

/** 查找当前用户的 service_provider_profiles 记录 */
async function resolveProfileFromUserToken(decoded) {
  const userId = decoded && (decoded.id || decoded.user_id || decoded.sub);
  if (!userId) return null;
  try {
    const [rows] = await sequelize.query(
      'SELECT id FROM service_provider_profiles WHERE user_id = ? AND status = ? LIMIT 1',
      { replacements: [Number(userId), 'active'] }
    );
    if (!rows || !rows.length) return null;
    return { profile_id: Number(rows[0].id), provider_user_id: Number(userId) };
  } catch (e) {
    console.error('resolveProfileFromUserToken error:', e.message);
    return null;
  }
}

/** 服务商运行中台 JWT，兼容用户 JWT 直连（DEBUG_SKIP_SP_PORTAL_TOKEN=1 时启用） */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const debugSkip = process.env.DEBUG_SKIP_SP_PORTAL_TOKEN === '1';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errno: 401, errmsg: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    // 原始服务商门户令牌路径
    if (decoded && decoded.portal === 'service_provider' && decoded.profile_id && decoded.provider_user_id != null) {
      req.spPortal = {
        profile_id: Number(decoded.profile_id),
        provider_user_id: Number(decoded.provider_user_id),
        sp_account_id: decoded.sp_account_id != null ? Number(decoded.sp_account_id) : null
      };
      return next();
    }

    // 调试/联调：允许普通用户 JWT 直连（按 user_id 查 SP profile）
    if (debugSkip) {
      const resolved = await resolveProfileFromUserToken(decoded);
      if (resolved) {
        req.spPortal = { ...resolved, via: 'debug_user_token' };
        return next();
      }
      return res.status(403).json({ errno: 403, errmsg: '当前用户未入驻直约服务商' });
    }

    return res.status(403).json({ errno: 403, errmsg: '非服务商门户令牌' });
  } catch (e) {
    return res.status(401).json({ errno: 401, errmsg: '无效或已过期的 Token' });
  }
};
"""

filepath = '/home/cw/a/community-backend/backend/src/middlewares/serviceProviderPortalAuthMiddleware.js'
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(NEW_CONTENT)
print('OK: patched', filepath)
