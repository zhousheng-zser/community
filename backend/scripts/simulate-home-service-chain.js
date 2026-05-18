/**
 * 模拟「改版首页」到家服务购买全链路假数据跑通，校验用户侧与履约方（技工 / 运营派单 / 服务商）逻辑。
 *
 * 场景：
 *  A 首页曝光 → 家修急事分组 → 服务详情 → 直约本小区技工 → 支付 → 技工侧履约 → 用户确认
 *  B 同服务不直约 → 支付待派单 → 运营指派技工 → 技工履约 → 用户确认
 *  C 服务商打包单 → 支付 → 服务商侧履约 → 用户确认
 *
 * 用法：cd backend && node scripts/simulate-home-service-chain.js
 * 外置 API：E2E_EXTERNAL=1 E2E_BASE_URL=http://127.0.0.1:3001/api/v1 node scripts/simulate-home-service-chain.js
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), override: false, quiet: true });

const LABEL = process.env.E2E_COMMUNITY_LABEL || '上海合川路地铁站';
const COMM_MAIN = parseInt(process.env.E2E_COMMUNITY_ID_MAIN || '1', 10);
const COMM_ALT = parseInt(process.env.E2E_COMMUNITY_ID_ALT || '2', 10);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getEnv(k, d) {
  return process.env[k] != null && process.env[k] !== '' ? process.env[k] : d;
}

let childProc = null;
function shouldSpawn() {
  if (process.argv.includes('--external')) return false;
  if (process.env.E2E_EXTERNAL === '1') return false;
  return true;
}

async function maybeSpawnServer() {
  if (!shouldSpawn()) return;
  const root = path.join(__dirname, '..');
  const port = process.env.E2E_CHILD_PORT || '3099';
  const childEnv = {
    ...process.env,
    PORT: String(port),
    E2E_API_PORT: String(port),
    E2E_CLEAR_WX_SECRET: '1',
    WX_APPSECRET: '',
    JWT_SECRET: getEnv('JWT_SECRET', 'default_secret'),
    DB_HOST: getEnv('DB_HOST', '127.0.0.1'),
    DB_PORT: getEnv('DB_PORT', '3306'),
    DB_USER: getEnv('DB_USER', 'root'),
    DB_PASSWORD: getEnv('DB_PASSWORD', 'root'),
    DB_NAME: getEnv('DB_NAME', 'community_db')
  };
  delete childEnv.E2E_BASE_URL;
  childProc = spawn(process.execPath, [path.join(root, 'src/index.js')], {
    cwd: root,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  process.env.E2E_BASE_URL = `http://127.0.0.1:${port}/api/v1`;
  const hc = axios.create({ baseURL: process.env.E2E_BASE_URL, timeout: 5000, validateStatus: () => true });
  for (let i = 0; i < 60; i++) {
    try {
      const h1 = await hc.get('/core/banners');
      if (h1.status === 200 && h1.data && h1.data.errno === 0) return;
    } catch (_) {}
    await sleep(200);
  }
  try {
    childProc.kill('SIGTERM');
  } catch (_) {}
  throw new Error('simulate-home-service-chain: API 子进程未就绪');
}

function getBase() {
  return process.env.E2E_BASE_URL || 'http://127.0.0.1:3099/api/v1';
}

async function seedMinimal(models) {
  const { Category, Service, sequelize } = models;
  const t = await sequelize.transaction();
  try {
    const cat = await Category.create(
      {
        name: `${LABEL}-链路演练`,
        icon_url: '/img/index/menuicon1.png',
        sort_order: 1,
        group_type: 'urgent_fix'
      },
      { transaction: t }
    );
    const svc = await Service.create(
      {
        category_id: cat.id,
        title: `${LABEL}-家修演练单`,
        description: `${LABEL} 全链路模拟`,
        price: 88,
        cover_image: 'https://example.com/chain.png',
        sales_count: 0,
        is_published: 1
      },
      { transaction: t }
    );
    await t.commit();
    return { serviceId: svc.id, categoryId: cat.id };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

function addr() {
  return { label: LABEL, detail: `${LABEL}·演练地址`, contact: '模拟用户', phone: '13800138000' };
}

async function login(http, code, nickname) {
  const r = await http.post('/auth/login', { code, nickname });
  if (r.status !== 200 || !r.data.token || !r.data.user) throw new Error(`login ${code}: ${r.status} ${JSON.stringify(r.data)}`);
  return { token: r.data.token, user: r.data.user };
}

function adminToken() {
  const secret = getEnv('JWT_SECRET', 'default_secret');
  const pass = String(process.env.ADMIN_PASSWORD || '').trim();
  if (pass) return null;
  return jwt.sign({ sub: 'chain_sim_admin', admin: true }, secret, { expiresIn: '1d' });
}

async function getAdminHttp(http) {
  const pass = String(process.env.ADMIN_PASSWORD || '').trim();
  const user = process.env.ADMIN_USERNAME || 'wsxCDE';
  if (pass) {
    const r = await http.post('/auth/admin/login', { username: user, password: pass });
    const tok = r.data && r.data.data && r.data.data.token;
    if (r.status === 200 && tok) {
      return axios.create({
        baseURL: http.defaults.baseURL,
        timeout: 20000,
        validateStatus: () => true,
        headers: { Authorization: `Bearer ${tok}` }
      });
    }
  }
  const t = adminToken();
  if (!t) throw new Error('需要 ADMIN_PASSWORD 或可用 JWT 兜底（无密码时脚本用 jwt.sign）');
  return axios.create({
    baseURL: http.defaults.baseURL,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${t}` }
  });
}

async function approveWorker(adminHttp, applicationId) {
  const r = await adminHttp.put(`/admin/worker-applications/${applicationId}`, { status: 'approved', note: 'chain' });
  return r.status === 200 && r.data && r.data.message === 'ok';
}

async function approveProvider(adminHttp, applicationId, communityId) {
  const r = await adminHttp.put(`/admin/service-provider-applications/${applicationId}`, {
    status: 'approved',
    note: 'chain',
    community_id: communityId
  });
  return r.status === 200 && r.data && r.data.message === 'ok';
}

async function workerApply(workerHttp, name) {
  const r = await workerHttp.post('/worker/apply', {
    name: name || '链路演练师傅',
    phone: '13900001001',
    industry: '维修',
    education: '高中',
    city: '上海市',
    resume: 'chain sim',
    id_card_url: '/uploads/id.jpg',
    work_photo_url: '/uploads/w.jpg',
    certificate_url: ['/uploads/c.jpg']
  });
  const d = r.data && (r.data.data || r.data);
  const aid = d && (d.application_id || d.id);
  return { status: r.status, applicationId: aid };
}

async function providerApply(providerHttp, userId) {
  const models = require('../src/models');
  const r = await providerHttp.post('/service-provider/apply', {
    shop_name: `${LABEL}演练店`,
    contact_name: '店长',
    phone: '13900002002',
    license_url: '/uploads/l.jpg',
    shop_front_url: '/uploads/f.jpg',
    environment_url: ['/uploads/e.jpg'],
    id_card_url: '/uploads/id2.jpg'
  });
  const d = r.data && (r.data.data || r.data);
  let aid = d && (d.application_id || d.id);
  if (!aid && r.status === 201 && userId) {
    const row = await models.ServiceProviderApplication.findOne({
      where: { user_id: userId },
      order: [['id', 'DESC']]
    });
    if (row) aid = row.id;
  }
  return { status: r.status, applicationId: aid };
}

async function fulfillWorker(workerHttp, orderId) {
  let r = await workerHttp.post(`/worker/service-orders/${orderId}/accept`);
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`技工接单失败: ${JSON.stringify(r.data)}`);
  r = await workerHttp.post(`/worker/service-orders/${orderId}/check-in`, { latitude: 31.18, longitude: 121.38, accuracy: 12 });
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`打卡失败: ${JSON.stringify(r.data)}`);
  r = await workerHttp.post(`/worker/service-orders/${orderId}/evidence`, { kind: 'before', urls: ['https://example.com/b.jpg'] });
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`证据before: ${JSON.stringify(r.data)}`);
  r = await workerHttp.post(`/worker/service-orders/${orderId}/evidence`, { kind: 'after', urls: ['https://example.com/a.jpg'] });
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`证据after: ${JSON.stringify(r.data)}`);
  r = await workerHttp.post(`/worker/service-orders/${orderId}/complete`);
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`完成服务: ${JSON.stringify(r.data)}`);
}

async function fulfillProvider(providerHttp, orderId) {
  let r = await providerHttp.post(`/service-provider/orders/${orderId}/accept`);
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`服务商接单: ${JSON.stringify(r.data)}`);
  r = await providerHttp.post(`/service-provider/orders/${orderId}/check-in`, { latitude: 31.18, longitude: 121.38, accuracy: 12 });
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`服务商打卡: ${JSON.stringify(r.data)}`);
  r = await providerHttp.post(`/service-provider/orders/${orderId}/evidence`, { kind: 'before', urls: ['https://example.com/spb.jpg'] });
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`服务商证据: ${JSON.stringify(r.data)}`);
  r = await providerHttp.post(`/service-provider/orders/${orderId}/evidence`, { kind: 'after', urls: ['https://example.com/spa.jpg'] });
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`服务商证据2: ${JSON.stringify(r.data)}`);
  r = await providerHttp.post(`/service-provider/orders/${orderId}/complete`);
  if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`服务商完成: ${JSON.stringify(r.data)}`);
}

async function main() {
  const results = [];
  function ok(name, extra) {
    results.push({ name, ok: true, ...extra });
    console.log(`[OK] ${name}`, extra || '');
  }
  function fail(name, err, extra) {
    results.push({ name, ok: false, err: String(err), ...extra });
    console.error(`[FAIL] ${name}`, err, extra || '');
  }

  await maybeSpawnServer();
  const base = getBase();
  const http = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true });

  const models = require('../src/models');
  await models.sequelize.authenticate();
  try {
    const migSp = require('../src/migrations/20260421170000-service-provider-community.js');
    await migSp.up(models.sequelize.getQueryInterface(), require('sequelize'));
  } catch (e) {
    if (!String(e.message || '').includes('Duplicate')) console.warn('[chain] migrate sp-community:', e.message);
  }

  const seeded = await seedMinimal(models);
  const adminHttp = await getAdminHttp(http);

  const ts = Date.now();
  const workerLogin = await login(http, `chain_w_${ts}`, '链路演练技工');
  const workerBLogin = await login(http, `chain_w2_${ts}`, '链路演练技工B');
  const workerCLogin = await login(http, `chain_w3_${ts}`, '链路演练技工C异地');
  const buyerLogin = await login(http, `chain_buyer_${ts}`, '链路演练用户');
  const providerLogin = await login(http, `chain_sp_${ts}`, '链路演练服务商');

  await models.User.update(
    { community_id: COMM_MAIN },
    { where: { id: [workerLogin.user.id, workerBLogin.user.id, workerCLogin.user.id, buyerLogin.user.id, providerLogin.user.id] } }
  );

  const workerHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${workerLogin.token}` } });
  const workerBHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${workerBLogin.token}` } });
  const workerCHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${workerCLogin.token}` } });
  const buyerHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${buyerLogin.token}` } });
  const providerHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${providerLogin.token}` } });

  const wa = await workerApply(workerHttp, '张师傅');
  const wb = await workerApply(workerBHttp, '李师傅');
  if (wa.applicationId && (await approveWorker(adminHttp, wa.applicationId))) ok('审核技工A');
  else fail('审核技工A', 'skip or failed', wa);
  if (wb.applicationId && (await approveWorker(adminHttp, wb.applicationId))) ok('审核技工B');
  else fail('审核技工B', 'skip or failed', wb);

  const wc = await workerApply(workerCHttp, '异地王师傅');
  if (wc.applicationId && (await approveWorker(adminHttp, wc.applicationId))) ok('审核技工C');
  else fail('审核技工C', 'skip or failed', wc);

  const wpA = await models.WorkerProfile.findOne({ where: { user_id: workerLogin.user.id } });
  const wpB = await models.WorkerProfile.findOne({ where: { user_id: workerBLogin.user.id } });
  const wpC = await models.WorkerProfile.findOne({ where: { user_id: workerCLogin.user.id } });
  if (wpA) await wpA.update({ community_id: COMM_MAIN });
  if (wpB) await wpB.update({ community_id: COMM_MAIN });
  if (wpC) await wpC.update({ community_id: COMM_ALT });

  const spa = await providerApply(providerHttp, providerLogin.user.id);
  let spAppId = spa.applicationId;
  if (!spAppId && spa.status === 201) {
    const row = await models.ServiceProviderApplication.findOne({
      where: { user_id: providerLogin.user.id },
      order: [['id', 'DESC']]
    });
    if (row) spAppId = row.id;
  }
  if (spAppId && (await approveProvider(adminHttp, spAppId, COMM_MAIN))) ok('审核服务商');
  else fail('审核服务商', 'skip or failed', spa);

  const spp = await models.ServiceProviderProfile.findOne({ where: { user_id: providerLogin.user.id, status: 'active' } });

  // ----- 首页与分组 -----
  const rBanner = await http.get('/core/banners');
  const rGroup = await http.get('/core/service-groups/urgent_fix');
  const groupData = rGroup.data && rGroup.data.errno === 0 ? rGroup.data.data : null;
  const services = groupData && groupData.services;
  const inGroup = Array.isArray(services) && services.some((s) => s.id === seeded.serviceId);
  if (rBanner.status === 200 && rBanner.data && rBanner.data.errno === 0 && inGroup) ok('首页：banners + 家修急事分组含本单服务', { serviceId: seeded.serviceId });
  else fail('首页曝光', { banner: rBanner.status, inGroup });

  const rDetail = await http.get(`/core/services/${seeded.serviceId}`);
  if (rDetail.status === 200 && rDetail.data && rDetail.data.errno === 0) ok('服务详情');
  else fail('服务详情', rDetail.data);

  // ----- A 直约技工A -----
  try {
    let r = await buyerHttp.post('/service-orders', {
      service_id: seeded.serviceId,
      worker_id: workerLogin.user.id,
      community_id: COMM_MAIN,
      address_snapshot: addr(),
      remark: `${LABEL} 场景A直约`
    });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(JSON.stringify(r.data));
    const oid = r.data.data.id;
    const row0 = await models.ServiceOrder.findByPk(oid);
    if (row0.status !== 'pending_worker_accept' || row0.assigned_worker_id !== workerLogin.user.id) throw new Error(`状态应为待技工接单: ${row0.status}`);

    r = await buyerHttp.post(`/service-orders/${oid}/pay`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('支付失败');
    const row1 = await models.ServiceOrder.findByPk(oid);
    if (row1.status !== 'pending_worker_accept') throw new Error(`支付后应仍为 pending_worker_accept: ${row1.status}`);

    await fulfillWorker(workerHttp, oid);
    r = await buyerHttp.post(`/service-orders/${oid}/confirm-complete`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('用户确认失败');
    const done = await models.ServiceOrder.findByPk(oid);
    if (done.status !== 'completed') throw new Error(`应已完成: ${done.status}`);
    ok('场景A：直约技工 → 支付 → 技工履约 → 用户确认', { order_id: oid, buyer: buyerLogin.user.id, worker: workerLogin.user.id });
  } catch (e) {
    fail('场景A：直约链路', e.message);
  }

  // ----- B 不直约 → 运营派单给技工B -----
  try {
    let r = await buyerHttp.post('/service-orders', {
      service_id: seeded.serviceId,
      community_id: COMM_MAIN,
      address_snapshot: addr(),
      remark: `${LABEL} 场景B待派单`
    });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(JSON.stringify(r.data));
    const oid = r.data.data.id;
    r = await buyerHttp.post(`/service-orders/${oid}/pay`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('支付失败');
    const row1 = await models.ServiceOrder.findByPk(oid);
    if (row1.status !== 'paid_pending_dispatch') throw new Error(`应待派单: ${row1.status}`);

    r = await adminHttp.post(`/admin/service-orders/${oid}/assign`, { worker_id: workerBLogin.user.id });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`派单失败: ${JSON.stringify(r.data)}`);
    const row2 = await models.ServiceOrder.findByPk(oid);
    if (row2.status !== 'dispatched' || row2.assigned_worker_id !== workerBLogin.user.id) throw new Error(`派单后状态异常: ${row2.status}`);

    await fulfillWorker(workerBHttp, oid);
    r = await buyerHttp.post(`/service-orders/${oid}/confirm-complete`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('用户确认失败');
    const done = await models.ServiceOrder.findByPk(oid);
    if (done.status !== 'completed') throw new Error(`应已完成: ${done.status}`);
    ok('场景B：无直约 → 待派单 → 运营指派技工B → 履约完成', { order_id: oid, worker: workerBLogin.user.id });
  } catch (e) {
    fail('场景B：派单链路', e.message);
  }

  // ----- B2 九州派单：订单小区与技工小区不一致应拒绝 -----
  try {
    let r = await buyerHttp.post('/service-orders', {
      service_id: seeded.serviceId,
      community_id: COMM_MAIN,

      address_snapshot: addr(),
      remark: `${LABEL} 场景B2跨小区派单应失败`
    });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(JSON.stringify(r.data));
    const oid = r.data.data.id;
    r = await buyerHttp.post(`/service-orders/${oid}/pay`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('支付失败');
    r = await adminHttp.post(`/admin/service-orders/${oid}/assign`, { worker_id: workerCLogin.user.id });
    const denied =
      r.status === 200 &&
      r.data &&
      typeof r.data.errno === 'number' &&
      r.data.errno !== 0 &&
      String(r.data.errmsg || '').includes('小区');
    if (!denied) throw new Error(`应拒绝跨小区派单: ${JSON.stringify(r.data)}`);
    const row = await models.ServiceOrder.findByPk(oid);
    if (row.assigned_worker_id != null) throw new Error('不应写入 assigned_worker_id');
    ok('场景B2：跨小区派单被拒绝', { order_id: oid });
  } catch (e) {
    fail('场景B2：跨小区派单校验', e.message);
  }

  // ----- C 服务商打包 -----
  if (spp && spp.id) {
    try {
      let r = await buyerHttp.post('/service-orders/bundle', {
        provider_id: providerLogin.user.id,
        items: [{ service_id: seeded.serviceId, qty: 1, group_key: 'urgent_fix' }],
        address: `${LABEL} 打包地址`,
        contact_name: '用户',
        contact_phone: '13800138001',
        remark: `${LABEL} 场景C打包`,
        community_id: COMM_MAIN
      });
      if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(JSON.stringify(r.data));
      const oid = r.data.data.id;
      r = await buyerHttp.post(`/service-orders/${oid}/pay`);
      if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('支付失败');
      const row1 = await models.ServiceOrder.findByPk(oid);
      if (row1.status !== 'pending_accept' || row1.provider_user_id !== providerLogin.user.id) {
        throw new Error(`服务商单应待接单: ${row1.status} provider=${row1.provider_user_id}`);
      }
      await fulfillProvider(providerHttp, oid);
      r = await buyerHttp.post(`/service-orders/${oid}/confirm-complete`);
      if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error('用户确认失败');
      const done = await models.ServiceOrder.findByPk(oid);
      if (done.status !== 'completed') throw new Error(`应已完成: ${done.status}`);
      ok('场景C：服务商打包 → 支付 → 服务商履约 → 用户确认', { order_id: oid, provider: providerLogin.user.id });
    } catch (e) {
      fail('场景C：服务商打包', e.message);
    }
  } else {
    fail('场景C：服务商打包', '无服务商档案，跳过');
  }

  const bad = results.filter((x) => !x.ok);
  await models.sequelize.close();
  if (childProc) {
    try {
      childProc.kill('SIGTERM');
    } catch (_) {}
  }

  if (bad.length) {
    console.error(`\n未通过 ${bad.length} 项`, bad);
    process.exit(1);
  }
  console.log('\n全链路模拟：全部通过（用户 ↔ 技工 / 运营派单 / 服务商 逻辑闭环）。');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  if (childProc) {
    try {
      childProc.kill('SIGTERM');
    } catch (_) {}
  }
  process.exit(1);
});
