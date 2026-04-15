/**
 * 端到端仿真：首页/到家服务域 + 管理端派单
 * 默认自启本仓库 API（PORT 默认 3099），测新路由；打已部署实例请传参：
 *   E2E_BASE_URL=http://127.0.0.1:3000/api/v1 node scripts/e2e-home-service-test.js --external
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
  // 不用 .env 里的 PORT（常为 3001），避免与线上/本机已占用端口冲突
  const port = process.env.E2E_CHILD_PORT || '3099';
  // 子进程走本地 mock 登录，避免 E2E code 调真实微信失败
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
  // 覆盖 .env 里可能指向旧实例的 E2E_BASE_URL
  process.env.E2E_BASE_URL = `http://127.0.0.1:${port}/api/v1`;
  const hc = axios.create({ baseURL: process.env.E2E_BASE_URL, timeout: 5000, validateStatus: () => true });
  for (let i = 0; i < 60; i++) {
    try {
      const h1 = await hc.get('/core/banners');
      if (h1.status === 200 && h1.data && typeof h1.data === 'object' && h1.data.errno === 0) return;
    } catch (_) { /* 子进程尚未监听 */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  try {
    childProc.kill('SIGTERM');
  } catch (_) { /* */ }
  throw new Error(`E2E: 子进程未就绪 port=${port}。stderr:\n${errBuf || '(无)'}`);
}

function getBase() {
  return process.env.E2E_BASE_URL || 'http://127.0.0.1:3099/api/v1';
}

/** 兼容 { errno, data } 与历史 { message, data } */
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

  // 1) Core read — banners
  let r = await client.get('/core/banners');
  ok('GET core/banners HTTP 200', r.status === 200, r.status);
  const banners = unwrapPayload(r);
  ok('GET core/banners payload', Array.isArray(banners), JSON.stringify(r.data).slice(0, 200));

  // 2) services hot
  r = await client.get('/core/services/hot', { params: { limit: 5 } });
  ok('GET core/services/hot', r.status === 200 && (r.data.errno === 0 || r.data.message === 'ok'), r.status);
  const hotSvc = unwrapPayload(r);
  ok('GET core/services/hot data array', Array.isArray(hotSvc), JSON.stringify(r.data).slice(0, 120));

  // 3) service-groups tidy
  r = await client.get('/core/service-groups/tidy');
  ok('GET core/service-groups/tidy', r.status === 200 && (r.data.errno === 0 || r.data.message === 'ok'), r.data && r.data.errmsg);
  const sg = unwrapPayload(r);
  ok('service-groups has categories+services', sg && Array.isArray(sg.categories) && Array.isArray(sg.services), '');

  // 4) invalid group key
  r = await client.get('/core/service-groups/invalid_key_xyz');
  ok('GET invalid service-group errno!=0', r.status === 200 && r.data.errno !== 0, r.data);

  // 5) workers list shape
  r = await client.get('/core/workers', { params: { page: 1, page_size: 5 } });
  ok('GET core/workers', r.status === 200 && (r.data.errno === 0 || r.data.message === 'ok'), JSON.stringify(r.data).slice(0, 80));
  const wraw = unwrapPayload(r);
  const wlist = Array.isArray(wraw) ? wraw : wraw && wraw.list;
  ok('GET core/workers has list', Array.isArray(wlist), JSON.stringify(wraw).slice(0, 100));

  // 6) community hot — need community_id
  r = await client.get('/core/community/hot', { params: { community_id: 1, days: 30, type: 'all' } });
  ok('GET core/community/hot', r.status === 200 && r.data.errno === 0, r.data && r.data.errmsg);
  const hot = unwrapPayload(r);
  ok('community/hot has services+shops', hot && Array.isArray(hot.services) && Array.isArray(hot.shops), '');

  r = await client.get('/core/community/hot');
  ok('GET community/hot without id errno', r.status === 200 && r.data.errno !== 0, r.data);

  // 7) goods featured + detail
  r = await client.get('/core/goods/featured');
  ok('GET core/goods/featured', r.status === 200 && (r.data.errno === 0 || r.data.message === 'ok'), '');
  const goods = unwrapPayload(r);
  const gid = Array.isArray(goods) && goods[0] ? goods[0].id : 1;
  r = await client.get(`/core/goods/${gid}`);
  ok('GET core/goods/:id', r.status === 200 && (r.data.errno === 0 || r.data.message === 'ok'), r.data);

  // 8) User login
  const code = `e2e_${Date.now()}`;
  r = await client.post('/auth/login', { code, nickname: 'E2E用户' });
  ok('POST auth/login', r.status === 200 && r.data.token, JSON.stringify(r.data).slice(0, 150));
  const userToken = r.data.token;
  const userClient = axios.create({
    baseURL: base,
    timeout: 15000,
    headers: { Authorization: `Bearer ${userToken}` },
    validateStatus: () => true
  });

  // 9) service order create + pay
  r = await userClient.post('/service-orders', {
    service_id: 1,
    community_id: 1,
    address_snapshot: { contact: '测', phone: '13900000000', detail: '测试地址' },
    remark: 'e2e'
  });
  ok('POST service-orders', r.status === 200 && r.data.errno === 0, r.status + ' ' + JSON.stringify(r.data).slice(0, 200));
  const soId = r.data.data && (r.data.data.id || r.data.data.order_id);
  ok('service-orders has id', !!soId, JSON.stringify(r.data));

  r = await userClient.post(`/service-orders/${soId}/pay`);
  ok('POST service-orders/:id/pay', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));

  r = await userClient.get('/service-orders/my');
  ok('GET service-orders/my', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 150));

  // 10) neighbor assist
  r = await userClient.post('/neighbor-assist/orders', {
    assist_type: 'take',
    community_id: 1,
    origin_address_snapshot: { label: '取货', detail: 'A小区1号' },
    destination_address_snapshot: { label: '收货', detail: 'B小区2号' },
    amount: 10.5,
    remark: 'e2e帮帮'
  });
  ok('POST neighbor-assist/orders', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));
  const naId = r.data.data && (r.data.data.id || r.data.data.order_id);
  ok('neighbor order id', !!naId, JSON.stringify(r.data));

  r = await userClient.post(`/neighbor-assist/orders/${naId}/pay`);
  ok('POST neighbor-assist/orders/:id/pay', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));

  // 11) Admin
  const adminUser = process.env.ADMIN_USERNAME || 'wsxCDE';
  const adminPass = String(process.env.ADMIN_PASSWORD || '').replace(/^"|"$/g, '');
  if (!adminPass) {
    console.error('SKIP admin tests: no ADMIN_PASSWORD');
  } else {
    r = await client.post('/auth/admin/login', { username: adminUser, password: adminPass });
    ok('POST auth/admin/login', r.status === 200 && (r.data.data?.token || r.data.token), JSON.stringify(r.data).slice(0, 100));
    const adminToken = r.data.data?.token || r.data.token;
    const adminClient = axios.create({
      baseURL: base,
      timeout: 15000,
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    r = await adminClient.get('/admin/dispatch-queue');
    ok('GET admin/dispatch-queue', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));

    r = await adminClient.get('/admin/service-orders', { params: { status: 'paid_pending_dispatch', limit: 20 } });
    ok('GET admin/service-orders', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 150));
    ok('admin/service-orders data is array', Array.isArray(r.data.data), typeof r.data.data);

    r = await adminClient.get('/admin/neighbor-assist/orders', { params: { limit: 20 } });
    ok('GET admin/neighbor-assist/orders', r.status === 200 && r.data.errno === 0, '');

    const workerId = 2;
    r = await adminClient.post(`/admin/service-orders/${soId}/assign`, { worker_id: workerId });
    ok('POST admin/service-orders/:id/assign', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));

    r = await adminClient.post(`/admin/neighbor-assist/orders/${naId}/assign`, { worker_id: workerId });
    ok('POST admin/neighbor-assist/orders/:id/assign', r.status === 200 && r.data.errno === 0, JSON.stringify(r.data).slice(0, 200));

    r = await adminClient.post(`/admin/service-orders/${soId}/assign`, { worker_id: workerId });
    ok('重复派单应失败', r.status === 200 && r.data.errno !== 0, JSON.stringify(r.data).slice(0, 120));
  }

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
