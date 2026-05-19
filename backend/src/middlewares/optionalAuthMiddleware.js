const jwt = require('jsonwebtoken');

/** 有合法用户 JWT 时挂载 req.user，否则继续（用于可选登录的读接口） */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    if (decoded && decoded.admin !== true) req.user = decoded;
  } catch (e) { /* ignore */ }
  next();
};
