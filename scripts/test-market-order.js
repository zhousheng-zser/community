/**
 * 测试集市下单完整链路 - 精确模拟前端调用
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
    const opts = { method, path, hostname: 'ancientscrolllibrary.cn', port: 3001, headers, rejectUnauthorized: false };
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

const GET = (path, token) => request('GET', path, null, token);
const POST = (path, body, token) => request('POST', path, body, token);

async function test() {
  console.log('========================================');
  console.log('集市下单完整链路测试');
  console.log('========================================\n');

  const token = signToken(3);

  // 1. 获取商品详情
  console.log('--- 1. 商品详情 (goods=1) ---');
  let gdRes = await GET(API + '/market/goods/1', token);
  const gd = gdRes.body.data || {};
  const skuList = gd.sku_list || [];
  console.log('  sku_list长度: ' + skuList.length);
  console.log('  sku_tree长度: ' + (gd.sku_tree || []).length);

  if (skuList.length === 0) {
    console.log('  [FAIL] sku_list 为空');
    console.log('  完整响应:', JSON.stringify(gdRes.body, null, 2).slice(0, 500));
    return;
  }

  // 前端传的 sku_id 可能是 sku_list[0].id (字符串 "sku_1")
  const skuId = skuList[0].id;
  console.log('  SKU id: ' + skuId + ' (type: ' + typeof skuId + ')');

  // 2. 订单预览
  console.log('\n--- 2. 订单预览 ---');
  let previewRes = await POST(API + '/market/orders/preview', {
    shop_id: 1,
    delivery_mode: 'express',
    items: [{ goods_id: 1, sku_id: skuId, quantity: 1 }]
  }, token);
  console.log('  预览响应:', JSON.stringify(previewRes.body));

  // 3. 创建订单 - 模拟前端调用 (POST /market/order/create)
  console.log('\n--- 3. 创建订单 ---');
  let createRes = await POST(API + '/market/order/create', {
    shop_id: 1,
    delivery_mode: 'express',
    address: {
      name: '张先生',
      phone: '13800138000',
      detail: '某某小区1栋101室'
    },
    remark: '测试订单',
    items: [{
      sku_id: skuId,
      goods_id: 1,
      quantity: 1
    }]
  }, token);
  console.log('  创建响应:', JSON.stringify(createRes.body));

  if (createRes.body.code === 0) {
    const orderNo = createRes.body.data?.orderNo || createRes.body.data?.order_no;
    console.log('  订单号: ' + orderNo);

    // 4. 创建支付单
    console.log('\n--- 4. 创建支付单 ---');
    let payCreateRes = await POST(API + '/market/payments/create', {
      order_no: orderNo,
      payment_type: 'mock'
    }, token);
    console.log('  创建支付响应:', JSON.stringify(payCreateRes.body));

    // 5. 模拟支付
    console.log('\n--- 5. 模拟支付 ---');
    let mockPayRes = await POST(API + '/market/payments/mock-success', { order_no: orderNo }, token);
    console.log('  支付响应:', JSON.stringify(mockPayRes.body));

    // 6. 订单详情
    console.log('\n--- 6. 订单详情 ---');
    let detailRes = await GET(API + '/market/orders/' + orderNo, token);
    console.log('  code=' + detailRes.body.code);

    // 7. 我的订单
    console.log('\n--- 7. 我的订单 ---');
    let myRes = await GET(API + '/market/orders/my', token);
    const myList = myRes.body.data?.list || [];
    console.log('  订单数: ' + myList.length);
    if (myList.length > 0) {
      console.log('  最新订单:', JSON.stringify(myList[0]).slice(0, 200));
    }
  }
}

test().catch(err => { console.error('测试失败:', err); process.exit(1); });
