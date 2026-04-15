/**
 * 微信支付 API v3（JSAPI 统一下单、调起参数、回调验签与 resource 解密）
 * 文档：https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_5_1.shtml
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE = 'https://api.mch.weixin.qq.com';
const JSAPI_PATH = '/v3/pay/transactions/jsapi';
const CERTS_PATH = '/v3/certificates';

let platformCertCache = { serialToPem: {}, fetchedAt: 0 };
const CERT_CACHE_MS = 12 * 60 * 60 * 1000;

function loadPrivateKeyPem() {
  const raw = process.env.WX_PAY_PRIVATE_KEY;
  const keyPath = process.env.WX_PAY_PRIVATE_KEY_PATH;
  if (raw && String(raw).trim()) {
    return raw.replace(/\\n/g, '\n');
  }
  if (keyPath) {
    const p = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    return fs.readFileSync(p, 'utf8');
  }
  return null;
}

function getWechatPayConfigStatus() {
  const missing = [];
  const appid = process.env.WX_PAY_APPID || process.env.WECHAT_APPID;
  const mchid = process.env.WX_PAY_MCHID;
  const serial = process.env.WX_PAY_SERIAL_NO;
  const apiV3 = process.env.WX_PAY_API_V3_KEY;
  const notifyUrl = process.env.WX_PAY_NOTIFY_URL;
  if (!appid) missing.push('WX_PAY_APPID 或 WECHAT_APPID');
  if (!mchid) missing.push('WX_PAY_MCHID');
  if (!serial) missing.push('WX_PAY_SERIAL_NO');
  if (!apiV3) missing.push('WX_PAY_API_V3_KEY');
  if (!notifyUrl) missing.push('WX_PAY_NOTIFY_URL');
  if (apiV3 && String(apiV3).length !== 32) missing.push('WX_PAY_API_V3_KEY(必须32位)');

  let privateKeyLoadError = null;
  let pem = null;
  try {
    pem = loadPrivateKeyPem();
  } catch (e) {
    privateKeyLoadError = e.message || String(e);
  }
  if (!pem) missing.push('WX_PAY_PRIVATE_KEY_PATH 或 WX_PAY_PRIVATE_KEY');

  return {
    ok: missing.length === 0 && !privateKeyLoadError,
    missing,
    privateKeyLoadError
  };
}

function isWechatPayConfigured() {
  return getWechatPayConfigStatus().ok;
}

function getWxAppId() {
  return process.env.WX_PAY_APPID || process.env.WECHAT_APPID;
}

function buildAuthHeader(method, urlPath, bodyStr) {
  const mchid = process.env.WX_PAY_MCHID;
  const serial = process.env.WX_PAY_SERIAL_NO;
  const pem = loadPrivateKeyPem();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  const signature = sign.sign(pem, 'base64');
  const token = [
    `mchid="${mchid}"`,
    `nonce_str="${nonceStr}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${serial}"`,
    `signature="${signature}"`
  ].join(',');
  return `WECHATPAY2-SHA256-RSA2048 ${token}`;
}

async function wechatRequest(method, urlPath, bodyObj) {
  const bodyStr = bodyObj && Object.keys(bodyObj).length ? JSON.stringify(bodyObj) : '';
  const auth = buildAuthHeader(method, urlPath, bodyStr);
  const url = `${BASE}${urlPath}`;
  const headers = {
    Authorization: auth,
    Accept: 'application/json'
  };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }
  const cfg = { method, url, headers, validateStatus: () => true };
  if (method !== 'GET' && method !== 'HEAD') {
    cfg.data = bodyStr;
  }
  const { data, status } = await axios(cfg);
  if (status >= 200 && status < 300) return data;
  const err = new Error(data.message || data.code || `HTTP ${status}`);
  err.status = status;
  err.body = data;
  throw err;
}

function decryptAes256Gcm(apiV3Key, associatedData, nonceStr, ciphertextB64) {
  const key = Buffer.from(apiV3Key, 'utf8');
  if (key.length !== 32) throw new Error('WX_PAY_API_V3_KEY 须为 32 字节');
  const nonceBuf = Buffer.isBuffer(nonceStr) ? nonceStr : Buffer.from(nonceStr, 'utf8');
  const buf = Buffer.from(ciphertextB64, 'base64');
  const authTag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBuf);
  decipher.setAuthTag(authTag);
  const aad = associatedData == null ? Buffer.alloc(0) : Buffer.from(String(associatedData), 'utf8');
  decipher.setAAD(aad);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

async function refreshPlatformCertificates() {
  const apiV3Key = process.env.WX_PAY_API_V3_KEY;
  const data = await wechatRequest('GET', CERTS_PATH, null);
  const serialToPem = {};
  for (const row of data.data || []) {
    const enc = row.encrypt_certificate;
    if (!enc) continue;
    const pem = decryptAes256Gcm(
      apiV3Key,
      enc.associated_data || 'certificate',
      enc.nonce,
      enc.ciphertext
    );
    serialToPem[row.serial_no] = pem;
  }
  platformCertCache = { serialToPem, fetchedAt: Date.now() };
  return serialToPem;
}

async function getPlatformPemForSerial(serial) {
  const now = Date.now();
  if (!platformCertCache.serialToPem[serial] || now - platformCertCache.fetchedAt > CERT_CACHE_MS) {
    await refreshPlatformCertificates();
  }
  let pem = platformCertCache.serialToPem[serial];
  if (!pem) {
    await refreshPlatformCertificates();
    pem = platformCertCache.serialToPem[serial];
  }
  if (!pem) throw new Error(`找不到平台证书 serial=${serial}`);
  return pem;
}

async function verifyWechatpaySignature({ timestamp, nonce, bodyStr, serial, signatureB64 }) {
  const message = `${timestamp}\n${nonce}\n${bodyStr}\n`;
  const pem = await getPlatformPemForSerial(serial);
  const ok = crypto.verify(
    'sha256',
    Buffer.from(message, 'utf8'),
    { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(signatureB64, 'base64')
  );
  if (!ok) throw new Error('平台证书验签失败');
}

/**
 * JSAPI 统一下单
 * @param {{ out_trade_no: string, description: string, amountFen: number, notify_url: string, openid: string }} p
 */
async function jsapiUnifiedOrder(p) {
  const appid = getWxAppId();
  const mchid = process.env.WX_PAY_MCHID;
  const body = {
    appid,
    mchid,
    description: p.description.slice(0, 127),
    out_trade_no: p.out_trade_no,
    notify_url: p.notify_url,
    amount: { total: p.amountFen, currency: 'CNY' },
    payer: { openid: p.openid }
  };
  return wechatRequest('POST', JSAPI_PATH, body);
}

/**
 * 小程序调起支付五参数（signType: RSA）
 */
function buildJsapiPayParams(prepayId) {
  const appId = getWxAppId();
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const pkg = `prepay_id=${prepayId}`;
  const message = `${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
  const pem = loadPrivateKeyPem();
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  const paySign = sign.sign(pem, 'base64');
  return {
    timeStamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign
  };
}

/**
 * 解析并校验支付通知（V3）
 * @returns {Promise<{ plain: object, resource: object }>}
 */
async function parsePayNotification(headers, rawBodyStr) {
  const sig = headers['wechatpay-signature'];
  const ts = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const serial = headers['wechatpay-serial'];
  if (!sig || !ts || !nonce || !serial) {
    throw new Error('缺少微信支付通知头');
  }
  await verifyWechatpaySignature({
    timestamp: ts,
    nonce,
    bodyStr: rawBodyStr,
    serial,
    signatureB64: sig
  });

  const outer = JSON.parse(rawBodyStr);
  const resource = outer.resource;
  if (!resource || resource.algorithm !== 'AEAD_AES_256_GCM') {
    throw new Error('通知 resource 格式异常');
  }
  const apiV3Key = process.env.WX_PAY_API_V3_KEY;
  const jsonStr = decryptAes256Gcm(
    apiV3Key,
    resource.associated_data || '',
    resource.nonce,
    resource.ciphertext
  );
  const plain = JSON.parse(jsonStr);
  return { plain, outer };
}

function yuanToFen(yuan) {
  const n = Number(yuan);
  if (!Number.isFinite(n) || n < 0) throw new Error('金额非法');
  return Math.round(n * 100);
}

module.exports = {
  isWechatPayConfigured,
  getWechatPayConfigStatus,
  getWxAppId,
  jsapiUnifiedOrder,
  buildJsapiPayParams,
  parsePayNotification,
  yuanToFen,
  wechatSuccessBody: () => ({ code: 'SUCCESS', message: '成功' })
};
