const jwt = require('jsonwebtoken');
const { getSecret, getAdminPassword } = require('../middleware/adminAuth');

function login(req, res) {
  try {
    const username = (req.body && req.body.username) ? String(req.body.username).trim() : '';
    const password = (req.body && req.body.password) ? String(req.body.password) : '';
    const expectUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const expectPass = getAdminPassword();
    if (expectPass === null) {
      return res.status(500).json({ code: 500, message: '生产环境必须在 .env 配置 ADMIN_PASSWORD' });
    }
    if (username !== expectUser || password !== expectPass) {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }
    let secret;
    try {
      secret = getSecret();
    } catch (e) {
      return res.status(500).json({ code: 500, message: e.message || '请配置 ADMIN_JWT_SECRET' });
    }
    const token = jwt.sign(
      { role: 'admin', sub: username },
      secret,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES || '12h' }
    );
    return res.json({
      code: 200,
      message: 'ok',
      data: { token, username }
    });
  } catch (e) {
    console.error('[admin/login]', e);
    return res.status(500).json({ code: 500, message: e.message || '登录失败' });
  }
}

module.exports = { login };
