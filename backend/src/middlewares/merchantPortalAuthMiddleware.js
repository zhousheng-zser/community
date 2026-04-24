const jwt = require('jsonwebtoken');

/** 服务商/店铺后台 JWT：payload 须含 portal=merchant 与 shop_id */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errno: 401, code: 401, msg: '未登录', errmsg: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    if (!decoded || decoded.portal !== 'merchant' || !decoded.shop_id) {
      return res.status(403).json({ errno: 403, code: 403, msg: '非商户令牌', errmsg: '非商户令牌' });
    }
    req.merchantAuth = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ errno: 401, code: 401, msg: '无效令牌', errmsg: '无效或已过期的 Token' });
  }
};
