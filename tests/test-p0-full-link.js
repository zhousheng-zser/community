#!/usr/bin/env node
const http = require('http');
const BASE_URL = 'https://jshsp1.eds-tech.cn';
const RESULTS = { pass: 0, fail: 0, warn: 0, skip: 0, errors: [] };

// 手动 Token 配置（用于绕过微信 code 验证）
// 如果设置了这些 Token，测试将直接使用它们，而不是尝试登录
const MANUAL_TOKEN_A = process.env.MANUAL_TOKEN_A || '';
const MANUAL_TOKEN_B = process.env.MANUAL_TOKEN_B || '';
const MANUAL_MERCHANT_TOKEN = process.env.MANUAL_MERCHANT_TOKEN || '';
const MANUAL_SP_TOKEN = process.env.MANUAL_SP_TOKEN || '';
const MANUAL_WORKER_TOKEN = process.env.MANUAL_WORKER_TOKEN || '';

function api(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method, timeout: 15000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {}, raw: data }); }
        catch (e) { resolve({ status: res.statusCode, data: {}, raw: data, parseError: e.message }); }
      });
    });
    req.on('error', (err) => resolve({ status: 0, data: {}, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: {}, error: 'Timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function report(name, condition, detail, status) {
  const colors = { PASS: '\x1b[32m', FAIL: '\x1b[31m', WARN: '\x1b[33m', SKIP: '\x1b[36m' };
  console.log(`${colors[status] || colors.PASS}[${status}] ${name}: ${detail || ''}\x1b[0m`);
  if (status === 'PASS') RESULTS.pass++;
  else if (status === 'FAIL') { RESULTS.fail++; RESULTS.errors.push({ test: name, detail }); }
  else if (status === 'WARN') RESULTS.warn++;
  else if (status === 'SKIP') RESULTS.skip++;
}

function extractToken(res) { return res.data?.token || res.data?.data?.token || null; }
function extractId(res) { return res.data?.id || res.data?.data?.id || res.data?.order_id || res.data?.data?.order_id || null; }
function extractOrderNo(res) { return res.data?.order_no || res.data?.data?.order_no || null; }
function isSuccess(res) {
  if (!res || res.status === 0) return false;
  if (res.data?.code === 0 || res.data?.errno === 0) return true;
  return (res.status === 200 || res.status === 201);
}

async function checkEnvironment() {
  console.log('\n' + '='.repeat(60));
  console.log('  【环境检查】');
  console.log('='.repeat(60) + '\n');
  const health = await api('GET', '/');
  report('后端服务', health.status >= 200 && health.status < 500, `HTTP ${health.status}`, (health.status >= 200 && health.status < 500) ? 'PASS' : 'FAIL');
  const categories = await api('GET', '/api/v1/core/categories');
  report('基础API', isSuccess(categories), categories.status === 200 ? 'API正常' : 'API异常: ' + categories.raw?.substring(0, 100), isSuccess(categories) ? 'PASS' : 'FAIL');
}

async function testNeighborAssist() {
  console.log('\n' + '='.repeat(60));
  console.log('  【邻里帮帮全链路测试】');
  console.log('='.repeat(60) + '\n');
  let tokenA = MANUAL_TOKEN_A;
  let tokenB = MANUAL_TOKEN_B;
  if (tokenA) {
    report('[1/11] 用户A登录', true, '使用手动 Token', 'PASS');
  } else {
    const loginA = await api('POST', '/api/v1/auth/login', { code: 'test_code_13800138001' });
    tokenA = extractToken(loginA);
    report('[1/11] 用户A登录', !!tokenA, tokenA ? '登录成功' : '失败: ' + loginA.raw?.substring(0, 100), !!tokenA ? 'PASS' : 'FAIL');
  }
  if (!tokenA) return;
  if (tokenB) {
    report('[2/11] 用户B登录', true, '使用手动 Token', 'PASS');
  } else {
    const loginB = await api('POST', '/api/v1/auth/login', { code: 'test_code_13800138002' });
    tokenB = extractToken(loginB);
    report('[2/11] 用户B登录', !!tokenB, tokenB ? '登录成功' : '失败: ' + loginB.raw?.substring(0, 100), !!tokenB ? 'PASS' : 'FAIL');
  }
  if (!tokenB) return;
  const createOrder = await api('POST', '/api/v1/neighbor-assist', { community_id: 1, category: '代取', content: '代取快递-顺丰', address: '1栋101', reward: 5 }, tokenA);
  const orderId = extractId(createOrder);
  report('[3/11] 发布帮帮订单', isSuccess(createOrder), '订单ID: ' + (orderId || 'unknown'), isSuccess(createOrder) ? 'PASS' : 'FAIL');
  if (!orderId) { console.log('⚠️  创建失败: ' + createOrder.raw?.substring(0, 300)); return; }
  const myPublished = await api('GET', '/api/v1/neighbor-assist/my/published', null, tokenA);
  report('[4/11] 查看我的发布', myPublished.status === 200, '状态码: ' + myPublished.status, myPublished.status === 200 ? 'PASS' : 'FAIL');
  const pool = await api('GET', '/api/v1/neighbor-assist/pool?community_id=1', null, tokenB);
  const poolList = pool.data?.data || pool.data?.list || pool.data;
  report('[5/11] 查看订单池', Array.isArray(poolList) && poolList.length > 0, `订单数: ${Array.isArray(poolList) ? poolList.length : 0}`, (Array.isArray(poolList) && poolList.length > 0) ? 'PASS' : 'FAIL');
  const grab = await api('POST', `/api/v1/neighbor-assist/${orderId}/grab`, null, tokenB);
  report('[6/11] 用户B抢单', isSuccess(grab), grab.data?.message || grab.raw?.substring(0, 100), isSuccess(grab) ? 'PASS' : 'FAIL');
  const myOrderAfterGrab = await api('GET', `/api/v1/neighbor-assist/${orderId}`, null, tokenA);
  const orderStatus = myOrderAfterGrab.data?.status || myOrderAfterGrab.data?.data?.status;
  report('[7/11] 订单状态更新', orderStatus === 'grabbed' || orderStatus === 'accepted', '当前状态: ' + orderStatus, (orderStatus === 'grabbed' || orderStatus === 'accepted') ? 'PASS' : 'WARN');
  const complete = await api('POST', `/api/v1/neighbor-assist/${orderId}/complete`, null, tokenB);
  report('[8/11] 用户B完成服务', isSuccess(complete), complete.data?.message || complete.raw?.substring(0, 100), isSuccess(complete) ? 'PASS' : 'FAIL');
  const confirm = await api('POST', `/api/v1/neighbor-assist/${orderId}/confirm`, null, tokenA);
  report('[9/11] 用户A确认完成', isSuccess(confirm), confirm.data?.message || confirm.raw?.substring(0, 100), isSuccess(confirm) ? 'PASS' : 'FAIL');
  const finalOrder = await api('GET', `/api/v1/neighbor-assist/${orderId}`, null, tokenA);
  const finalStatus = finalOrder.data?.status || finalOrder.data?.data?.status;
  report('[10/11] 最终订单状态', finalStatus === 'completed' || finalStatus === 'confirmed', '最终状态: ' + finalStatus, (finalStatus === 'completed' || finalStatus === 'confirmed') ? 'PASS' : 'WARN');
  const messages = await api('GET', '/api/v1/messages/conversations', null, tokenA);
  const msgList = messages.data?.data || messages.data?.list || messages.data;
  report('[11/11] 消息通知', Array.isArray(msgList) || messages.status === 200, `消息数: ${Array.isArray(msgList) ? msgList.length : 'N/A'}`, (Array.isArray(msgList) || messages.status === 200) ? 'PASS' : 'WARN');
  console.log('\n--- 邻里帮帮全链路测试完成 ---\n');
}

async function testMarketShopping() {
  console.log('\n' + '='.repeat(60));
  console.log('  【市场购物全链路测试】');
  console.log('='.repeat(60) + '\n');
  let token = MANUAL_TOKEN_A;
  if (token) {
    report('[1/10] 用户登录', true, '使用手动 Token', 'PASS');
  } else {
    const login = await api('POST', '/api/v1/auth/login', { code: 'test_code_13800138001' });
    token = extractToken(login);
    report('[1/10] 用户登录', !!token, token ? '登录成功' : '失败: ' + login.raw?.substring(0, 100), !!token ? 'PASS' : 'FAIL');
  }
  if (!token) return;
  const shops = await api('GET', '/api/v1/market/shops');
  const shopList = shops.data?.data || shops.data?.list || shops.data;
  const shopId = Array.isArray(shopList) ? shopList[0]?.id : null;
  report('[2/10] 浏览店铺列表', Array.isArray(shopList) && shopList.length > 0, `店铺数: ${Array.isArray(shopList) ? shopList.length : 0}, shopId: ${shopId}`, (Array.isArray(shopList) && shopList.length > 0) ? 'PASS' : 'FAIL');
  if (!shopId) { console.log('⚠️  无店铺: ' + shops.raw?.substring(0, 300)); return; }
  const goods = await api('GET', `/api/v1/market/shops/${shopId}/goods`);
  const goodsList = goods.data?.data || goods.data?.list || goods.data;
  const goodsId = Array.isArray(goodsList) ? goodsList[0]?.id : null;
  report('[3/10] 浏览商品列表', Array.isArray(goodsList) && goodsList.length > 0, `商品数: ${Array.isArray(goodsList) ? goodsList.length : 0}, goodsId: ${goodsId}`, (Array.isArray(goodsList) && goodsList.length > 0) ? 'PASS' : 'FAIL');
  if (!goodsId) { console.log('⚠️  无商品: ' + goods.raw?.substring(0, 300)); return; }
  const goodsDetail = await api('GET', `/api/v1/market/goods/${goodsId}`);
  report('[4/10] 查看商品详情', isSuccess(goodsDetail), `商品: ${goodsDetail.data?.data?.name || 'unknown'}`, isSuccess(goodsDetail) ? 'PASS' : 'FAIL');
  const addToCart = await api('POST', '/api/v1/market/cart/items', { goods_id: goodsId, quantity: 2 }, token);
  report('[5/10] 添加购物车', isSuccess(addToCart), addToCart.data?.message || addToCart.raw?.substring(0, 100), isSuccess(addToCart) ? 'PASS' : 'FAIL');
  const cart = await api('GET', '/api/v1/market/cart', null, token);
  report('[6/10] 查看购物车', isSuccess(cart), '状态: ' + cart.status, isSuccess(cart) ? 'PASS' : 'FAIL');
  const addresses = await api('GET', '/api/v1/user/addresses', null, token);
  const addrList = addresses.data?.data || addresses.data?.list || addresses.data;
  const addressId = Array.isArray(addrList) ? (addrList.find(a => a.is_default)?.id || addrList[0]?.id) : null;
  report('[7/10] 获取收货地址', isSuccess(addresses), `地址数: ${Array.isArray(addrList) ? addrList.length : 0}, addressId: ${addressId}`, isSuccess(addresses) ? 'PASS' : 'WARN');
  const createOrder = await api('POST', '/api/v1/market/orders', { goods_items: [{ goods_id: goodsId, quantity: 1 }], address_id: addressId, remark: '全链路测试订单' }, token);
  const orderNo = extractOrderNo(createOrder);
  const orderId = extractId(createOrder);
  report('[8/10] 创建订单', isSuccess(createOrder), `订单号: ${orderNo || orderId || 'unknown'}`, isSuccess(createOrder) ? 'PASS' : 'FAIL');
  if (!orderNo && !orderId) { console.log('⚠️  创建失败: ' + createOrder.raw?.substring(0, 300)); return; }
  const mockPay = await api('POST', '/api/v1/market/payments/mock-success', { order_no: orderNo || orderId }, token);
  report('[9/10] 模拟支付', isSuccess(mockPay), mockPay.data?.message || mockPay.raw?.substring(0, 100), isSuccess(mockPay) ? 'PASS' : 'FAIL');
  let merchantToken = MANUAL_MERCHANT_TOKEN;
  if (merchantToken) {
    report('[10/10] 商家登录', true, '使用手动 Token', 'PASS');
  } else {
    const merchantLogin = await api('POST', '/api/v1/merchant-portal/login', { username: 'merchant_test', password: 'merchant123' });
    merchantToken = extractToken(merchantLogin);
    report('[10/10] 商家登录', !!merchantToken, merchantToken ? '商家登录成功' : '失败: ' + merchantLogin.raw?.substring(0, 200), !!merchantToken ? 'PASS' : 'FAIL');
  }
  console.log('\n--- 市场购物全链路测试完成 ---\n');
}

async function testServiceOrder() {
  console.log('\n' + '='.repeat(60));
  console.log('  【服务预约全链路测试】');
  console.log('='.repeat(60) + '\n');
  let token = MANUAL_TOKEN_A;
  if (token) {
    report('[1/8] 用户登录', true, '使用手动 Token', 'PASS');
  } else {
    const login = await api('POST', '/api/v1/auth/login', { code: 'test_code_13800138001' });
    token = extractToken(login);
    report('[1/8] 用户登录', !!token, token ? '登录成功' : '失败: ' + login.raw?.substring(0, 100), !!token ? 'PASS' : 'FAIL');
  }
  if (!token) return;
  const services = await api('GET', '/api/v1/core/services');
  const serviceList = services.data?.data || services.data?.list || services.data;
  const serviceId = Array.isArray(serviceList) ? serviceList[0]?.id : null;
  report('[2/8] 浏览服务列表', Array.isArray(serviceList) && serviceList.length > 0, `服务数: ${Array.isArray(serviceList) ? serviceList.length : 0}, serviceId: ${serviceId}`, (Array.isArray(serviceList) && serviceList.length > 0) ? 'PASS' : 'FAIL');
  if (!serviceId) { console.log('⚠️  无服务: ' + services.raw?.substring(0, 300)); return; }
  const createOrder = await api('POST', '/api/v1/service-orders', { service_id: serviceId, scheduled_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16), address: '北京市朝阳区测试路123号', remark: '全链路测试订单' }, token);
  const orderId = extractId(createOrder);
  report('[3/8] 创建服务订单', isSuccess(createOrder), `订单ID: ${orderId || 'unknown'}`, isSuccess(createOrder) ? 'PASS' : 'FAIL');
  if (!orderId) { console.log('⚠️  创建失败: ' + createOrder.raw?.substring(0, 300)); return; }
  const mockPay = await api('POST', `/api/v1/service-orders/${orderId}/mock-pay`, null, token);
  report('[4/8] 模拟支付', isSuccess(mockPay), mockPay.data?.message || mockPay.raw?.substring(0, 100), isSuccess(mockPay) ? 'PASS' : 'FAIL');
  let spToken = MANUAL_SP_TOKEN;
  if (spToken) {
    report('[5/8] 服务商登录', true, '使用手动 Token', 'PASS');
  } else {
    const spLogin = await api('POST', '/api/v1/service-provider-portal/login', { username: 'sp_test', password: 'sp123' });
    spToken = extractToken(spLogin);
    report('[5/8] 服务商登录', !!spToken, spToken ? '服务商登录成功' : '失败: ' + spLogin.raw?.substring(0, 200), !!spToken ? 'PASS' : 'FAIL');
  }
  const spOrders = await api('GET', '/api/v1/service-provider-portal/orders', null, spToken);
  report('[6/8] 服务商查看订单', spOrders.status === 200, '状态码: ' + spOrders.status, spOrders.status === 200 ? 'PASS' : 'FAIL');
  const accept = await api('POST', `/api/v1/service-provider-portal/orders/${orderId}/accept`, null, spToken);
  report('[7/8] 服务商接单', isSuccess(accept), accept.data?.message || accept.raw?.substring(0, 100), isSuccess(accept) ? 'PASS' : 'FAIL');
  let workerToken = MANUAL_WORKER_TOKEN;
  if (workerToken) {
    report('[8/8] 技工登录', true, '使用手动 Token', 'PASS');
  } else {
    const workerLogin = await api('POST', '/api/v1/worker-portal/login', { phone: '13800138004', code: '123456' });
    workerToken = extractToken(workerLogin);
    report('[8/8] 技工登录', !!workerToken, workerToken ? '技工登录成功' : '失败: ' + workerLogin.raw?.substring(0, 200), !!workerToken ? 'PASS' : 'FAIL');
  }
  console.log('\n--- 服务预约全链路测试完成 ---\n');
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('  【测试总结】');
  console.log('='.repeat(60));
  console.log(`\n  通过: ${RESULTS.pass}`);
  console.log(`  失败: ${RESULTS.fail}`);
  console.log(`  警告: ${RESULTS.warn}`);
  console.log(`  跳过: ${RESULTS.skip}`);
  console.log(`  总计: ${RESULTS.pass + RESULTS.fail + RESULTS.warn + RESULTS.skip}\n`);
  if (RESULTS.errors.length > 0) {
    console.log('  失败详情:');
    RESULTS.errors.forEach((e, i) => {
      console.log(`    ${i + 1}. ${e.test}: ${e.detail?.substring(0, 100)}`);
    });
    console.log();
  }
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  P0 核心业务链全链路测试');
  console.log('  开始时间: ' + new Date().toLocaleString());
  console.log('='.repeat(60));
  await checkEnvironment();
  await testNeighborAssist();
  await testMarketShopping();
  await testServiceOrder();
  await printSummary();
}

main().catch(console.error);
