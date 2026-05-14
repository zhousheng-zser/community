/**
 * Debug market payment flow
 */
const https = require('https');
const crypto = require('crypto');
const JWT_SECRET = 'jwt_key_cwsgwbd';
const API = '/api/v1';

function signToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    id: userId, openid: 'test_' + userId, token_version: 0,
    iat: now, exp: now + 7 * 24 * 3600
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(header + '.' + payload).digest('base64url');
  return header + '.' + payload + '.' + signature;
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const opts = { method, path, hostname: '120.27.239.244:3001', port: 3001, headers, rejectUnauthorized: false };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    if (postData) req.write(postData);
    req.end();
  });
}

const POST = (path, body, token) => request('POST', path, body, token);

async function test() {
  const token = signToken(3);

  // 1. Create order
  console.log('--- Create order ---');
  let createRes = await POST(API + '/market/order/create', {
    shop_id: 1,
    delivery_mode: 'express',
    address: {
      name: '张先生',
      phone: '13800138000',
      detail: '某某小区1栋101室'
    },
    items: [{ sku_id: 1, goods_id: 1, quantity: 1 }]
  }, token);
  console.log(JSON.stringify(createRes.body));

  if (createRes.body.code === 0) {
    const orderNo = createRes.body.data?.orderNo || createRes.body.data?.order_no;

    // 2. Create payment
    console.log('\n--- Create payment ---');
    let payRes = await POST(API + '/market/payments/create', { order_no: orderNo }, token);
    console.log(JSON.stringify(payRes.body));

    // 3. Mock success
    console.log('\n--- Mock success ---');
    let mockRes = await POST(API + '/market/payments/mock-success', { order_no: orderNo }, token);
    console.log(JSON.stringify(mockRes.body));
  }
}

test().catch(console.error);
