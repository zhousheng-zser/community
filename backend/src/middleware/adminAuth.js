const jwt = require('jsonwebtoken');

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/** 生产必须在 .env 配置；开发未配置时使用临时值，避免登录直接 500 */
function getSecret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (s && String(s).length >= 8) return s;
  if (isProduction()) {
    throw new Error('生产环境必须在 .env 配置 ADMIN_JWT_SECRET（至少 8 位）');
  }
  console.warn(
    '[admin] 开发环境未配置 ADMIN_JWT_SECRET，已使用内置临时密钥；部署生产前请务必写入 .env'
  );
  return 'dev_only_admin_jwt_secret_min_len_ok_32chars!';
}

/** 生产必须在 .env 配置；开发默认 admin123 */
function getAdminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (p != null && String(p) !== '') return String(p);
  if (isProduction()) return null;
  console.warn(
    '[admin] 开发环境未配置 ADMIN_PASSWORD，默认密码为 admin123；部署生产前请务必写入 .env'
  );
  return 'admin123';
}

function adminAuthMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1].trim() : '';
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录或令牌缺失' });
  }
  let secret;
  try {
    secret = getSecret();
  } catch (e) {
    return res.status(500).json({ code: 500, message: '服务端未正确配置 ADMIN_JWT_SECRET' });
  }
  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限' });
    }
    req.admin = { username: payload.sub };
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
  }
}

module.exports = {
  adminAuthMiddleware,
  getSecret,
  getAdminPassword
};
