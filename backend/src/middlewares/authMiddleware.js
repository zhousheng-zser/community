/**
 * JWT 认证中间件
 *
 * 从请求头 Authorization: Bearer <token> 中解析并验证 JWT，
 * 将解码后的用户信息挂载到 req.user。
 * 雪花 ID 禁止 Number 转换；logout 后 token_version 不匹配则拒绝。
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { resolveUserId } = require('../utils/resolveUserId');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, msg: '缺少认证信息' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.admin !== true) {
      const userId = resolveUserId(decoded.id);
      if (userId) {
        const user = await User.findByPk(userId, { attributes: ['token_version'] });
        if (!user) {
          return res.status(401).json({ code: 401, msg: '用户不存在或已注销' });
        }
        const tokenVer = Number(decoded.token_version || 0);
        const dbVer = Number(user.token_version || 0);
        if (tokenVer !== dbVer) {
          return res.status(401).json({ code: 401, msg: '登录已失效，请重新登录' });
        }
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, msg: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 1, msg: '无效的认证信息' });
  }
};
