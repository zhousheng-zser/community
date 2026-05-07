const { User } = require('../../../models');

// POST /auth/login - 微信小程序登录
exports.login = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/login_password - 账号密码登录
exports.loginPassword = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/register - 用户注册
exports.register = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/sms-code - 发送短信验证码
exports.sendSmsCode = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /auth/admin/login - 管理员登录
exports.adminLogin = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
