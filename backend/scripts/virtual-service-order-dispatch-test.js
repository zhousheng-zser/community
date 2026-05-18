/**
 * 虚拟数据 + API 验证：首页/分组「非直约」下单 → 支付待派单 → 九州派单（同小区技工 OK / 异小区拒绝）
 *
 * 用法：cd backend && node scripts/virtual-service-order-dispatch-test.js
 * 外置 API：E2E_EXTERNAL=1 E2E_BASE_URL=http://127.0.0.1:3001/api/v1 node scripts/virtual-service-order-dispatch-test.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true, quiet: true });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const { spawn } = require('child_process');

const COMM_MAIN = parseInt(process.env.E2E_COMMUNITY_ID_MAIN || '1', 10);
const COMM_ALT = parseInt(process.env.E2E_COMMUNITY_ID_ALT || '2', 10);

let childProc = null;

function getEnv(k, d) {
  return process.env[k] != null && process.env[k] !== '' ? process.env[k] : d;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
      if (h1.status === 200 && h1.data && typeof h1.data === 'object' && h1.data.errno === 0) return;
    } catch (_) {}
    await sleep(200);
  }
  try {
    childProc.kill('SIGTERM');
  } catch (_) {}
  throw new Error('virtual-dispatch-test: API 子进程未就绪');
}

function getBase() {
  return process.env.E2E_BASE_URL || 'http://127.0.0.1:3099/api/v1';
}

async function seedService(models, label) {
  const { Category, Service, sequelize } = models;
  const t = await sequelize.transaction();
  try {
    const cat = await Category.create(
      {
        name: `${label}-类目`,
        icon_url: '/img/index/menuicon1.png',
        sort_order: 1,
        group_type: 'urgent_fix'
      },
      { transaction: t }
    );
    const svc = await Service.create(
      {
        category_id: cat.id,
        title: `${label}-虚拟服务单`,
        description: '虚拟下单/派单测试',
        price: 66,
        cover_image: 'https://example.com/v.png',
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

function addr(label) {
  return { label, detail: `${label}·地址`, contact: '虚拟用户', phone: '13800138000' };
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
  return jwt.sign({ sub: 'virtual_dispatch_admin', admin: true }, secret, { expiresIn: '1d' });
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
  if (!t) throw new Error('需要 ADMIN_PASSWORD 或环境无密码时用 JWT 兜底');
  return axios.create({
    baseURL: http.defaults.baseURL,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${t}` }
  });
}

async function approveWorker(adminHttp, applicationId) {
  const r = await adminHttp.put(`/admin/worker-applications/${applicationId}`, { status: 'approved', note: 'virtual' });
  return r.status === 200 && r.data && r.data.message === 'ok';
}

async function workerApply(workerHttp, name) {
  const r = await workerHttp.post('/worker/apply', {
    name: name || '虚拟师傅',
    phone: '13900001001',
    industry: '维修',
    education: '高中',
    city: '上海市',
    resume: 'virtual',
    id_card_url: '/uploads/id.jpg',
    work_photo_url: '/uploads/w.jpg',
    certificate_url: ['/uploads/c.jpg']
  });
  const d = r.data && (r.data.data || r.data);
  const aid = d && (d.application_id || d.id);
  return { status: r.status, applicationId: aid };
}

async function main() {
  let fails = 0;
  const pass = (msg, extra) => console.log('[OK]', msg, extra || '');
  const fail = (msg, err) => {
    fails++;
    console.error('[FAIL]', msg, err);
  };

  await maybeSpawnServer();
  const base = getBase();
  const http = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true });
  const models = require('../src/models');
  await models.sequelize.authenticate();

  const label = `VD_${Date.now()}`;
  const seeded = await seedService(models, label);
  const adminHttp = await getAdminHttp(http);

  const buyer = await login(http, `${label}_buyer`, '虚拟买家');
  const wOk = await login(http, `${label}_wok`, '同小区技工');
  const wBad = await login(http, `${label}_wbad`, '外小区技工');

  await models.User.update(
    { community_id: COMM_MAIN },
    { where: { id: [buyer.user.id, wOk.user.id, wBad.user.id] } }
  );

  const buyerHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${buyer.token}` } });
  const wOkHttp = axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${wOk.token}` } });

  const waOk = await workerApply(wOkHttp, '同小区张师傅');
  const waBad = await workerApply(
    axios.create({ baseURL: base, timeout: 25000, validateStatus: () => true, headers: { Authorization: `Bearer ${wBad.token}` } }),
    '外区李师傅'
  );
  if (!waOk.applicationId || !(await approveWorker(adminHttp, waOk.applicationId))) {
    throw new Error('审核同小区技工失败');
  }
  if (!waBad.applicationId || !(await approveWorker(adminHttp, waBad.applicationId))) {
    throw new Error('审核外小区技工失败');
  }

  const wpOk = await models.WorkerProfile.findOne({ where: { user_id: wOk.user.id } });
  const wpBad = await models.WorkerProfile.findOne({ where: { user_id: wBad.user.id } });
  if (wpOk) await wpOk.update({ community_id: COMM_MAIN });
  if (wpBad) await wpBad.update({ community_id: COMM_ALT });

  try {
    let r = await buyerHttp.post('/service-orders', {
      service_id: seeded.serviceId,
      community_id: COMM_MAIN,
      group_key: 'urgent_fix',
      address_snapshot: addr(label),
      remark: `${label} 平台派单路径`
    });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`创单失败 ${JSON.stringify(r.data)}`);
    const oid = r.data.data.id;
    const row0 = await models.ServiceOrder.findByPk(oid);
    if (!row0 || row0.fulfillment_meta.dispatch_mode !== 'admin_dispatch') {
      throw new Error(`fulfillment_meta 应含 dispatch_mode=admin_dispatch: ${JSON.stringify(row0 && row0.fulfillment_meta)}`);
    }
    if (row0.status !== 'pending_pay') throw new Error(`创单后应 pending_pay: ${row0.status}`);
    pass('创单：非直约 + dispatch_mode 标记', { id: oid });

    r = await buyerHttp.post(`/service-orders/${oid}/pay`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`mockPay ${JSON.stringify(r.data)}`);
    const row1 = await models.ServiceOrder.findByPk(oid);
    if (row1.status !== 'paid_pending_dispatch') throw new Error(`支付后应待派单: ${row1.status}`);
    pass('mockPay → paid_pending_dispatch');

    r = await adminHttp.post(`/admin/service-orders/${oid}/assign`, { worker_id: wBad.user.id });
    const denied =
      r.status === 200 &&
      r.data &&
      typeof r.data.errno === 'number' &&
      r.data.errno !== 0 &&
      String(r.data.errmsg || '').includes('小区');
    if (!denied) throw new Error(`跨小区应拒绝: ${JSON.stringify(r.data)}`);
    const row1b = await models.ServiceOrder.findByPk(oid);
    if (row1b.assigned_worker_id != null) throw new Error('跨小区失败时不得指派');
    pass('派单：异小区技工被拒绝');

    r = await adminHttp.post(`/admin/service-orders/${oid}/assign`, { worker_id: wOk.user.id });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`同小区派单失败 ${JSON.stringify(r.data)}`);
    const row2 = await models.ServiceOrder.findByPk(oid);
    if (row2.status !== 'dispatched' || row2.assigned_worker_id !== wOk.user.id) {
      throw new Error(`派单后状态异常 ${row2.status} worker=${row2.assigned_worker_id}`);
    }
    pass('派单：同小区技工成功 → dispatched');

    r = await buyerHttp.get('/service-orders/my', { params: { page: 1, limit: 20 } });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(`my ${JSON.stringify(r.data)}`);
    const list = r.data.data && r.data.data.list;
    const hit = Array.isArray(list) && list.some((x) => x.id === oid);
    if (!hit) throw new Error('我的服务订单应包含本单');
    pass('GET service-orders/my 含本订单');
  } catch (e) {
    fail('主流程', e.message || e);
  }

  try {
    let r = await buyerHttp.post('/service-orders', {
      service_id: seeded.serviceId,
      worker_id: wOk.user.id,
      community_id: COMM_MAIN,
      address_snapshot: addr(`${label}_直约`),
      remark: `${label} 直约`
    });
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(JSON.stringify(r.data));
    const oid = r.data.data.id;
    r = await buyerHttp.post(`/service-orders/${oid}/pay`);
    if (r.status !== 200 || !r.data || r.data.errno !== 0) throw new Error(JSON.stringify(r.data));
    const row = await models.ServiceOrder.findByPk(oid);
    if (row.status !== 'pending_worker_accept') throw new Error(`直约支付后应 pending_worker_accept: ${row.status}`);
    pass('直约单 mockPay 后仍为 pending_worker_accept');
  } catch (e) {
    fail('直约支付状态', e.message || e);
  }

  await models.sequelize.close();
  if (childProc) {
    try {
      childProc.kill('SIGTERM');
    } catch (_) {}
  }

  if (fails) {
    console.error(`\n未通过 ${fails} 项`);
    process.exit(1);
  }
  console.log('\n虚拟下单 + 派单 + 我的订单：全部通过');
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
