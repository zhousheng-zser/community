/**
 * 认证模块 API
 * 对应后端文档：一、认证模块
 */
const { post, get } = require('../utils/util.js');

/**
 * 微信小程序登录
 * POST /auth/login
 */
const wechatLogin = (data) => {
  return post('/auth/login', data);
};

/**
 * 账号密码登录
 * POST /auth/login_password
 */
const accountLogin = (data) => {
  return post('/auth/login_password', data);
};

/**
 * 手机号验证码登录
 * POST /auth/login_sms
 */
const smsLogin = (data) => {
  return post('/auth/login_sms', data);
};

/**
 * 用户注册
 * POST /auth/register
 */
const register = (data) => {
  return post('/auth/register', data);
};

/**
 * 发送短信验证码
 * POST /auth/sms/send
 */
const sendSmsCode = (data) => {
  return post('/auth/sms/send', data);
};

/**
 * 校验当前微信与 token 用户一致
 * POST /auth/verify-wechat
 */
const verifyWechat = (data) => {
  return post('/auth/verify-wechat', data);
};

/**
 * 退出登录
 * POST /auth/logout
 */
const logout = () => {
  return post('/auth/logout', {});
};

/**
 * 管理员登录
 * POST /auth/admin/login
 */
const adminLogin = (data) => {
  return post('/auth/admin/login', data);
};

/**
 * 服务商后台登录
 * POST /service-provider-portal/login
 */
const serviceProviderLogin = (data) => {
  return post('/service-provider-portal/login', data);
};

/**
 * 商家后台登录
 * POST /merchant-portal/login
 */
const merchantLogin = (data) => {
  return post('/merchant-portal/login', data);
};

/**
 * 技工端登录
 * POST /worker-portal/login
 */
const workerLogin = (data) => {
  return post('/worker-portal/login', data);
};

module.exports = {
  wechatLogin,
  verifyWechat,
  logout,
  accountLogin,
  smsLogin,
  register,
  sendSmsCode,
  adminLogin,
  serviceProviderLogin,
  merchantLogin,
  workerLogin
};
