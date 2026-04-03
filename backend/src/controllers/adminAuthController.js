const jwt = require('jsonwebtoken');
const { getSecret, getAdminPassword } = require('../middleware/adminAuth');

/** 测试阶段：backend/.env 设置 ADMIN_TEST_BYPASS=1 则只校验用户名，不校验密码（上线务必关闭） */
function isTestBypass() {
  const v = process.env.ADMIN_TEST_BYPASS;
  return v === '1' || v === 'true' || v === 'yes';
}

function login(req, res) {
  try {
    const username = (req.body && req.body.username) ? String(req.body.username).trim() : '';
    const password = (req.body && req.body.password) ? String(req.body.password) : '';
    const expectUser = (process.env.ADMIN_USERNAME || 'admin').trim();

    if (isTestBypass()) {
      console.warn('[admin] ADMIN_TEST_BYPASS 已开启：免密登录，上线前务必关闭');
      if (!username || username !== expectUser) {
        return res.status(401).json({
          code: 401,
          message: `测试免密模式：用户名须为「${expectUser}」（与 ADMIN_USERNAME 一致）`
        });
      }
    } else {
      const expectPass = getAdminPassword();
      if (expectPass === null) {
        return res.status(500).json({ code: 500, message: '生产环境必须在 .env 配置 ADMIN_PASSWORD' });
      }
      if (username !== expectUser || password !== expectPass) {
        return res.status(401).json({ code: 401, message: '账号或密码错误' });
      }
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
