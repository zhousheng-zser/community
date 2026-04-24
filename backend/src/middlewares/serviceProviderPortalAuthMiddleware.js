const jwt = require('jsonwebtoken');

/** 服务商运行中台 JWT：payload.portal === service_provider */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errno: 401, errmsg: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    if (!decoded || decoded.portal !== 'service_provider' || !decoded.profile_id || decoded.provider_user_id == null) {
      return res.status(403).json({ errno: 403, errmsg: '非服务商门户令牌' });
    }
    req.spPortal = {
      profile_id: Number(decoded.profile_id),
      provider_user_id: Number(decoded.provider_user_id),
      sp_account_id: decoded.sp_account_id != null ? Number(decoded.sp_account_id) : null
    };
    next();
  } catch (e) {
    return res.status(401).json({ errno: 401, errmsg: '无效或已过期的 Token' });
  }
};
