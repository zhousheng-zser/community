const axios = require('axios');

const WX_LOGIN_URL = 'https://api.weixin.qq.com/sns/jscode2session';

/**
 * 用小程序 wx.login 的 code 换取 openid
 * @returns {Promise<string>}
 */
async function resolveOpenidFromCode(code) {
  if (!code) {
    const err = new Error('缺少 code 参数');
    err.status = 400;
    throw err;
  }
  const secret = process.env.WX_APPSECRET;
  if (secret) {
    const response = await axios.get(WX_LOGIN_URL, {
      params: {
        appid: process.env.WX_APPID,
        secret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    if (response.data.errcode) {
      const err = new Error('微信登录失败');
      err.status = 400;
      err.details = response.data;
      throw err;
    }
    return response.data.openid;
  }
  console.warn('⚠️ WX_APPSECRET 未配置，使用本地模拟 openid');
  return `mock_openid_${code}`;
}

module.exports = { resolveOpenidFromCode };
