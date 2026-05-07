/**
 * E2E 测试：到家服务订单完整生命周期
 * 流程：用户创建服务订单 → 支付 → 服务商接单 → 派单给技工 → 技工签到 → 上传证据 → 完成服务 → 用户确认
 *
 * 默认自启本仓库 API（PORT 默认 3099），测新路由；打已部署实例请传参：
 *   E2E_BASE_URL=http://127.0.0.1:3000/api/v1 node scripts/e2e-service-order-lifecycle.js --external
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true, quiet: true });
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

let childProc = null;

function shouldSpawnEmbedded() {
  if (process.argv.includes('--external')) return false;
  if (process.env.E2E_EXTERNAL === '1') return false;
  if (process.env.E2E_SPAWN_SERVER === '0') return false;
  return true;
}

async function maybeSpawnServer() {
  if (!shouldSpawnEmbedded()) return;
  const root = path.join(__dirname, '..');
  const port = process.env.E2E_CHILD_PORT || '3099';
  const childEnv = {
    ...process.env,
    PORT: String(port),
    E2E_API_PORT: String(port),
    E2E_CLEAR_WX_SECRET: '1',
    WX_APPSECRET: ''
  };
  delete childEnv.E2E_BASE_URL;
  delete childEnv.E2E_SPAWN_SERVER;
  childProc = spawn(process.execPath, [path.join(root, 'src/index.js')], {
    cwd: root,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let errBuf = '';
  childProc.stderr.on('data', (c) => { errBuf += String(c); if (errBuf.length > 6000) errBuf = errBuf.slice(-3000); });
  process.env.E2E_BASE_URL = `http://127.0.0.1:${port}/api/v1`;
  const hc = axios.create({ baseURL: process.env.E2E_BASE_URL, timeout: 5000, validateStatus: () => true });
  for (let i = 0; i < 60; i++) {
    try {
      const h1 = await hc.get('/core/banners');
      if (h1.status === 200 && h1.data && typeof h1.data === 'object' && h1.data.errno === 0) return;
    } catch (_) { /* 子进程尚未监听 */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  try { childProc.kill('SIGTERM'); } catch (_) { /* */ }
  throw new Error(`E2E: 子进程未就绪 port=${port}。stderr:\n${errBuf || '(无)'}`);
}

function getBase() {
  return process.env.E2E_BASE_URL || 'http://127.0.0.1:3099/api/v1';
}

function unwrapPayload(r) {
  const d = r && r.data;
  if (!d) return null;
  if (typeof d.errno === 'number' && d.errno === 0) return d.data;
  if (d.message === 'ok' && d.data !== undefined) return d.data;
  return d;
}

let fails = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    fails++;
    console.error(`FAIL ${name}`, detail);
  }
}

async function main() {
  await maybeSpawnServer();
  const base = getBase();
  console.log('E2E base:', base);
  const client = axios.create({ baseURL: base, timeout: 20000, validateStatus: () => true });

  // ========== 1) 用户登录 ==========
  const code = `e2e_${Date.now()}`;
  let r = await client.post('/auth/login', { code, nickname: 'E2E测试用户' });
  ok('POST auth/login', r.status === 200 && r.data.token, JSON.stringify(r.data).slice(0, 150));
  const userToken = r.data.token;
  const userClient = axios.create({
    baseURL: base, timeout: 15000,
    headers: { Authorization: `Bearer ${userToken}` },
    validateStatus: () => true
  });

  // ========== 2) 服务商门户登录 ==========
  r = await client.post('/service-provider-portal/login', { username: 'sp_demo', password: 'sp_demo123' });
  ok('POST service-provider-portal/login', r.status === 200 && r.data.data && r.data.data.token, JSON.stringify(r.data).slice(0, 200));
  const spToken = r.data.data && r.data.data.token;
  const spClient = axios.create({
    baseURL: base, timeout: 15000,
    headers: { Authorization: `Bearer ${spToken}` },
    validateStatus: () => true
  });

  // ========== 3) 获取服务商信息和服务列表 ==========
  r = await spClient.get('/service-provider-portal/me');
  ok('GET service-provider-portal/me', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));
  const spProfile = unwrapPayload(r);
  const spProfileId = spProfile && spProfile.id;
  ok('spProfile has id', !!spProfileId, JSON.stringify(spProfile));

  r = await spClient.get('/service-provider-portal/services');
  ok('GET service-provider-portal/services', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));
  const spServices = unwrapPayload(r);
  const spServiceList = spServices && spServices.list ? spServices.list : (Array.isArray(spServices) ? spServices : []);
  ok('sp services has items', spServiceList.length > 0, JSON.stringify(spServices).slice(0, 200));
  const testService = spServiceList[0];
  const testServiceId = testService.id;
  console.log('Using service:', testServiceId, testService.title || testService.name);

  // ========== 4) 用户创建服务订单 ==========
  r = await userClient.post('/service-orders', {
    service_id: testServiceId,
    community_id: 1,
    address_snapshot: { contact: '测试用户', phone: '13900000000', detail: '测试小区1号楼101' },
    remark: 'e2e lifecycle test'
  });
  ok('POST service-orders (create)', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));
  const soData = unwrapPayload(r);
  const soId = soData && (soData.id || soData.order_id);
  const soOrderNo = soData && soData.order_no;
  ok('service-order has id', !!soId, JSON.stringify(soData));
  console.log('Created service order:', soId, soOrderNo);

  // ========== 5) 用户支付订单 ==========
  r = await userClient.post(`/service-orders/${soId}/pay`);
  ok('POST service-orders/:id/pay', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));

  // 验证订单状态为 pending_accept（因为 provider_user_id 会设置）
  r = await userClient.get('/service-orders/my', { params: { page: 1, page_size: 10 } });
  ok('GET service-orders/my after pay', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));
  const myOrders = r.data.data && r.data.data.list;
  const paidOrder = Array.isArray(myOrders) && myOrders.find(o => o.id === soId);
  ok('paid order found in my orders', !!paidOrder, 'order id=' + soId);
  if (paidOrder) {
    ok('order pay_status is paid', paidOrder.pay_status === 'paid', paidOrder.pay_status);
    ok('order status is pending_accept', paidOrder.status === 'pending_accept', paidOrder.status);
  }

  // ========== 6) 服务商查看订单列表并接单 ==========
  r = await spClient.get('/service-provider-portal/orders');
  ok('GET sp-portal/orders', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));
  const spOrders = unwrapPayload(r);
  const spOrderList = spOrders && spOrders.list ? spOrders.list : [];
  const foundOrder = spOrderList.find(o => o.id === soId);
  ok('sp can see the order', !!foundOrder, 'order id=' + soId);

  r = await spClient.post(`/service-provider-portal/orders/${soId}/accept`);
  ok('POST sp-portal/orders/:id/accept', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));
  const acceptData = unwrapPayload(r);
  ok('accept returns status paid_pending_dispatch', acceptData && acceptData.status === 'paid_pending_dispatch', acceptData && acceptData.status);

  // ========== 7) 服务商派单给技工 ==========
  // 先获取技工列表
  r = await spClient.get('/service-provider-portal/workers/list');
  ok('GET sp-portal/workers/list', r.status === 200, JSON.stringify(r.data).slice(0, 200));
  const workersData = unwrapPayload(r);
  const workersList = workersData && workersData.list ? workersData.list : [];
  ok('workers list has items', workersList.length > 0, JSON.stringify(workersData).slice(0, 200));

  // 使用 admin 派单接口（因为服务商门户目前没有直接派单给技工的接口）
  const adminUser = process.env.ADMIN_USERNAME || 'wsxCDE';
  const adminPass = String(process.env.ADMIN_PASSWORD || '').replace(/^"|"$/g, '');
  let adminToken = null;
  if (adminPass) {
    r = await client.post('/auth/admin/login', { username: adminUser, password: adminPass });
    ok('POST auth/admin/login', r.status === 200 && (r.data.data?.token || r.data.token), JSON.stringify(r.data).slice(0, 100));
    adminToken = r.data.data?.token || r.data.token;
  }

  let workerId = null;
  let workerUserId = null;
  if (workersList.length > 0) {
    workerId = workersList[0].id;
    workerUserId = workersList[0].user_id || workersList[0].user && workersList[0].user.id;
  }

  // 如果没有worker portal token，尝试用admin派单
  if (adminToken && workerId) {
    const adminClient = axios.create({
      baseURL: base, timeout: 15000,
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });
    r = await adminClient.post(`/admin/service-orders/${soId}/assign`, { worker_id: workerId });
    ok('POST admin/service-orders/:id/assign', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));
  } else {
    console.log('SKIP admin dispatch: no admin credentials or no workers');
  }

  // ========== 8) 技工登录并操作 ==========
  // 技工使用 worker portal 登录
  // 先用 user JWT 模拟（因为 worker portal 通常也是 user JWT）
  // 查找一个有效的技工用户
  if (workerUserId) {
    // 尝试用技工的 user_id 登录获取 token
    // 由于我们不知道技工用户的微信code，使用 DEBUG 模式或 admin 创建
    // 这里使用已有的 userToken（如果技工 user_id=1 的话）
    // 否则跳过技工操作
    console.log('Worker user_id:', workerUserId);

    // 尝试通过 worker portal 获取订单（使用 user JWT + DEBUG_SKIP_WORKER_TOKEN）
    // 由于环境变量可能未设置，我们直接测试 worker portal 端点
    const workerClient = axios.create({
      baseURL: base, timeout: 15000,
      headers: { Authorization: `Bearer ${userToken}` },
      validateStatus: () => true
    });

    // 如果 DEBUG_SKIP_WORKER_TOKEN=1，userToken 可以直接访问 worker portal
    r = await workerClient.get('/worker/orders');
    ok('GET worker/orders', r.status === 200, `status=${r.status} data=${JSON.stringify(r.data).slice(0, 200)}`);

    // 技工接单
    if (r.status === 200 && r.data.errno === 0) {
      const workerOrders = unwrapPayload(r);
      const wOrderList = workerOrders && workerOrders.list ? workerOrders.list : [];
      const wOrder = wOrderList.find(o => o.id === soId);
      if (wOrder) {
        r = await workerClient.post(`/worker/orders/${soId}/accept`);
        ok('POST worker/orders/:id/accept', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));

        // 技工签到
        r = await workerClient.post(`/worker/orders/${soId}/check-in`, {
          latitude: 31.2304,
          longitude: 121.4737,
          address: '上海市测试地址'
        });
        ok('POST worker/orders/:id/check-in', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));

        // 技工上传证据
        r = await workerClient.post(`/worker/orders/${soId}/evidence`, {
          before_images: ['https://example.com/before1.jpg'],
          after_images: ['https://example.com/after1.jpg']
        });
        ok('POST worker/orders/:id/evidence', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));

        // 技工完成服务
        r = await workerClient.post(`/worker/orders/${soId}/complete`);
        ok('POST worker/orders/:id/complete', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 300));
        const completeData = unwrapPayload(r);
        ok('complete returns pending_user_confirm or completed',
          completeData && (completeData.status === 'pending_user_confirm' || completeData.status === 'completed'),
          completeData && completeData.status);
      } else {
        console.log('SKIP worker ops: worker cannot see order (may need DEBUG_SKIP_WORKER_TOKEN=1)');
      }
    } else {
      console.log('SKIP worker ops: worker/orders returned', r.status, r.data && r.data.errmsg);
    }
  } else {
    console.log('SKIP worker ops: no worker found');
  }

  // ========== 9) 用户确认完成 ==========
  r = await userClient.post(`/service-orders/${soId}/confirm`);
  ok('POST service-orders/:id/confirm', r.status === 200, `status=${r.status} data=${JSON.stringify(r.data).slice(0, 300)}`);

  // ========== 10) 验证最终状态 ==========
  r = await userClient.get(`/service-orders/${soId}`);
  ok('GET service-orders/:id final', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));
  const finalOrder = unwrapPayload(r);
  ok('final order status is completed', finalOrder && finalOrder.status === 'completed', finalOrder && finalOrder.status);

  // ========== 11) 服务商门户新功能测试 ==========
  // 客户管理
  r = await spClient.get('/service-provider-portal/customers');
  ok('GET sp-portal/customers', r.status === 200, `status=${r.status}`);

  // 支付记录
  r = await spClient.get('/service-provider-portal/payments');
  ok('GET sp-portal/payments', r.status === 200, `status=${r.status}`);

  // 营销统计
  r = await spClient.get('/service-provider-portal/marketing/stats');
  ok('GET sp-portal/marketing/stats', r.status === 200, `status=${r.status}`);

  // 财务概览
  r = await spClient.get('/service-provider-portal/finance/income/summary');
  ok('GET sp-portal/finance/income/summary', r.status === 200, `status=${r.status}`);

  // 退款列表
  r = await spClient.get('/service-provider-portal/refunds');
  ok('GET sp-portal/refunds', r.status === 200, `status=${r.status}`);

  // ========== 结果汇总 ==========
  if (fails) {
    console.error('\nTOTAL FAILURES:', fails);
    if (childProc) try { childProc.kill('SIGTERM'); } catch (_) { /* */ }
    process.exit(1);
  }
  console.log('\nALL PASSED');
  if (childProc) try { childProc.kill('SIGTERM'); } catch (_) { /* */ }
}

main().catch((e) => {
  console.error(e);
  if (childProc) try { childProc.kill('SIGTERM'); } catch (_) { /* */ }
  process.exit(1);
});
