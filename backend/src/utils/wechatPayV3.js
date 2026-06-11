/**
 * 微信支付 API v3（JSAPI/小程序）
 * 环境变量：WX_APPID, WX_MCH_ID, WX_MCH_SERIAL_NO, WX_API_V3_KEY, WX_PAY_PRIVATE_KEY_PATH
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_HOST = 'api.mch.weixin.qq.com';
let _privateKeyPem = null;
let _privateKeyLoadError = null;
let _platformCerts = new Map();

function readConfig() {
  return {
    appId: (process.env.WX_APPID || process.env.WX_PAY_APPID || '').trim(),
    mchId: (process.env.WX_MCH_ID || process.env.WX_MCHID || '').trim(),
    serialNo: (process.env.WX_MCH_SERIAL_NO || process.env.WX_PAY_MCH_SERIAL_NO || '').trim(),
    apiV3Key: (process.env.WX_API_V3_KEY || process.env.WX_PAY_API_V3_KEY || '').trim(),
    privateKeyPath: (process.env.WX_PAY_PRIVATE_KEY_PATH || process.env.WX_PRIVATE_KEY_PATH || '').trim(),
    privateKeyInline: (process.env.WX_PAY_PRIVATE_KEY || '').trim()
  };
}

function loadPrivateKey() {
  if (_privateKeyPem) return _privateKeyPem;
  if (_privateKeyLoadError) return null;
  const cfg = readConfig();
  try {
    if (cfg.privateKeyInline) {
      _privateKeyPem = cfg.privateKeyInline.replace(/\\n/g, '\n');
      return _privateKeyPem;
    }
    if (!cfg.privateKeyPath) {
      _privateKeyLoadError = '未设置 WX_PAY_PRIVATE_KEY_PATH';
      return null;
    }
    const resolved = path.isAbsolute(cfg.privateKeyPath)
      ? cfg.privateKeyPath
      : path.resolve(process.cwd(), cfg.privateKeyPath);
    _privateKeyPem = fs.readFileSync(resolved, 'utf8');
    return _privateKeyPem;
  } catch (e) {
    _privateKeyLoadError = e.message || String(e);
    return null;
  }
}

function getWechatPayConfigStatus() {
  const cfg = readConfig();
  const missing = [];
  if (!cfg.appId) missing.push('WX_APPID');
  if (!cfg.mchId) missing.push('WX_MCH_ID');
  if (!cfg.serialNo) missing.push('WX_MCH_SERIAL_NO');
  if (!cfg.apiV3Key) missing.push('WX_API_V3_KEY');
  if (!cfg.privateKeyPath && !cfg.privateKeyInline) missing.push('WX_PAY_PRIVATE_KEY_PATH');
  const key = loadPrivateKey();
  return {
    missing,
    privateKeyLoadError: key ? null : _privateKeyLoadError
  };
}

function isWechatPayConfigured() {
  const st = getWechatPayConfigStatus();
  return st.missing.length === 0 && !st.privateKeyLoadError && !!loadPrivateKey();
}

function yuanToFen(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

function randomNonce(len = 32) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function signMessage(message) {
  const key = loadPrivateKey();
  if (!key) throw new Error(_privateKeyLoadError || '私钥未加载');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  return sign.sign(key, 'base64');
}

function buildAuthorization(method, urlPath, bodyStr) {
  const cfg = readConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomNonce(32);
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${bodyStr}\n`;
  const signature = signMessage(message);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${cfg.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${cfg.serialNo}"`;
}

function httpsRequest(method, urlPath, bodyObj) {
  const bodyStr = bodyObj != null ? JSON.stringify(bodyObj) : '';
  const auth = buildAuthorization(method, urlPath, bodyStr);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path: urlPath,
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: auth,
          'User-Agent': 'community-backend-wechatpay-v3'
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch (e) {
            parsed = { raw: data };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
            return;
          }
          const err = new Error(parsed.message || parsed.detail || `HTTP ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.body = parsed;
          reject(err);
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function jsapiUnifiedOrder({ out_trade_no, description, amountFen, notify_url, openid }) {
  const cfg = readConfig();
  const body = {
    appid: cfg.appId,
    mchid: cfg.mchId,
    description: String(description || '订单支付').slice(0, 127),
    out_trade_no: String(out_trade_no),
    notify_url: String(notify_url),
    amount: { total: amountFen, currency: 'CNY' },
    payer: { openid: String(openid) }
  };
  return httpsRequest('POST', '/v3/pay/transactions/jsapi', body);
}

function buildJsapiPayParams(prepayId) {
  const cfg = readConfig();
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = randomNonce(32);
  const pkg = `prepay_id=${prepayId}`;
  const message = `${cfg.appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
  const paySign = signMessage(message);
  return {
    timeStamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign
  };
}

function decryptAesGcm(ciphertextB64, nonce, associatedData) {
  const cfg = readConfig();
  const key = Buffer.from(cfg.apiV3Key, 'utf8');
  const buf = Buffer.from(ciphertextB64, 'base64');
  const authTag = buf.slice(buf.length - 16);
  const data = buf.slice(0, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'));
  if (associatedData) decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  decipher.setAuthTag(authTag);
  const decoded = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decoded.toString('utf8'));
}

function decryptPlatformCert(encrypted) {
  return decryptAesGcm(encrypted.ciphertext, encrypted.nonce, encrypted.associated_data);
}

async function refreshPlatformCerts() {
  const resp = await httpsRequest('GET', '/v3/certificates', null);
  const list = resp.data || [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || !item.encrypt_certificate) continue;
    const pem = decryptPlatformCert(item.encrypt_certificate);
    _platformCerts.set(item.serial_no, pem);
  }
}

function verifyNotifySignature({ timestamp, nonce, body, signature, serial }) {
  const pem = _platformCerts.get(serial);
  if (!pem) return false;
  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(message);
  verify.end();
  return verify.verify(pem, signature, 'base64');
}

async function verifyAndDecryptNotify(req) {
  const cfg = readConfig();
  if (!cfg.apiV3Key) throw new Error('缺少 WX_API_V3_KEY');

  const timestamp = req.headers['wechatpay-timestamp'];
  const nonce = req.headers['wechatpay-nonce'];
  const signature = req.headers['wechatpay-signature'];
  const serial = req.headers['wechatpay-serial'];
  const rawBody = req.rawBodyForWechat || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  if (timestamp && signature && serial) {
    if (_platformCerts.size === 0) {
      try {
        await refreshPlatformCerts();
      } catch (e) {
        console.warn('[wechatPayV3] 拉取平台证书失败，跳过验签:', e.message);
      }
    }
    if (_platformCerts.has(serial)) {
      const ok = verifyNotifySignature({ timestamp, nonce, body: rawBody, signature, serial });
      if (!ok) throw new Error('微信支付回调验签失败');
    }
  }

  const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(rawBody || '{}');
  const resource = body.resource;
  if (!resource) throw new Error('回调缺少 resource');
  const plain = decryptAesGcm(resource.ciphertext, resource.nonce, resource.associated_data || '');
  return { body, plain };
}

module.exports = {
  readConfig,
  isWechatPayConfigured,
  getWechatPayConfigStatus,
  yuanToFen,
  jsapiUnifiedOrder,
  buildJsapiPayParams,
  verifyAndDecryptNotify,
  refreshPlatformCerts
};
