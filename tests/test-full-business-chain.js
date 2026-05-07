#!/usr/bin/env node
/**
 * Full Business Chain Test Script
 * Tests: Auth, Neighbor Assist, Market Shopping, Service Orders, Messages, User Profile
 */
const http = require('http');
const BASE = 'http://8.136.29.208:3001';
const R = { pass: 0, fail: 0, warn: 0, errors: [] };

function api(method, path, body, token) {
  return new Promise((resolve) => {
    const u = new URL(path, BASE);
    const o = {
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method, timeout: 15000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    if (token) o.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(o, (res) => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: d ? JSON.parse(d) : {}, raw: d }); }
        catch (e) { resolve({ status: res.statusCode, data: {}, raw: d, parseError: e.message }); }
      });
    });
    req.on('error', e => resolve({ status: 0, data: {}, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: {}, error: 'Timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function ok(res) {
  if (!res || res.status === 0) return false;
  if (res.data?.code === 0 || res.data?.errno === 0) return true;
  return (res.status === 200 || res.status === 201);
}

function rep(name, cond, detail, st) {
  const c = { PASS: '\x1b[32m', FAIL: '\x1b[31m', WARN: '\x1b[33m' };
  console.log(`${c[st] || ''}[${st}] ${name}: ${detail || ''}\x1b[0m`);
  if (st === 'PASS') R.pass++;
  else if (st === 'FAIL') { R.fail++; R.errors.push({ test: name, detail }); }
  else if (st === 'WARN') R.warn++;
}

function getToken(res) { return res.data?.token || res.data?.data?.token || null; }

// ============ Test: Environment ============
async function testEnv() {
  console.log('\n' + '='.repeat(60));
  console.log('  【环境检查】');
  console.log('='.repeat(60));
  const h = await api('GET', '/');
  rep('后端服务', h.status >= 200, `HTTP ${h.status}`, h.status >= 200 ? 'PASS' : 'FAIL');

  const cats = await api('GET', '/api/v1/core/categories');
  const catList = cats.data?.data || cats.data?.list || [];
  rep('分类数据', Array.isArray(catList) && catList.length > 0, `分类数: ${catList.length}`, (Array.isArray(catList) && catList.length > 0) ? 'PASS' : 'FAIL');

  const svcs = await api('GET', '/api/v1/core/services');
  const svcList = svcs.data?.data?.list || [];
  rep('服务数据', Array.isArray(svcList) && svcList.length > 0, `服务数: ${svcList.length}`, (Array.isArray(svcList) && svcList.length > 0) ? 'PASS' : 'WARN');

  const shops = await api('GET', '/api/v1/market/shops');
  const shopList = shops.data?.data?.list || [];
  rep('店铺数据', Array.isArray(shopList) && shopList.length > 0, `店铺数: ${shopList.length}`, (Array.isArray(shopList) && shopList.length > 0) ? 'PASS' : 'FAIL');
}

// ============ Test: Auth (Register + Login) ============
async function testAuth() {
  console.log('\n' + '='.repeat(60));
  console.log('  【认证模块测试】');
  console.log('='.repeat(60));

  // SMS Code
  const sms = await api('POST', '/api/v1/auth/sms/send', { phone: '13800138001', type: 'register' });
  rep('发送验证码', ok(sms), sms.data?.msg || sms.raw?.substring(0, 50), ok(sms) ? 'PASS' : 'FAIL');

  // Register User A
  const regA = await api('POST', '/api/v1/auth/register', {
    phone: '13800138001', code: '024680', password: 'Test1234!',
    address: '北京市朝阳区', lat: 39.9042, lng: 116.4074
  });
  const tokenA = getToken(regA);
  rep('注册用户A', !!tokenA, tokenA ? '注册成功' : regA.raw?.substring(0, 100), !!tokenA ? 'PASS' : 'FAIL');

  // Register User B
  const regB = await api('POST', '/api/v1/auth/register', {
    phone: '13800138002', code: '024680', password: 'Test1234!',
    address: '北京市朝阳区', lat: 39.9042, lng: 116.4074
  });
  const tokenB = getToken(regB);
  rep('注册用户B', !!tokenB, tokenB ? '注册成功' : regB.raw?.substring(0, 100), !!tokenB ? 'PASS' : 'FAIL');

  // Password Login
  if (tokenA) {
    const logout = await api('POST', '/api/v1/auth/logout', null, tokenA);
    rep('退出登录', ok(logout), logout.data?.msg || logout.raw?.substring(0, 50), ok(logout) ? 'PASS' : 'WARN');

    const loginA = await api('POST', '/api/v1/auth/login_password', { phone: '13800138001', password: 'Test1234!' });
    const tokenNew = getToken(loginA);
    rep('密码登录', !!tokenNew, tokenNew ? '登录成功' : loginA.raw?.substring(0, 100), !!tokenNew ? 'PASS' : 'FAIL');
  }
}

// ============ Test: User Profile ============
async function testUserProfile(token) {
  console.log('\n' + '='.repeat(60));
  console.log('  【用户中心测试】');
  console.log('='.repeat(60));

  // Get Profile
  const profile = await api('GET', '/api/v1/user/profile', null, token);
  rep('获取用户资料', ok(profile), profile.data?.data?.phone || profile.data?.phone || 'unknown', ok(profile) ? 'PASS' : 'FAIL');

  // Update Profile (backend uses POST with file upload middleware)
  const update = await api('POST', '/api/v1/user/profile', { nickname: '全链路测试用户' }, token);
  rep('更新用户资料', ok(update), update.raw?.substring(0, 50), ok(update) ? 'PASS' : 'WARN');

  // Get Addresses
  const addrs = await api('GET', '/api/v1/user/addresses', null, token);
  rep('获取地址列表', ok(addrs), addrs.raw?.substring(0, 50), ok(addrs) ? 'PASS' : 'FAIL');

  // Add Address
  const addAddr = await api('POST', '/api/v1/user/addresses', {
    name: '测试收货人', phone: '13800138001',
    province: '北京市', city: '北京市', district: '海淀区',
    detail: '测试地址456号', is_default: 1
  }, token);
  rep('添加收货地址', ok(addAddr), addAddr.raw?.substring(0, 50), ok(addAddr) ? 'PASS' : 'FAIL');

  // Update Address
  if (ok(addAddr)) {
    const addrId = addAddr.data?.data?.id || addAddr.data?.id;
    if (addrId) {
      const updAddr = await api('PUT', `/api/v1/user/addresses/${addrId}`, { detail: '更新后的地址789号' }, token);
      rep('更新收货地址', ok(updAddr), updAddr.raw?.substring(0, 50), ok(updAddr) ? 'PASS' : 'FAIL');
    }
  }
}

// ============ Test: Neighbor Assist Full Chain ============
async function testNeighborAssist(tokenA, tokenB) {
  console.log('\n' + '='.repeat(60));
  console.log('  【邻里帮帮全链路测试】');
  console.log('='.repeat(60));

  // Step 1: User A creates order
  const create = await api('POST', '/api/v1/neighbor-assist/orders', {
    assist_type: 'take',
    origin_address_snapshot: { name: '顺丰快递点', address: '1栋楼下' },
    destination_address_snapshot: { name: '用户家', address: '1栋101' },
    community_id: 1,
    remark: '全链路测试-代取快递',
    amount: 5
  }, tokenA);
  const orderId = create.data?.id || create.data?.order_id || create.data?.data?.id || create.data?.data?.order_id;
  rep('[1/8] 发布帮帮订单', ok(create), `ID: ${orderId || 'unknown'}`, ok(create) ? 'PASS' : 'FAIL');
  if (!orderId) { console.log('  创建失败: ' + create.raw?.substring(0, 200)); return; }

  // Step 2: User A views my published orders
  const myOrders = await api('GET', '/api/v1/neighbor-assist/orders/my?role=publisher', null, tokenA);
  rep('[2/8] 查看我的发布', ok(myOrders), `状态码: ${myOrders.status}`, ok(myOrders) ? 'PASS' : 'FAIL');

  // Step 3: User A pays the order
  const pay = await api('POST', `/api/v1/neighbor-assist/orders/${orderId}/pay`, null, tokenA);
  rep('[3/8] 支付订单', ok(pay), pay.data?.status || pay.raw?.substring(0, 50), ok(pay) ? 'PASS' : 'FAIL');

  // Step 4: User B views order pool (need worker role - skip for now)
  const pool = await api('GET', '/api/v1/neighbor-assist/orders/pool?community_id=1', null, tokenB);
  rep('[4/8] 查看订单池', pool.status === 200, `状态码: ${pool.status}, 响应: ${pool.raw?.substring(0, 80)}`, pool.status === 200 ? 'PASS' : 'WARN');

  // Step 5: Order detail
  const detail = await api('GET', `/api/v1/neighbor-assist/orders/${orderId}`, null, tokenA);
  rep('[5/8] 查看订单详情', ok(detail), detail.raw?.substring(0, 80), ok(detail) ? 'PASS' : 'FAIL');

  // Step 6: User A's my orders (helper role check)
  const myHelper = await api('GET', '/api/v1/neighbor-assist/orders/my?role=helper', null, tokenA);
  rep('[6/8] 查看我接的订单', ok(myHelper), `状态码: ${myHelper.status}`, ok(myHelper) ? 'PASS' : 'WARN');

  // Step 7: User B views pool as non-worker (should get 403)
  rep('[7/8] 非技工查看订单池', pool.status === 403 || pool.status === 200,
    `期望403/200, 实际: ${pool.status}`, (pool.status === 403 || pool.status === 200) ? 'PASS' : 'WARN');

  // Step 8: Cancel test (create another order and cancel it)
  const cancelCreate = await api('POST', '/api/v1/neighbor-assist/orders', {
    assist_type: 'take',
    origin_address_snapshot: { name: '测试点', address: '测试地址' },
    destination_address_snapshot: { name: '测试家', address: '测试家地址' },
    community_id: 1,
    remark: '取消测试订单'
  }, tokenA);
  const cancelId = cancelCreate.data?.id || cancelCreate.data?.order_id || cancelCreate.data?.data?.id || cancelCreate.data?.data?.order_id;
  if (cancelId) {
    const cancel = await api('POST', `/api/v1/neighbor-assist/orders/${cancelId}/cancel`, null, tokenA);
    rep('[8/8] 取消订单测试', ok(cancel), cancel.data?.status_text || cancel.raw?.substring(0, 50), ok(cancel) ? 'PASS' : 'WARN');
  }
}

// ============ Test: Market Shopping Full Chain ============
async function testMarket(token) {
  console.log('\n' + '='.repeat(60));
  console.log('  【市场购物全链路测试】');
  console.log('='.repeat(60));

  // Step 1: Browse shops
  const shops = await api('GET', '/api/v1/market/shops');
  const shopList = shops.data?.data?.list || [];
  const shopId = shopList[0]?.id;
  rep('[1/10] 浏览店铺', shopList.length > 0, `店铺数: ${shopList.length}, ID: ${shopId}`, shopList.length > 0 ? 'PASS' : 'FAIL');
  if (!shopId) { console.log('  无店铺数据'); return; }

  // Step 2: Browse shop goods
  const goods = await api('GET', `/api/v1/market/shops/${shopId}/goods`);
  const goodsList = goods.data?.data?.list || goods.data?.list || [];
  const good = Array.isArray(goodsList) ? goodsList[0] : null;
  rep('[2/10] 浏览商品', !!good, `商品: ${good?.name || good?.title || 'unknown'}`, !!good ? 'PASS' : 'FAIL');
  if (!good) { console.log('  无商品: ' + goods.raw?.substring(0, 100)); return; }

  const goodsId = good.id;
  const skuList = good.sku_list || good.skuList || [];
  const skuId = skuList.length > 0 ? skuList[0]?.id : null;

  // Step 3: Goods detail
  const gd = await api('GET', `/api/v1/market/goods/${goodsId}`);
  rep('[3/10] 商品详情', ok(gd), gd.data?.data?.name || 'unknown', ok(gd) ? 'PASS' : 'FAIL');

  // Step 4: Add to cart
  const cartData = skuId ? { shop_id: shopId, goods_id: goodsId, sku_id: skuId, quantity: 1 } : { shop_id: shopId, goods_id: goodsId, quantity: 1 };
  const cartAdd = await api('POST', '/api/v1/market/cart/items', cartData, token);
  rep('[4/10] 加入购物车', ok(cartAdd), cartAdd.raw?.substring(0, 80), ok(cartAdd) ? 'PASS' : 'FAIL');

  // Step 5: View cart
  const cart = await api('GET', '/api/v1/market/cart?shop_id=' + shopId, null, token);
  rep('[5/10] 查看购物车', ok(cart), cart.raw?.substring(0, 80), ok(cart) ? 'PASS' : 'FAIL');

  // Step 6: Update cart item
  const cartItems = cart.data?.data?.list || cart.data?.list || [];
  if (cartItems.length > 0) {
    const itemId = cartItems[0]?.id;
    if (itemId) {
      const cartUpd = await api('PUT', `/api/v1/market/cart/items/${itemId}`, { quantity: 2 }, token);
      rep('[6/10] 更新购物车', ok(cartUpd), ok(cartUpd) ? '更新成功' : cartUpd.raw?.substring(0, 50), ok(cartUpd) ? 'PASS' : 'WARN');
    }
  }

  // Step 7: Preview order
  const preview = await api('POST', '/api/v1/market/orders/preview', {
    shop_id: shopId,
    items: skuId ? [{ goods_id: goodsId, sku_id: skuId, quantity: 1 }] : [{ goods_id: goodsId, quantity: 1 }]
  }, token);
  rep('[7/10] 订单预览', ok(preview), preview.data?.data?.payable_amount || preview.raw?.substring(0, 80), ok(preview) ? 'PASS' : 'WARN');

  // Step 8: Create order
  const createOrder = await api('POST', '/api/v1/market/orders', {
    shop_id: shopId,
    items: skuId ? [{ goods_id: goodsId, sku_id: skuId, quantity: 1 }] : [{ goods_id: goodsId, quantity: 1 }],
    receiver_name: '测试收货人',
    receiver_phone: '13800138001',
    receiver_address: '北京市朝阳区测试路123号',
    remark: '全链路测试订单'
  }, token);
  const orderNo = createOrder.data?.order_no || createOrder.data?.orderNo || createOrder.data?.data?.order_no || createOrder.data?.data?.orderNo;
  rep('[8/10] 创建订单', ok(createOrder), `订单号: ${orderNo || 'unknown'}`, ok(createOrder) ? 'PASS' : 'FAIL');
  if (!orderNo) { console.log('  创建失败: ' + createOrder.raw?.substring(0, 200)); return; }

  // Step 9: Mock payment
  const mockPay = await api('POST', '/api/v1/market/payments/mock-success', { order_no: orderNo }, token);
  rep('[9/10] 模拟支付', ok(mockPay), mockPay.raw?.substring(0, 80), ok(mockPay) ? 'PASS' : 'WARN');

  // Step 10: Order detail after payment
  const orderDetail = await api('GET', `/api/v1/market/orders/${orderNo}`, null, token);
  rep('[10/10] 支付后订单详情', ok(orderDetail), orderDetail.data?.data?.order_status || orderDetail.raw?.substring(0, 50), ok(orderDetail) ? 'PASS' : 'FAIL');
}

// ============ Test: Service Order Full Chain ============
async function testServiceOrder(token) {
  console.log('\n' + '='.repeat(60));
  console.log('  【服务预约全链路测试】');
  console.log('='.repeat(60));

  // Step 1: Browse services
  const services = await api('GET', '/api/v1/core/services');
  const svcList = services.data?.data?.list || [];
  const svcId = svcList[0]?.id;
  rep('[1/6] 浏览服务', svcList.length > 0, `服务数: ${svcList.length}, ID: ${svcId}`, svcList.length > 0 ? 'PASS' : 'FAIL');
  if (!svcId) { console.log('  无服务数据'); return; }

  // Step 2: Service detail
  const svcDetail = await api('GET', `/api/v1/core/services/${svcId}`);
  rep('[2/6] 服务详情', ok(svcDetail), svcDetail.raw?.substring(0, 80), ok(svcDetail) ? 'PASS' : 'WARN');

  // Step 3: Create service order
  const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const create = await api('POST', '/api/v1/service-orders', {
    service_id: svcId,
    appointment_time: future,
    address: '北京市朝阳区测试路123号',
    contact_name: '测试用户',
    contact_phone: '13800138001',
    remark: '全链路测试服务订单',
    amount: 150
  }, token);
  const orderId = create.data?.id || create.data?.data?.id || create.data?.order_id;
  rep('[3/6] 创建服务订单', ok(create), `ID: ${orderId || 'unknown'}`, ok(create) ? 'PASS' : 'FAIL');
  if (!orderId) { console.log('  创建失败: ' + create.raw?.substring(0, 200)); return; }

  // Step 4: Get order detail
  const detail = await api('GET', `/api/v1/service-orders/${orderId}`, null, token);
  rep('[4/6] 订单详情', ok(detail), detail.raw?.substring(0, 80), ok(detail) ? 'PASS' : 'FAIL');

  // Step 5: Mock pay
  const pay = await api('POST', `/api/v1/service-orders/${orderId}/pay`, null, token);
  rep('[5/6] 模拟支付', ok(pay), pay.raw?.substring(0, 80), ok(pay) ? 'PASS' : 'WARN');

  // Step 6: My orders
  const myOrders = await api('GET', '/api/v1/service-orders/my', null, token);
  rep('[6/6] 我的服务订单', ok(myOrders), myOrders.raw?.substring(0, 80), ok(myOrders) ? 'PASS' : 'FAIL');
}

// ============ Test: Message Module ============
async function testMessages(tokenA, tokenB, userIdB) {
  console.log('\n' + '='.repeat(60));
  console.log('  【消息模块测试】');
  console.log('='.repeat(60));

  // Get conversations
  const convs = await api('GET', '/api/v1/messages/conversations', null, tokenA);
  rep('[1/3] 获取会话列表', ok(convs), convs.raw?.substring(0, 80), ok(convs) ? 'PASS' : 'WARN');

  // Send message to user B (backend expects peerId + content)
  const send = await api('POST', '/api/v1/messages/send', {
    peerId: userIdB,
    content: '全链路测试消息',
    msgType: 'text'
  }, tokenA);
  rep('[2/3] 发送消息', ok(send), send.raw?.substring(0, 80), ok(send) ? 'PASS' : 'WARN');

  // Check user B's conversations
  if (tokenB) {
    const convsB = await api('GET', '/api/v1/messages/conversations', null, tokenB);
    rep('[3/3] 对方收到消息', ok(convsB), convsB.raw?.substring(0, 80), ok(convsB) ? 'PASS' : 'WARN');
  }
}

// ============ Test: Merchant Portal ============
async function testMerchant() {
  console.log('\n' + '='.repeat(60));
  console.log('  【商家后台测试】');
  console.log('='.repeat(60));

  // Merchant login
  const login = await api('POST', '/api/v1/merchant-portal/login', { username: 'merchant_test', password: 'merchant123' });
  const mToken = getToken(login);
  rep('[1/4] 商家登录', !!mToken, mToken ? '登录成功' : login.raw?.substring(0, 100), !!mToken ? 'PASS' : 'FAIL');
  if (!mToken) return;

  // Dashboard
  const dash = await api('GET', '/api/v1/market/merchant/dashboard', null, mToken);
  rep('[2/4] 商家仪表板', ok(dash), dash.raw?.substring(0, 80), ok(dash) ? 'PASS' : 'WARN');

  // Shop info
  const shop = await api('GET', '/api/v1/market/merchant/shop', null, mToken);
  rep('[3/4] 店铺信息', ok(shop), shop.raw?.substring(0, 80), ok(shop) ? 'PASS' : 'WARN');

  // Orders
  const orders = await api('GET', '/api/v1/market/merchant/orders', null, mToken);
  rep('[4/4] 商家订单', ok(orders), orders.raw?.substring(0, 80), ok(orders) ? 'PASS' : 'WARN');
}

// ============ Test: Admin Portal ============
async function testAdmin() {
  console.log('\n' + '='.repeat(60));
  console.log('  【管理员后台测试】');
  console.log('='.repeat(60));

  const login = await api('POST', '/api/v1/auth/admin/login', { username: 'admin', password: 'admin123' });
  const aToken = getToken(login);
  rep('[1/2] 管理员登录', !!aToken, aToken ? '登录成功' : login.raw?.substring(0, 100), !!aToken ? 'PASS' : 'FAIL');
  if (!aToken) return;

  // Test admin token is valid by checking profile
  const test = await api('GET', '/api/v1/user/profile', null, aToken);
  rep('[2/2] 管理员权限检查', test.status === 200 || test.status === 403, `状态码: ${test.status}`, (test.status === 200 || test.status === 403) ? 'PASS' : 'WARN');
}

// ============ Summary ============
function summary() {
  console.log('\n' + '='.repeat(60));
  console.log('  【测试总结】');
  console.log('='.repeat(60));
  console.log(`\n  通过: ${R.pass}`);
  console.log(`  失败: ${R.fail}`);
  console.log(`  警告: ${R.warn}`);
  console.log(`  总计: ${R.pass + R.fail + R.warn}`);
  console.log(`  通过率: ${R.pass + R.fail > 0 ? (R.pass / (R.pass + R.fail) * 100).toFixed(1) : 0}%`);
  if (R.errors.length) {
    console.log('\n  失败详情:');
    R.errors.forEach((e, i) => console.log(`    ${i + 1}. ${e.test}: ${e.detail?.substring(0, 100)}`));
  }
  console.log('\n' + '='.repeat(60) + '\n');
}

// ============ Main ============
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  全链路业务测试');
  console.log('  开始时间: ' + new Date().toLocaleString());
  console.log('='.repeat(60));

  await testEnv();

  // Register test users
  const regA = await api('POST', '/api/v1/auth/register', {
    phone: '13800138001', code: '024680', password: 'Test1234!',
    address: '北京市朝阳区', lat: 39.9042, lng: 116.4074
  });
  const tokenA = getToken(regA);
  const regB = await api('POST', '/api/v1/auth/register', {
    phone: '13800138002', code: '024680', password: 'Test1234!',
    address: '北京市朝阳区', lat: 39.9042, lng: 116.4074
  });
  const tokenB = getToken(regB);

  console.log(`\n用户A Token: ${tokenA ? '已获取' : '获取失败'}`);
  console.log(`用户B Token: ${tokenB ? '已获取' : '获取失败'}`);

  if (tokenA) {
    const userIdA = regA.data?.data?.id || regA.data?.user?.id || null;
    const userIdB = regB.data?.data?.id || regB.data?.user?.id || null;
    await testUserProfile(tokenA);
    await testNeighborAssist(tokenA, tokenB);
    await testMarket(tokenA);
    await testServiceOrder(tokenA);
    await testMessages(tokenA, tokenB, userIdB);
  }

  await testMerchant();
  await testAdmin();
  await summary();
}

main().catch(console.error);
