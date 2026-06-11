const https = require('https');

function wxGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function resolveOpenidFromCode(code) {
  if (!code) {
    const err = new Error('缺少 code 参数');
    err.status = 400;
    throw err;
  }

  const secret = (process.env.WX_APPSECRET || process.env.WX_SECRET || '').trim();
  if (!secret || process.env.E2E_CLEAR_WX_SECRET === '1') {
    return `mock_openid_${String(code).slice(0, 24)}`;
  }

  const appid = (process.env.WX_APPID || process.env.WX_APP_ID || '').trim();
  if (!appid) {
    const err = new Error('未配置 WX_APPID');
    err.status = 500;
    throw err;
  }

  const qs = new URLSearchParams({
    appid,
    secret,
    js_code: String(code),
    grant_type: 'authorization_code'
  });
  const json = await wxGetJson(`https://api.weixin.qq.com/sns/jscode2session?${qs.toString()}`);
  if (json.errcode) {
    const err = new Error(json.errmsg || '微信登录失败');
    err.status = 400;
    err.details = json;
    throw err;
  }
  if (!json.openid) {
    const err = new Error('微信未返回 openid');
    err.status = 400;
    throw err;
  }
  return json.openid;
}

module.exports = { resolveOpenidFromCode };
