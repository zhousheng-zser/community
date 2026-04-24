const jwt = require('jsonwebtoken');
const { User, WorkerApplication, WorkerProfile } = require('../models');

/**
 * POST /api/v1/worker-portal/login
 * body: { phone, code } — 开发环境默认验证码 123456 或环境变量 WORKER_PORTAL_SMS_CODE
 */
exports.login = async (req, res) => {
  try {
    const phone = req.body && req.body.phone != null ? String(req.body.phone).trim() : '';
    const code = req.body && req.body.code != null ? String(req.body.code).trim() : '';
    if (!phone || !code) {
      return res.status(400).json({ errno: 400, errmsg: '请填写手机号与验证码' });
    }
    const expect = process.env.WORKER_PORTAL_SMS_CODE || '123456';
    if (code !== expect) {
      return res.status(400).json({ errno: 400, errmsg: '验证码错误' });
    }
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ errno: 404, errmsg: '该手机号未注册，请先在小程序登录绑定手机' });
    }
    const app = await WorkerApplication.findOne({ where: { user_id: user.id, status: 'approved' } });
    const prof = await WorkerProfile.findOne({ where: { user_id: user.id, status: 'active' } });
    if (!app || !prof) {
      return res.status(403).json({ errno: 403, errmsg: '当前账号非已审核通过的技工' });
    }
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { id: user.id, openid: user.openid, portal: 'worker' },
      secret,
      { expiresIn: '7d' }
    );
    return res.json({
      errno: 0,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          phone: user.phone,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (e) {
    console.error('workerPortalLogin', e);
    return res.status(500).json({ errno: 500, errmsg: '登录失败' });
  }
};
