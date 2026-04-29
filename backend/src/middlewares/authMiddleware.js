/**
 * JWT 认证中间件
 *
 * 从请求头 Authorization: Bearer <token> 中解析并验证 JWT，
 * 将解码后的用户信息挂载到 req.user。
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

module.exports = (req, res, next) => {
  if (process.env.DEBUG_SKIP_AUTH === '1') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
      } catch (_err) {
        // 调试模式下忽略无效 token，走兜底用户
      }
    }
    const fallbackUserId = parseInt(process.env.DEBUG_DEFAULT_USER_ID || '1', 10) || 1;
    req.user = {
      id: fallbackUserId,
      user_id: fallbackUserId,
      role: 'debug'
    };
    return next();
  }
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, msg: '缺少认证信息' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, msg: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 1, msg: '无效的认证信息' });
  }
};
