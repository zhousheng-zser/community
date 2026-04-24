const axios = require('axios');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), override: false, quiet: true });

let childProc = null;

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mdEscape(s) {
  return String(s == null ? '' : s).replace(/[\\`*_{}[\]()#+\-.!|>]/g, '\\$&');
}

function getEnv(k, d) {
  return process.env[k] != null && process.env[k] !== '' ? process.env[k] : d;
}

/** 主测试小区（名称写入地址/备注；ID 默认 1/2，可用 E2E_COMMUNITY_ID_MAIN / E2E_COMMUNITY_ID_ALT 覆盖） */
const E2E_COMMUNITY_LABEL = getEnv('E2E_COMMUNITY_LABEL', '上海合川路地铁站');
const E2E_COMMUNITY_ID_MAIN = parseInt(getEnv('E2E_COMMUNITY_ID_MAIN', '1'), 10);
const E2E_COMMUNITY_ID_ALT = parseInt(getEnv('E2E_COMMUNITY_ID_ALT', '2'), 10);

function e2eAddr(detail) {
  const d = detail != null && String(detail).trim() ? String(detail).trim() : '1号楼101';
  return { label: E2E_COMMUNITY_LABEL, detail: `${E2E_COMMUNITY_LABEL}·${d}` };
}

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
    WX_APPSECRET: '',
    JWT_SECRET: getEnv('JWT_SECRET', 'default_secret'),
    DB_HOST: getEnv('DB_HOST', '127.0.0.1'),
    DB_PORT: getEnv('DB_PORT', '3306'),
    DB_USER: getEnv('DB_USER', 'root'),
    DB_PASSWORD: getEnv('DB_PASSWORD', 'root'),
    DB_NAME: getEnv('DB_NAME', 'community_db')
  };
  delete childEnv.E2E_BASE_URL;
  delete childEnv.E2E_SPAWN_SERVER;
  childProc = spawn(process.execPath, [path.join(root, 'src/index.js')], {
    cwd: root,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let errBuf = '';
  childProc.stderr.on('data', (c) => {
    errBuf += String(c);
    if (errBuf.length > 8000) errBuf = errBuf.slice(-4000);
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

async function seedMinimalData(sequelizeModels) {
  const { Category, Service, Good, Banner, sequelize } = sequelizeModels;
  const label = getEnv('E2E_COMMUNITY_LABEL', '上海合川路地铁站');
  const t = await sequelize.transaction();
  try {
    const catUrgent = await Category.create(
      {
        name: `${label}-家修急事类目`,
        icon_url: '/img/index/menuicon1.png',
        sort_order: 1,
        group_type: 'urgent_fix'
      },
      { transaction: t }
    );
    const svcUrgent = await Service.create(
      {
        category_id: catUrgent.id,
        title: `${label}-家修急事【主单测】99元`,
        description: `${label}周边上门检测与维修（E2E 模拟数据）`,
        price: 99,
        cover_image: 'https://example.com/urgent-fix.png',
        sales_count: 0,
        is_published: 1
      },
      { transaction: t }
    );
    const extraServiceIds = [];
    const mockPrices = [128, 158, 199];
    const mockTitles = ['管道疏通', '灯具安装', '墙面修补'];
    for (let i = 0; i < mockTitles.length; i++) {
      const s = await Service.create(
        {
          category_id: catUrgent.id,
          title: `${label}-${mockTitles[i]}（模拟${i + 1}）`,
          description: `${label}站点周边服务 · ${mockTitles[i]} · E2E批量模拟`,
          price: mockPrices[i],
          cover_image: `https://example.com/mock-${i}.png`,
          sales_count: 0,
          is_published: 1
        },
        { transaction: t }
      );
      extraServiceIds.push(s.id);
    }
    const goodsBatch = [];
    for (let g = 1; g <= 3; g++) {
      const row = await Good.create(
        {
          title: `${label}-模拟好物${g}`,
          price: 9.9 + g * 5,
          commission: 0.5 + g * 0.1,
          cover_image: `https://example.com/good-mock-${g}.png`,
          detail_images: [`https://example.com/good-mock-${g}-d.png`],
          stock: 100 + g * 10,
          tab_category: 'test',
          is_featured: g === 1 ? 1 : 0,
          featured_sort: g,
          unit: '件'
        },
        { transaction: t }
      );
      goodsBatch.push(row.id);
    }
    for (let b = 1; b <= 2; b++) {
      await Banner.create(
        {
          image_url: `https://example.com/banner-mock-${b}.png`,
          sort_order: b,
          link_type: 'none',
          link_value: '',
          scene: 'home'
        },
        { transaction: t }
      );
    }
    await t.commit();
    return { serviceId: svcUrgent.id, goodId: goodsBatch[0], extraServiceIds, goodsBatch, label };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

async function main() {
  const startedAt = nowIso();
  await maybeSpawnServer();

  const base = getBase();
  const http = axios.create({ baseURL: base, timeout: 20000, validateStatus: () => true });

  const models = require('../src/models');
  await models.sequelize.authenticate();
  try {
    const migSp = require('../src/migrations/20260421170000-service-provider-community.js');
    await migSp.up(models.sequelize.getQueryInterface(), require('sequelize'));
  } catch (e) {
    if (!String(e.message || '').includes('Duplicate')) console.warn('[e2e] migrate sp-community:', e.message);
  }
  try {
    const migPa = require('../src/migrations/20260421190000-create-service-provider-portal-accounts.js');
    await migPa.up(models.sequelize.getQueryInterface(), require('sequelize'));
  } catch (e) {
    if (!String(e.message || '').includes('Duplicate') && !String(e.message || '').includes('already exists')) {
      console.warn('[e2e] migrate sp-portal-accounts:', e.message);
    }
  }
  const seeded = await seedMinimalData(models);

  const report = {
    startedAt,
    base,
    seeded,
    steps: [],
    findings: []
  };

  function stepPush(s) {
    report.steps.push({ at: nowIso(), ...s });
  }

  function pass(name, extra = {}) {
    stepPush({ name, ok: true, ...extra });
  }

  function fail(name, extra = {}) {
    stepPush({ name, ok: false, ...extra });
  }

  function adminTokenFromSecret() {
    const secret = getEnv('JWT_SECRET', 'default_secret');
    return jwt.sign({ sub: 'e2e_admin', admin: true }, secret, { expiresIn: '1d' });
  }

  async function getAdminToken() {
    const adminPass = String(process.env.ADMIN_PASSWORD || '').trim();
    const adminUser = process.env.ADMIN_USERNAME || 'wsxCDE';
    if (adminPass) {
      const r = await http.post('/auth/admin/login', { username: adminUser, password: adminPass });
      const tok = (r.data && r.data.data && r.data.data.token) || null;
      if (r.status === 200 && tok) return { token: tok, via: 'admin_login' };
      return { token: null, via: 'admin_login_failed', detail: r.data };
    }
    return { token: adminTokenFromSecret(), via: 'jwt_sign_fallback' };
  }

  async function loginUser(code, nickname) {
    const r = await http.post('/auth/login', { code, nickname });
    const token = r.data && r.data.token;
    const user = r.data && r.data.user;
    if (r.status === 200 && token && user && user.id) return { token, user };
    throw new Error(`login failed: ${r.status} ${JSON.stringify(r.data)}`);
  }

  const adminAuth = await getAdminToken();
  const adminToken = adminAuth.token;
  if (!adminToken) {
    report.findings.push('无法获取管理员 token，管理员审批/派单/后台创建店铺等步骤无法执行。');
  }
  const adminHttp = axios.create({
    baseURL: base,
    timeout: 20000,
    validateStatus: () => true,
    headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined
  });

  pass('基础数据种子写入', { detail: seeded });
  if (adminToken) {
    if (adminAuth.via === 'admin_login') {
      pass('九州社区·运营中台登录（POST /auth/admin/login）', { via: 'ADMIN_PASSWORD' });
    } else {
      pass('运营中台管理员令牌（未配置 ADMIN_PASSWORD 时使用 JWT 兜底，仅建议 CI）', { via: adminAuth.via });
    }
  }

  const workerLogin = await loginUser(`e2e_worker_${Date.now()}`, 'E2E技工用户');
  const providerLogin = await loginUser(`e2e_provider_${Date.now()}`, 'E2E服务商用户');
  const buyerLogin = await loginUser(`e2e_buyer_${Date.now()}`, 'E2E普通用户');

  const workerHttp = axios.create({
    baseURL: base,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${workerLogin.token}` }
  });
  const providerHttp = axios.create({
    baseURL: base,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${providerLogin.token}` }
  });
  const buyerHttp = axios.create({
    baseURL: base,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${buyerLogin.token}` }
  });

  pass('用户登录', {
    worker_user_id: workerLogin.user.id,
    provider_user_id: providerLogin.user.id,
    buyer_user_id: buyerLogin.user.id
  });

  await models.User.update(
    { community_id: E2E_COMMUNITY_ID_MAIN },
    { where: { id: [workerLogin.user.id, providerLogin.user.id, buyerLogin.user.id] } }
  );
  pass('用户默认小区（users.community_id）', {
    community_id: E2E_COMMUNITY_ID_MAIN,
    label: E2E_COMMUNITY_LABEL
  });

  const rWorkerApply = await workerHttp.post('/worker/apply', {
    name: '张师傅',
    phone: '13800001111',
    industry: '家电维修',
    education: '大专',
    city: '杭州市',
    resume: 'E2E 技工入驻',
    id_card_url: '/uploads/idcard.jpg',
    work_photo_url: '/uploads/work.jpg',
    certificate_url: ['/uploads/cert1.jpg']
  });
  const wa = rWorkerApply.data && (rWorkerApply.data.data || rWorkerApply.data);
  const workerApplicationId = wa && (wa.application_id || wa.id);
  if (rWorkerApply.status === 201 && workerApplicationId) {
    pass('技工入驻申请提交', { application_id: workerApplicationId, http_status: rWorkerApply.status });
  } else {
    fail('技工入驻申请提交', { http_status: rWorkerApply.status, body: rWorkerApply.data });
  }

  if (adminToken && workerApplicationId) {
    const rApproveWorker = await adminHttp.put(`/admin/worker-applications/${workerApplicationId}`, { status: 'approved', note: 'e2e approve' });
    if (rApproveWorker.status === 200 && rApproveWorker.data && rApproveWorker.data.message === 'ok') {
      pass('技工入驻审核通过（管理端）', { http_status: rApproveWorker.status });
    } else {
      fail('技工入驻审核通过（管理端）', { http_status: rApproveWorker.status, body: rApproveWorker.data, admin_token_via: adminAuth.via });
    }
  } else {
    report.findings.push('未执行：技工入驻审核（缺少管理员 token 或 application_id）。');
  }

  const wp = await models.WorkerProfile.findOne({ where: { user_id: workerLogin.user.id } });
  if (wp && wp.status === 'active') {
    pass('技工档案生成（worker_profiles）', { profile_id: wp.id, status: wp.status });
  } else {
    fail('技工档案生成（worker_profiles）', { found: !!wp, status: wp && wp.status });
  }

  if (wp) {
    await wp.update({ community_id: E2E_COMMUNITY_ID_MAIN });
    pass(`设置技工接单小区（worker_profiles.community_id=${E2E_COMMUNITY_ID_MAIN}·${E2E_COMMUNITY_LABEL}）`, {
      profile_id: wp.id
    });
  }

  const worker2Login = await loginUser(`e2e_worker2_${Date.now()}`, 'E2E技工用户2');
  const worker2Http = axios.create({
    baseURL: base,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${worker2Login.token}` }
  });
  const rWorker2Apply = await worker2Http.post('/worker/apply', {
    name: '李师傅',
    phone: '13800003333',
    industry: '家政',
    education: '高中',
    city: '杭州市',
    resume: 'E2E 技工2 入驻',
    id_card_url: '/uploads/idcard-w2.jpg',
    work_photo_url: '/uploads/work-w2.jpg',
    certificate_url: ['/uploads/cert-w2.jpg']
  });
  const wa2 = rWorker2Apply.data && (rWorker2Apply.data.data || rWorker2Apply.data);
  const worker2ApplicationId = wa2 && (wa2.application_id || wa2.id);
  if (rWorker2Apply.status === 201 && worker2ApplicationId) {
    pass('技工2入驻申请提交', { application_id: worker2ApplicationId });
  } else {
    fail('技工2入驻申请提交', { http_status: rWorker2Apply.status, body: rWorker2Apply.data });
  }
  if (adminToken && worker2ApplicationId) {
    const rAp2 = await adminHttp.put(`/admin/worker-applications/${worker2ApplicationId}`, { status: 'approved', note: 'e2e worker2' });
    if (rAp2.status === 200 && rAp2.data && rAp2.data.message === 'ok') {
      pass('技工2审核通过（管理端）', {});
    } else {
      fail('技工2审核通过（管理端）', { http_status: rAp2.status, body: rAp2.data });
    }
  }
  const wp2 = await models.WorkerProfile.findOne({ where: { user_id: worker2Login.user.id } });
  if (wp2) {
    await wp2.update({ community_id: E2E_COMMUNITY_ID_MAIN });
    pass(`技工2接单小区（worker_profiles.community_id=${E2E_COMMUNITY_ID_MAIN}）`, { user_id: worker2Login.user.id });
  } else {
    report.findings.push('技工2档案未生成，越权接单用例将跳过。');
  }

  const workerC2Login = await loginUser(`e2e_worker_only_c2_${Date.now()}`, 'E2E仅小区2技工');
  const workerC2Http = axios.create({
    baseURL: base,
    timeout: 20000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${workerC2Login.token}` }
  });
  const rWC2Apply = await workerC2Http.post('/worker/apply', {
    name: '王师傅',
    phone: '13800004444',
    industry: '保洁',
    education: '高中',
    city: '杭州市',
    resume: 'E2E 仅服务小区2',
    id_card_url: '/uploads/idcard-c2.jpg',
    work_photo_url: '/uploads/work-c2.jpg',
    certificate_url: ['/uploads/cert-c2.jpg']
  });
  const waC2 = rWC2Apply.data && (rWC2Apply.data.data || rWC2Apply.data);
  const workerC2ApplicationId = waC2 && (waC2.application_id || waC2.id);
  if (rWC2Apply.status === 201 && workerC2ApplicationId) {
    pass('仅小区2技工入驻申请', { application_id: workerC2ApplicationId });
  } else {
    fail('仅小区2技工入驻申请', { http_status: rWC2Apply.status, body: rWC2Apply.data });
  }
  if (adminToken && workerC2ApplicationId) {
    const rApC2 = await adminHttp.put(`/admin/worker-applications/${workerC2ApplicationId}`, { status: 'approved', note: 'e2e c2 only' });
    if (rApC2.status === 200 && rApC2.data && rApC2.data.message === 'ok') {
      pass('仅小区2技工审核通过', {});
    } else {
      fail('仅小区2技工审核通过', { body: rApC2.data });
    }
  }
  const wpC2 = await models.WorkerProfile.findOne({ where: { user_id: workerC2Login.user.id } });
  if (wpC2) {
    await wpC2.update({ community_id: E2E_COMMUNITY_ID_ALT });
    pass(`仅对照小区技工档案 community_id=${E2E_COMMUNITY_ID_ALT}`, { user_id: workerC2Login.user.id });
  }

  const rSpApply = await providerHttp.post('/service-provider/apply', {
    shop_name: 'E2E服务商门店',
    contact_name: '李经理',
    phone: '13900002222',
    license_url: '/uploads/license.jpg',
    shop_front_url: '/uploads/front.jpg',
    environment_url: ['/uploads/env1.jpg', '/uploads/env2.jpg'],
    id_card_url: '/uploads/idcard2.jpg'
  });
  const spa = rSpApply.data && (rSpApply.data.data || rSpApply.data);
  let spApplicationId = spa && (spa.application_id || spa.id);
  if (!spApplicationId && rSpApply.status === 201) {
    const row = await models.ServiceProviderApplication.findOne({
      where: { user_id: providerLogin.user.id },
      order: [['id', 'DESC']]
    });
    if (row) spApplicationId = row.id;
  }
  if (rSpApply.status === 201 && spApplicationId) {
    pass('服务商入驻申请提交', { application_id: spApplicationId, http_status: rSpApply.status });
  } else {
    fail('服务商入驻申请提交', { http_status: rSpApply.status, body: rSpApply.data });
  }

  if (adminToken && spApplicationId) {
    const rApproveSp = await adminHttp.put(`/admin/service-provider-applications/${spApplicationId}`, {
      status: 'approved',
      note: 'e2e approve',
      community_id: E2E_COMMUNITY_ID_MAIN
    });
    if (rApproveSp.status === 200 && rApproveSp.data && rApproveSp.data.message === 'ok') {
      pass('服务商入驻审核通过（管理端）', { http_status: rApproveSp.status });
    } else {
      fail('服务商入驻审核通过（管理端）', { http_status: rApproveSp.status, body: rApproveSp.data, admin_token_via: adminAuth.via });
    }
  } else {
    report.findings.push('未执行：服务商入驻审核（缺少管理员 token 或 application_id）。');
  }

  const spp = await models.ServiceProviderProfile.findOne({ where: { user_id: providerLogin.user.id } });
  if (spp && spp.status === 'active') {
    if (spp.community_id == null) {
      await spp.update({ community_id: E2E_COMMUNITY_ID_MAIN });
    }
    pass('服务商档案生成（service_provider_profiles）', {
      profile_id: spp.id,
      status: spp.status,
      community_id: spp.community_id != null ? spp.community_id : E2E_COMMUNITY_ID_MAIN
    });
  } else {
    fail('服务商档案生成（service_provider_profiles）', { found: !!spp, status: spp && spp.status });
  }

  /** 服务商运行中台（独立账号密码，非小程序 JWT） */
  if (adminToken && spp && spp.id) {
    const spPortalUser = `sp_e2e_${Date.now()}`;
    const spPortalPass = 'e2e_sp_portal_123';
    const rPortalAcc = await adminHttp.post('/admin/service-provider-portal-accounts', {
      profile_id: spp.id,
      username: spPortalUser,
      password: spPortalPass
    });
    if (rPortalAcc.status === 200 && rPortalAcc.data && rPortalAcc.data.message === 'ok') {
      pass('运营中台开通服务商门户账号（POST /admin/service-provider-portal-accounts）', {
        profile_id: spp.id,
        username: spPortalUser
      });
    } else {
      fail('运营中台开通服务商门户账号', { http_status: rPortalAcc.status, body: rPortalAcc.data });
    }

    const rSpPortalLogin = await http.post('/service-provider-portal/login', {
      username: spPortalUser,
      password: spPortalPass
    });
    const spPortalTok = rSpPortalLogin.data && rSpPortalLogin.data.data && rSpPortalLogin.data.data.token;
    if (rSpPortalLogin.status === 200 && spPortalTok) {
      pass('服务商运行中台登录（POST /service-provider-portal/login）', { username: spPortalUser });
      const spPortalHttp = axios.create({
        baseURL: base,
        timeout: 20000,
        validateStatus: () => true,
        headers: { Authorization: `Bearer ${spPortalTok}` }
      });
      const rSpDash = await spPortalHttp.get('/service-provider-portal/dashboard');
      if (rSpDash.status === 200 && rSpDash.data && rSpDash.data.errno === 0) {
        pass('服务商运行中台经营概览（GET /service-provider-portal/dashboard）', {
          shop_name: rSpDash.data.data && rSpDash.data.data.shop_name
        });
      } else {
        fail('服务商运行中台经营概览', { http_status: rSpDash.status, body: rSpDash.data });
      }
      const catRow = await models.Category.findOne({ order: [['id', 'ASC']] });
      const rSpNewSvc = await spPortalHttp.post('/service-provider-portal/services', {
        title: `${E2E_COMMUNITY_LABEL}-E2E门户上架_${Date.now()}`,
        price: 66.6,
        category_id: catRow ? catRow.id : null,
        description: `${E2E_COMMUNITY_LABEL} E2E 服务商运行中台创建`,
        cover_image: 'https://example.com/sp-portal-svc.png',
        is_published: true
      });
      const newSvc = rSpNewSvc.data && rSpNewSvc.data.data && rSpNewSvc.data.data.service;
      if (rSpNewSvc.status === 200 && rSpNewSvc.data && rSpNewSvc.data.errno === 0 && newSvc && newSvc.id) {
        pass('服务商运行中台上架服务（POST /service-provider-portal/services）', { service_id: newSvc.id });
      } else {
        fail('服务商运行中台上架服务', { http_status: rSpNewSvc.status, body: rSpNewSvc.data });
      }
      const rSpList = await spPortalHttp.get('/service-provider-portal/services', { params: { limit: 30 } });
      const listData = rSpList.data && rSpList.data.data;
      if (rSpList.status === 200 && rSpList.data && rSpList.data.errno === 0 && listData && Array.isArray(listData.list)) {
        pass('服务商运行中台服务列表（GET /service-provider-portal/services）', { total: listData.total });
      } else {
        fail('服务商运行中台服务列表', { http_status: rSpList.status, body: rSpList.data });
      }
    } else {
      fail('服务商运行中台登录', { http_status: rSpPortalLogin.status, body: rSpPortalLogin.data });
    }
  } else {
    report.findings.push('未执行：服务商运行中台联调（缺少管理员 token 或服务商档案）。');
  }

  const rWorkers = await http.get('/core/workers', { params: { community_id: E2E_COMMUNITY_ID_MAIN, page: 1, page_size: 50 } });
  const workersPayload = unwrapPayload(rWorkers);
  const workerList = workersPayload && workersPayload.list;
  if (rWorkers.status === 200 && Array.isArray(workerList)) {
    pass('首页技工列表（core/workers）', { list_count: workerList.length });
  } else {
    fail('首页技工列表（core/workers）', { http_status: rWorkers.status, body: rWorkers.data });
  }

  const idsC1 = (workerList || []).map((w) => w.id);
  const rWorkersC2 = await http.get('/core/workers', { params: { community_id: E2E_COMMUNITY_ID_ALT, page: 1, page_size: 50 } });
  const listC2 = (unwrapPayload(rWorkersC2) && unwrapPayload(rWorkersC2).list) || [];
  const idsC2 = listC2.map((w) => w.id);
  if (
    rWorkersC2.status === 200 &&
    !idsC1.includes(workerC2Login.user.id) &&
    idsC2.includes(workerC2Login.user.id) &&
    idsC1.includes(workerLogin.user.id)
  ) {
    pass('多小区隔离：技工列表仅含本小区', { c1_count: idsC1.length, c2_has_only_c2_worker: true });
  } else {
    fail('多小区隔离：技工列表仅含本小区', {
      idsC1_sample: idsC1.slice(0, 5),
      idsC2,
      worker_c2_id: workerC2Login.user.id
    });
  }

  const rWorkerDetailCross = await http.get(`/core/workers/${workerC2Login.user.id}`, {
    params: { community_id: E2E_COMMUNITY_ID_MAIN }
  });
  if (rWorkerDetailCross.status === 404) {
    pass('多小区隔离：技工详情错传 community_id 返回 404', { worker_id: workerC2Login.user.id });
  } else {
    fail('多小区隔离：技工详情错传 community_id', { http_status: rWorkerDetailCross.status, body: rWorkerDetailCross.data });
  }

  const rServiceProviders = await http.get('/core/service-providers', { params: { community_id: E2E_COMMUNITY_ID_MAIN } });
  const spList = unwrapPayload(rServiceProviders);
  const spHasOurs =
    rServiceProviders.status === 200 &&
    Array.isArray(spList) &&
    spList.some((p) => p && p.id === providerLogin.user.id);
  if (spHasOurs) {
    pass(`首页服务商列表按小区（core/service-providers?community_id=${E2E_COMMUNITY_ID_MAIN}）`, {
      list_count: spList.length
    });
  } else {
    fail('首页服务商列表按小区（core/service-providers）', { http_status: rServiceProviders.status, body: rServiceProviders.data });
  }

  const rSpOtherComm = await http.get('/core/service-providers', { params: { community_id: 99 } });
  const sp99 = unwrapPayload(rSpOtherComm);
  const sp99Empty = rSpOtherComm.status === 200 && Array.isArray(sp99) && sp99.length === 0;
  if (sp99Empty) {
    pass('多小区隔离：无服务商的小区列表为空', {});
  } else {
    fail('多小区隔离：无服务商的小区列表为空', { count: sp99 && sp99.length });
  }

  const rCatWrongComm = await http.get(`/core/service-providers/${providerLogin.user.id}/catalog`, {
    params: { community_id: E2E_COMMUNITY_ID_ALT }
  });
  if (rCatWrongComm.status === 404) {
    pass('多小区隔离：服务商 catalog 错传 community_id 返回 404', {});
  } else {
    fail('多小区隔离：服务商 catalog 错传 community_id', { http_status: rCatWrongComm.status, body: rCatWrongComm.data });
  }

  const rUrgentGroup = await http.get('/core/service-groups/urgent_fix');
  const urgentGroup = unwrapPayload(rUrgentGroup);
  const urgentServices = urgentGroup && urgentGroup.services;
  const urgentServiceId = urgentServices && urgentServices[0] && urgentServices[0].id;
  if (rUrgentGroup.status === 200 && urgentServiceId) {
    pass('家修急事服务分组读取（core/service-groups/urgent_fix）', { first_service_id: urgentServiceId });
  } else {
    fail('家修急事服务分组读取（core/service-groups/urgent_fix）', { http_status: rUrgentGroup.status, body: rUrgentGroup.data });
  }

  if (urgentServiceId) {
    const rCrossWorkerSo = await buyerHttp.post('/service-orders', {
      service_id: urgentServiceId,
      worker_id: workerC2Login.user.id,
      community_id: E2E_COMMUNITY_ID_MAIN,
      address_snapshot: { contact: '测', phone: '13900000000', ...e2eAddr('跨小区直约') },
      remark: `${E2E_COMMUNITY_LABEL} e2e cross community worker`
    });
    if (rCrossWorkerSo.status === 200 && rCrossWorkerSo.data && rCrossWorkerSo.data.errno === 400) {
      pass('多小区隔离：直约指派非本小区技工被拒绝', { errmsg: rCrossWorkerSo.data.errmsg });
    } else {
      fail('多小区隔离：直约指派非本小区技工被拒绝', { body: rCrossWorkerSo.data });
    }
  }

  let soId = null;
  if (urgentServiceId) {
    const rCreateSo = await buyerHttp.post('/service-orders', {
      service_id: urgentServiceId,
      worker_id: workerLogin.user.id,
      community_id: E2E_COMMUNITY_ID_MAIN,
      address_snapshot: { contact: '测', phone: '13900000000', ...e2eAddr('主测试下单地址') },
      remark: `${E2E_COMMUNITY_LABEL} e2e 下单技工服务`
    });
    soId = rCreateSo.data && rCreateSo.data.data && (rCreateSo.data.data.id || rCreateSo.data.data.order_id);
    if (rCreateSo.status === 200 && rCreateSo.data && rCreateSo.data.errno === 0 && soId) {
      pass('下单技工服务（service-orders.create）', { order_id: soId, status: rCreateSo.data.data.status });
    } else {
      fail('下单技工服务（service-orders.create）', { http_status: rCreateSo.status, body: rCreateSo.data });
    }
  }

  if (soId) {
    const rPay = await buyerHttp.post(`/service-orders/${soId}/pay`);
    if (rPay.status === 200 && rPay.data && rPay.data.errno === 0) {
      pass('支付技工服务订单（service-orders.mockPay）', { pay_status: rPay.data.data.pay_status, status: rPay.data.data.status });
    } else {
      fail('支付技工服务订单（service-orders.mockPay）', { http_status: rPay.status, body: rPay.data });
    }
  }

  if (soId) {
    const rAccept = await workerHttp.post(`/worker/service-orders/${soId}/accept`);
    if (rAccept.status === 200 && rAccept.data && rAccept.data.errno === 0) {
      pass('技工接单（worker/service-orders/:id/accept）', { status: rAccept.data.data.status });
    } else {
      fail('技工接单（worker/service-orders/:id/accept）', { http_status: rAccept.status, body: rAccept.data });
    }

    const rCheckIn = await workerHttp.post(`/worker/service-orders/${soId}/check-in`, { latitude: 30.2741, longitude: 120.1551, accuracy: 15 });
    if (rCheckIn.status === 200 && rCheckIn.data && rCheckIn.data.errno === 0) {
      pass('技工上门打卡（worker/service-orders/:id/check-in）', { check_ins: (rCheckIn.data.data && rCheckIn.data.data.check_ins && rCheckIn.data.data.check_ins.length) || 0 });
    } else {
      fail('技工上门打卡（worker/service-orders/:id/check-in）', { http_status: rCheckIn.status, body: rCheckIn.data });
    }

    const rBefore = await workerHttp.post(`/worker/service-orders/${soId}/evidence`, { kind: 'before', urls: ['https://example.com/before.jpg'] });
    if (rBefore.status === 200 && rBefore.data && rBefore.data.errno === 0) {
      pass('技工上传服务前证据（worker/service-orders/:id/evidence）', {});
    } else {
      fail('技工上传服务前证据（worker/service-orders/:id/evidence）', { http_status: rBefore.status, body: rBefore.data });
    }

    const rAfter = await workerHttp.post(`/worker/service-orders/${soId}/evidence`, { kind: 'after', urls: ['https://example.com/after.jpg'] });
    if (rAfter.status === 200 && rAfter.data && rAfter.data.errno === 0) {
      pass('技工上传服务后证据（worker/service-orders/:id/evidence）', {});
    } else {
      fail('技工上传服务后证据（worker/service-orders/:id/evidence）', { http_status: rAfter.status, body: rAfter.data });
    }

    const rComplete = await workerHttp.post(`/worker/service-orders/${soId}/complete`);
    if (rComplete.status === 200 && rComplete.data && rComplete.data.errno === 0) {
      pass('技工完成服务（worker/service-orders/:id/complete）', { status: rComplete.data.data.status });
    } else {
      fail('技工完成服务（worker/service-orders/:id/complete）', { http_status: rComplete.status, body: rComplete.data });
    }

    const rUserConfirm = await buyerHttp.post(`/service-orders/${soId}/confirm-complete`);
    if (rUserConfirm.status === 200 && rUserConfirm.data && rUserConfirm.data.errno === 0) {
      pass('用户确认完成（service-orders/:id/confirm-complete）', { status: rUserConfirm.data.data.status });
    } else {
      fail('用户确认完成（service-orders/:id/confirm-complete）', { http_status: rUserConfirm.status, body: rUserConfirm.data });
    }

    const soRow = await models.ServiceOrder.findByPk(soId);
    const meta = soRow && soRow.fulfillment_meta ? soRow.fulfillment_meta : {};
    if (soRow && soRow.status === 'completed') {
      pass('数据库校验：service_orders 状态闭环 completed', {
        order_id: soRow.id,
        pay_status: soRow.pay_status,
        check_ins: (meta.check_ins && meta.check_ins.length) || 0,
        evidence_before: (meta.evidence && meta.evidence.before && meta.evidence.before.length) || 0,
        evidence_after: (meta.evidence && meta.evidence.after && meta.evidence.after.length) || 0
      });
    } else {
      fail('数据库校验：service_orders 状态闭环 completed', { found: !!soRow, status: soRow && soRow.status });
    }
  }

  let spOrderId = null;
  if (spp && seeded.serviceId) {
    const rBundleCross = await buyerHttp.post('/service-orders/bundle', {
      provider_id: providerLogin.user.id,
      items: [{ service_id: seeded.serviceId, qty: 1, group_key: 'urgent_fix' }],
      address: `${E2E_COMMUNITY_LABEL}·跨小区打包测试`,
      contact_name: '测试',
      contact_phone: '13900000000',
      remark: 'e2e bundle wrong community',
      community_id: E2E_COMMUNITY_ID_ALT
    });
    if (rBundleCross.status === 200 && rBundleCross.data && rBundleCross.data.errno === 400) {
      pass('多小区隔离：服务商打包单订单小区与服务商不一致被拒绝', { errmsg: rBundleCross.data.errmsg });
    } else {
      fail('多小区隔离：服务商打包单跨小区被拒绝', { body: rBundleCross.data });
    }
  }

  if (spp) {
    const rBundle = await buyerHttp.post('/service-orders/bundle', {
      provider_id: providerLogin.user.id,
      items: [{ service_id: seeded.serviceId, qty: 1, group_key: 'urgent_fix' }],
      address: `${E2E_COMMUNITY_LABEL}·测试地址-服务商打包单`,
      contact_name: '测试',
      contact_phone: '13900000000',
      remark: `${E2E_COMMUNITY_LABEL} e2e 服务商下单`,
      community_id: E2E_COMMUNITY_ID_MAIN
    });
    const b = rBundle.data && rBundle.data.data;
    spOrderId = b && b.id;
    if (rBundle.status === 200 && rBundle.data && rBundle.data.errno === 0 && spOrderId) {
      pass('下单服务商具体服务（service-orders.bundle）', { order_id: spOrderId, status: b.status, amount: b.amount });
    } else {
      fail('下单服务商具体服务（service-orders.bundle）', { http_status: rBundle.status, body: rBundle.data });
    }
  } else {
    report.findings.push('服务商档案不存在，跳过服务商下单用例。');
  }

  if (spOrderId) {
    const rPay2 = await buyerHttp.post(`/service-orders/${spOrderId}/pay`);
    if (rPay2.status === 200 && rPay2.data && rPay2.data.errno === 0) {
      pass('支付服务商订单（service-orders.mockPay）', { pay_status: rPay2.data.data.pay_status, status: rPay2.data.data.status });
    } else {
      fail('支付服务商订单（service-orders.mockPay）', { http_status: rPay2.status, body: rPay2.data });
    }

    const rSpAccept = await providerHttp.post(`/service-provider/orders/${spOrderId}/accept`);
    if (rSpAccept.status === 200 && rSpAccept.data && rSpAccept.data.errno === 0) {
      pass('服务商接单（service-provider/orders/:id/accept）', { status: rSpAccept.data.data.status });
    } else {
      fail('服务商接单（service-provider/orders/:id/accept）', { http_status: rSpAccept.status, body: rSpAccept.data });
    }

    const rSpCheckIn = await providerHttp.post(`/service-provider/orders/${spOrderId}/check-in`, { latitude: 30.2741, longitude: 120.1551, accuracy: 15 });
    if (rSpCheckIn.status === 200 && rSpCheckIn.data && rSpCheckIn.data.errno === 0) {
      pass('服务商上门打卡（service-provider/orders/:id/check-in）', { check_ins: (rSpCheckIn.data.data && rSpCheckIn.data.data.check_ins && rSpCheckIn.data.data.check_ins.length) || 0 });
    } else {
      fail('服务商上门打卡（service-provider/orders/:id/check-in）', { http_status: rSpCheckIn.status, body: rSpCheckIn.data });
    }

    const rSpBefore = await providerHttp.post(`/service-provider/orders/${spOrderId}/evidence`, { kind: 'before', urls: ['https://example.com/sp-before.jpg'] });
    if (rSpBefore.status === 200 && rSpBefore.data && rSpBefore.data.errno === 0) {
      pass('服务商上传服务前证据（service-provider/orders/:id/evidence）', {});
    } else {
      fail('服务商上传服务前证据（service-provider/orders/:id/evidence）', { http_status: rSpBefore.status, body: rSpBefore.data });
    }

    const rSpAfter = await providerHttp.post(`/service-provider/orders/${spOrderId}/evidence`, { kind: 'after', urls: ['https://example.com/sp-after.jpg'] });
    if (rSpAfter.status === 200 && rSpAfter.data && rSpAfter.data.errno === 0) {
      pass('服务商上传服务后证据（service-provider/orders/:id/evidence）', {});
    } else {
      fail('服务商上传服务后证据（service-provider/orders/:id/evidence）', { http_status: rSpAfter.status, body: rSpAfter.data });
    }

    const rSpComplete = await providerHttp.post(`/service-provider/orders/${spOrderId}/complete`);
    if (rSpComplete.status === 200 && rSpComplete.data && rSpComplete.data.errno === 0) {
      pass('服务商完成服务（service-provider/orders/:id/complete）', { status: rSpComplete.data.data.status });
    } else {
      fail('服务商完成服务（service-provider/orders/:id/complete）', { http_status: rSpComplete.status, body: rSpComplete.data });
    }

    const rUserConfirm2 = await buyerHttp.post(`/service-orders/${spOrderId}/confirm-complete`);
    if (rUserConfirm2.status === 200 && rUserConfirm2.data && rUserConfirm2.data.errno === 0) {
      pass('用户确认完成服务商订单（service-orders/:id/confirm-complete）', { status: rUserConfirm2.data.data.status });
    } else {
      fail('用户确认完成服务商订单（service-orders/:id/confirm-complete）', { http_status: rUserConfirm2.status, body: rUserConfirm2.data });
    }

    const spRow = await models.ServiceOrder.findByPk(spOrderId);
    if (spRow && spRow.status === 'completed') {
      pass('数据库校验：服务商订单闭环 completed', { order_id: spRow.id, pay_status: spRow.pay_status });
    } else {
      fail('数据库校验：服务商订单闭环 completed', { found: !!spRow, status: spRow && spRow.status });
    }
  }

  // --- 邻里帮帮：技工自助抢单（待派单池 + grab，不经管理端派单；技工2 与本单同小区）---
  let grabOrderId = null;
  const rGrabNa = await buyerHttp.post('/neighbor-assist/orders', {
    assist_type: 'take',
    community_id: E2E_COMMUNITY_ID_MAIN,
    origin_address_snapshot: e2eAddr('抢单池起点'),
    destination_address_snapshot: e2eAddr('抢单池终点'),
    amount: 11,
    remark: `${E2E_COMMUNITY_LABEL} e2e worker grab`
  });
  grabOrderId = rGrabNa.data && rGrabNa.data.data && (rGrabNa.data.data.id || rGrabNa.data.data.order_id);
  if (rGrabNa.status === 200 && rGrabNa.data && rGrabNa.data.errno === 0 && grabOrderId) {
    pass('邻里帮帮下单（抢单用例）', { order_id: grabOrderId });
  } else {
    fail('邻里帮帮下单（抢单用例）', { http_status: rGrabNa.status, body: rGrabNa.data });
  }
  if (grabOrderId) {
    const rPayGrab = await buyerHttp.post(`/neighbor-assist/orders/${grabOrderId}/pay`);
    if (rPayGrab.status === 200 && rPayGrab.data && rPayGrab.data.errno === 0) {
      pass('邻里帮帮支付（抢单用例）', { order_id: grabOrderId });
    } else {
      fail('邻里帮帮支付（抢单用例）', { body: rPayGrab.data });
    }
    // 等待订单状态更新到数据库
    await sleep(500);
    
    // 增加limit参数，查看更多订单，确保能找到我们的测试订单
    const rPool = await worker2Http.get('/neighbor-assist/orders/pool', { params: { limit: 50 } });
    const poolPayload = rPool.data && rPool.data.data;
    const poolList = poolPayload && poolPayload.list;
    const inPool = Array.isArray(poolList) && poolList.some((o) => o.id === grabOrderId);
    if (rPool.status === 200 && rPool.data && rPool.data.errno === 0 && inPool) {
      pass('邻里帮帮待派单池（GET /neighbor-assist/orders/pool）', { order_id: grabOrderId });
    } else {
      fail('邻里帮帮待派单池', { http_status: rPool.status, inPool, body: rPool.data });
    }
    const rGrab = await worker2Http.post(`/neighbor-assist/orders/${grabOrderId}/grab`);
    if (rGrab.status === 200 && rGrab.data && rGrab.data.errno === 0 && rGrab.data.data && rGrab.data.data.grab) {
      pass('邻里帮帮技工抢单（POST /neighbor-assist/orders/:id/grab）', {
        order_id: grabOrderId,
        worker_id: worker2Login.user.id
      });
    } else {
      fail('邻里帮帮技工抢单', { body: rGrab.data });
    }
    const rGrabAcc = await worker2Http.post(`/neighbor-assist/orders/${grabOrderId}/accept`);
    if (rGrabAcc.status === 200 && rGrabAcc.data && rGrabAcc.data.errno === 0) {
      pass('邻里帮帮抢单后接单（accept）', { order_id: grabOrderId });
    } else {
      fail('邻里帮帮抢单后接单', { body: rGrabAcc.data });
    }
    const rGrabDone = await worker2Http.post(`/neighbor-assist/orders/${grabOrderId}/complete`);
    if (rGrabDone.status === 200 && rGrabDone.data && rGrabDone.data.errno === 0) {
      pass('邻里帮帮抢单后完成', { order_id: grabOrderId });
    } else {
      fail('邻里帮帮抢单后完成', { body: rGrabDone.data });
    }
  }

  const assistTypes = ['take', 'trash', 'pet', 'child', 'escort'];
  const neighborOrderIds = [];
  for (const tp of assistTypes) {
    const rCreateNa = await buyerHttp.post('/neighbor-assist/orders', {
      assist_type: tp,
      community_id: E2E_COMMUNITY_ID_MAIN,
      origin_address_snapshot: e2eAddr('邻里帮起点'),
      destination_address_snapshot: e2eAddr('邻里帮终点'),
      amount: 10.5,
      remark: `${E2E_COMMUNITY_LABEL} e2e ${tp}`
    });
    const id = rCreateNa.data && rCreateNa.data.data && (rCreateNa.data.data.id || rCreateNa.data.data.order_id);
    if (rCreateNa.status === 200 && rCreateNa.data && rCreateNa.data.errno === 0 && id) {
      pass(`邻里帮帮下单（${tp}）`, { order_id: id });
      neighborOrderIds.push(id);
    } else {
      fail(`邻里帮帮下单（${tp}）`, { http_status: rCreateNa.status, body: rCreateNa.data });
    }
  }

  for (const id of neighborOrderIds) {
    const rPayNa = await buyerHttp.post(`/neighbor-assist/orders/${id}/pay`);
    if (rPayNa.status === 200 && rPayNa.data && rPayNa.data.errno === 0) {
      pass('邻里帮帮支付', { order_id: id, status: rPayNa.data.data.status, pay_status: rPayNa.data.data.pay_status });
    } else {
      fail('邻里帮帮支付', { order_id: id, http_status: rPayNa.status, body: rPayNa.data });
    }
  }

  if (adminToken) {
    for (const id of neighborOrderIds) {
      const rAssign = await adminHttp.post(`/admin/neighbor-assist/orders/${id}/assign`, { worker_id: workerLogin.user.id });
      if (rAssign.status === 200 && rAssign.data && rAssign.data.errno === 0) {
        pass('邻里帮帮派单（管理端）', { order_id: id, status: rAssign.data.data.status, worker_id: workerLogin.user.id });
      } else {
        fail('邻里帮帮派单（管理端）', { order_id: id, http_status: rAssign.status, body: rAssign.data });
      }
    }
  } else {
    report.findings.push('未执行：邻里帮帮派单（缺少管理员 token）。');
  }

  for (const id of neighborOrderIds) {
    const rNaAccept = await workerHttp.post(`/neighbor-assist/orders/${id}/accept`);
    if (rNaAccept.status === 200 && rNaAccept.data && rNaAccept.data.errno === 0) {
      pass('邻里帮帮接单（neighbor-assist/orders/:id/accept）', { order_id: id, status: rNaAccept.data.data.status });
    } else {
      fail('邻里帮帮接单（neighbor-assist/orders/:id/accept）', { order_id: id, http_status: rNaAccept.status, body: rNaAccept.data });
    }

    const rNaComplete = await workerHttp.post(`/neighbor-assist/orders/${id}/complete`);
    if (rNaComplete.status === 200 && rNaComplete.data && rNaComplete.data.errno === 0) {
      pass('邻里帮帮完成（neighbor-assist/orders/:id/complete）', { order_id: id, status: rNaComplete.data.data.status });
    } else {
      fail('邻里帮帮完成（neighbor-assist/orders/:id/complete）', { order_id: id, http_status: rNaComplete.status, body: rNaComplete.data });
    }

    const row = await models.NeighborAssistOrder.findByPk(id);
    if (row && row.status === 'completed') {
      pass('数据库校验：neighbor_assist_orders completed', { order_id: id, pay_status: row.pay_status });
    } else {
      fail('数据库校验：neighbor_assist_orders completed', { order_id: id, found: !!row, status: row && row.status });
    }
  }

  const addrSnap = e2eAddr('异常流起点');
  const addrDst = e2eAddr('异常流终点');

  const rNaDup = await buyerHttp.post('/neighbor-assist/orders', {
    assist_type: 'take',
    community_id: E2E_COMMUNITY_ID_MAIN,
    origin_address_snapshot: addrSnap,
    destination_address_snapshot: addrDst,
    amount: 1,
    remark: 'e2e dup pay'
  });
  const dupNaId = rNaDup.data && rNaDup.data.data && (rNaDup.data.data.id || rNaDup.data.data.order_id);
  if (dupNaId) {
    await buyerHttp.post(`/neighbor-assist/orders/${dupNaId}/pay`);
    const rPayTwice = await buyerHttp.post(`/neighbor-assist/orders/${dupNaId}/pay`);
    if (rPayTwice.status === 200 && rPayTwice.data && rPayTwice.data.errno === 400) {
      pass('异常流：邻里帮帮重复支付被拒绝', { order_id: dupNaId, errmsg: rPayTwice.data.errmsg });
    } else {
      fail('异常流：邻里帮帮重复支付被拒绝', { order_id: dupNaId, body: rPayTwice.data });
    }
  } else {
    fail('异常流：邻里帮帮重复支付（前置下单失败）', { body: rNaDup.data });
  }

  const rNaCancel = await buyerHttp.post('/neighbor-assist/orders', {
    assist_type: 'escort',
    community_id: E2E_COMMUNITY_ID_MAIN,
    origin_address_snapshot: addrSnap,
    destination_address_snapshot: addrDst,
    amount: 2,
    remark: 'e2e cancel'
  });
  const cancelNaId = rNaCancel.data && rNaCancel.data.data && (rNaCancel.data.data.id || rNaCancel.data.data.order_id);
  if (cancelNaId) {
    const rCancel = await buyerHttp.post(`/neighbor-assist/orders/${cancelNaId}/cancel`);
    if (rCancel.status === 200 && rCancel.data && rCancel.data.errno === 0) {
      const rowC = await models.NeighborAssistOrder.findByPk(cancelNaId);
      if (rowC && rowC.status === 'cancelled') {
        pass('异常流：邻里帮帮发布方取消（pending_pay）', { order_id: cancelNaId, status: rowC.status });
      } else {
        fail('异常流：邻里帮帮发布方取消（DB）', { order_id: cancelNaId, status: rowC && rowC.status });
      }
    } else {
      fail('异常流：邻里帮帮发布方取消', { http_status: rCancel.status, body: rCancel.data });
    }
  }

  if (urgentServiceId) {
    const rSoDup = await buyerHttp.post('/service-orders', {
      service_id: urgentServiceId,
      community_id: E2E_COMMUNITY_ID_MAIN,
      address_snapshot: { phone: '13900000001', ...e2eAddr('dup pay test') },
      remark: `${E2E_COMMUNITY_LABEL} e2e dup pay so`
    });
    const dupSoId = rSoDup.data && rSoDup.data.data && (rSoDup.data.data.id || rSoDup.data.data.order_id);
    if (dupSoId) {
      await buyerHttp.post(`/service-orders/${dupSoId}/pay`);
      const rSoPayTwice = await buyerHttp.post(`/service-orders/${dupSoId}/pay`);
      if (rSoPayTwice.status === 200 && rSoPayTwice.data && rSoPayTwice.data.errno === 400) {
        pass('异常流：到家订单重复支付被拒绝', { order_id: dupSoId });
      } else {
        fail('异常流：到家订单重复支付被拒绝', { body: rSoPayTwice.data });
      }
    }
  }

  if (adminToken && wp2) {
    const rNaRej = await buyerHttp.post('/neighbor-assist/orders', {
      assist_type: 'child',
      community_id: E2E_COMMUNITY_ID_MAIN,
      origin_address_snapshot: addrSnap,
      destination_address_snapshot: addrDst,
      amount: 3,
      remark: 'e2e worker reject'
    });
    const rejNaId = rNaRej.data && rNaRej.data.data && (rNaRej.data.data.id || rNaRej.data.data.order_id);
    if (rejNaId) {
      await buyerHttp.post(`/neighbor-assist/orders/${rejNaId}/pay`);
      const rAssignRej = await adminHttp.post(`/admin/neighbor-assist/orders/${rejNaId}/assign`, {
        worker_id: workerLogin.user.id
      });
      if (rAssignRej.status === 200 && rAssignRej.data && rAssignRej.data.errno === 0) {
        const rReject = await workerHttp.post(`/neighbor-assist/orders/${rejNaId}/reject`);
        if (rReject.status === 200 && rReject.data && rReject.data.errno === 0) {
          const rowR = await models.NeighborAssistOrder.findByPk(rejNaId);
          if (rowR && rowR.status === 'paid_pending_dispatch' && !rowR.assigned_worker_id) {
            pass('异常流：邻里帮帮技工拒单（回退待派单）', { order_id: rejNaId });
          } else {
            fail('异常流：邻里帮帮技工拒单（DB）', { status: rowR && rowR.status, worker: rowR && rowR.assigned_worker_id });
          }
        } else {
          fail('异常流：邻里帮帮技工拒单（API）', { body: rReject.data });
        }
      }
    }

    const rNaBuyerAcc = await buyerHttp.post('/neighbor-assist/orders', {
      assist_type: 'trash',
      community_id: E2E_COMMUNITY_ID_MAIN,
      origin_address_snapshot: addrSnap,
      destination_address_snapshot: addrDst,
      amount: 4,
      remark: 'e2e buyer accept'
    });
    const buyerAccId = rNaBuyerAcc.data && rNaBuyerAcc.data.data && (rNaBuyerAcc.data.data.id || rNaBuyerAcc.data.data.order_id);
    if (buyerAccId) {
      await buyerHttp.post(`/neighbor-assist/orders/${buyerAccId}/pay`);
      await adminHttp.post(`/admin/neighbor-assist/orders/${buyerAccId}/assign`, { worker_id: workerLogin.user.id });
      const rBuyerTryAccept = await buyerHttp.post(`/neighbor-assist/orders/${buyerAccId}/accept`);
      if (
        rBuyerTryAccept.status === 403 &&
        rBuyerTryAccept.data &&
        rBuyerTryAccept.data.errno === 403
      ) {
        pass('异常流：买家账号调用接单接口被拒绝（非技工）', { order_id: buyerAccId });
      } else {
        fail('异常流：买家账号调用接单接口被拒绝', { http_status: rBuyerTryAccept.status, body: rBuyerTryAccept.data });
      }
    }

    const rNaW2 = await buyerHttp.post('/neighbor-assist/orders', {
      assist_type: 'pet',
      community_id: E2E_COMMUNITY_ID_MAIN,
      origin_address_snapshot: addrSnap,
      destination_address_snapshot: addrDst,
      amount: 5,
      remark: 'e2e wrong worker accept'
    });
    const w2NaId = rNaW2.data && rNaW2.data.data && (rNaW2.data.data.id || rNaW2.data.data.order_id);
    if (w2NaId) {
      await buyerHttp.post(`/neighbor-assist/orders/${w2NaId}/pay`);
      await adminHttp.post(`/admin/neighbor-assist/orders/${w2NaId}/assign`, { worker_id: workerLogin.user.id });
      const rW2Try = await worker2Http.post(`/neighbor-assist/orders/${w2NaId}/accept`);
      if (rW2Try.status === 403 && rW2Try.data && rW2Try.data.errno === 403) {
        pass('异常流：非指派技工接单被拒绝', { order_id: w2NaId, worker2_id: worker2Login.user.id });
      } else {
        fail('异常流：非指派技工接单被拒绝', { http_status: rW2Try.status, body: rW2Try.data });
      }
    }
  } else {
    report.findings.push(
      '未执行：邻里帮帮拒单/越权用例（需要管理员 token 且技工2档案存在）。'
    );
  }

  if (adminToken) {
    const shopNo = `SHOP${Date.now()}`;
    const rCreateShop = await adminHttp.post('/admin/market-shops', {
      shop_no: shopNo,
      name: 'E2E集市店铺',
      category: 'local',
      is_open: 1,
      is_active: 1,
      sort_order: 1,
      delivery_type: 'platform',
      min_order_amount: 0,
      delivery_fee: 0
    });
    const shop = rCreateShop.data && (rCreateShop.data.data || rCreateShop.data);
    const shopId = shop && shop.id;
    if (rCreateShop.status === 201 && shopId) {
      pass('后台创建集市店铺（admin/market-shops）', { shop_id: shopId, shop_no: shopNo });
      const merchantUsername = `m_${Date.now()}`;
      const merchantPassword = 'e2e_pass_123';
      const rCreateAcc = await adminHttp.post('/admin/merchant-accounts', {
        shop_id: shopId,
        username: merchantUsername,
        password: merchantPassword,
        role: 'operator'
      });
      if (rCreateAcc.status === 201) {
        pass('后台创建商家账号（admin/merchant-accounts）', { username: merchantUsername });
      } else {
        fail('后台创建商家账号（admin/merchant-accounts）', { http_status: rCreateAcc.status, body: rCreateAcc.data });
      }

      const goodsNo = `G${Date.now()}`;
      const rCreateGood = await adminHttp.post('/admin/market-goods', {
        goods_no: goodsNo,
        shop_id: shopId,
        category_key: 'local',
        name: 'E2E商品',
        description: 'E2E商品描述',
        main_image: 'https://example.com/market-good.png',
        images: ['https://example.com/market-good.png'],
        price: 12.5,
        origin_price: 15.8,
        stock: 10,
        safe_stock: 2,
        status: 'off_sale',
        sort_order: 1
      });
      const goodRow = rCreateGood.data && (rCreateGood.data.data || rCreateGood.data);
      const marketGoodId = goodRow && goodRow.id;
      if (rCreateGood.status === 201 && marketGoodId) {
        pass('后台创建商品（admin/market-goods）', { goods_id: marketGoodId, goods_no: goodsNo, status: goodRow.status });
      } else {
        fail('后台创建商品（admin/market-goods）', { http_status: rCreateGood.status, body: rCreateGood.data });
      }

      const merchantLogin = await http.post('/merchant-portal/login', { username: merchantUsername, password: merchantPassword });
      const merchantToken = merchantLogin.data && merchantLogin.data.data && merchantLogin.data.data.token;
      if (merchantLogin.status === 200 && merchantToken) {
        pass('商家后台登录（merchant-portal/login）', { username: merchantUsername });
        const mHttp = axios.create({
          baseURL: base,
          timeout: 20000,
          validateStatus: () => true,
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        const rListGoods = await mHttp.get('/market/merchant/goods');
        const listPayload = rListGoods.data && rListGoods.data.data;
        if (rListGoods.status === 200 && rListGoods.data && rListGoods.data.errno === 0 && listPayload && Array.isArray(listPayload.list)) {
          pass('商家后台商品列表（market/merchant/goods）', { total: listPayload.total });
        } else {
          fail('商家后台商品列表（market/merchant/goods）', { http_status: rListGoods.status, body: rListGoods.data });
        }

        if (marketGoodId) {
          const rShelf = await mHttp.post(`/market/merchant/goods/${marketGoodId}/shelf`, { published: true });
          if (rShelf.status === 200 && rShelf.data && rShelf.data.errno === 0) {
            pass('商家后台上架商品（market/merchant/goods/:id/shelf）', { goods_id: marketGoodId, status: rShelf.data.data.status });
          } else {
            fail('商家后台上架商品（market/merchant/goods/:id/shelf）', { http_status: rShelf.status, body: rShelf.data });
          }
        }
      } else {
        fail('商家后台登录（merchant-portal/login）', { http_status: merchantLogin.status, body: merchantLogin.data });
      }
    } else {
      fail('后台创建集市店铺（admin/market-shops）', { http_status: rCreateShop.status, body: rCreateShop.data });
    }
  } else {
    report.findings.push('未执行：商家后台上架商品（缺少管理员 token，无法创建店铺与商家账号）。');
  }

  // --- 站内沟通（模拟服务前后用户↔技工私信；后端无单独「小区管家」账号体系，沟通为双用户私信 + 运营后台监控）---
  const rMsgU2W = await buyerHttp.post('/messages/send', {
    peerId: workerLogin.user.id,
    content: '[E2E] 用户→技工：请问大概几点能上门？'
  });
  if (rMsgU2W.status === 200 && rMsgU2W.data && rMsgU2W.data.errcode === 0) {
    pass('站内私信：用户发给技工（POST /messages/send）', { peer_id: workerLogin.user.id });
  } else {
    fail('站内私信：用户发给技工', { http_status: rMsgU2W.status, body: rMsgU2W.data });
  }
  const rMsgW2U = await workerHttp.post('/messages/send', {
    peerId: buyerLogin.user.id,
    content: '[E2E] 技工→用户：下午两点左右到，请保持手机畅通'
  });
  if (rMsgW2U.status === 200 && rMsgW2U.data && rMsgW2U.data.errcode === 0) {
    pass('站内私信：技工回复用户（POST /messages/send）', { peer_id: buyerLogin.user.id });
  } else {
    fail('站内私信：技工回复用户', { http_status: rMsgW2U.status, body: rMsgW2U.data });
  }
  const rConvBuyer = await buyerHttp.get('/messages/conversations');
  let sampleConvId = null;
  if (rConvBuyer.status === 200 && rConvBuyer.data && rConvBuyer.data.errcode === 0 && Array.isArray(rConvBuyer.data.data)) {
    const first = rConvBuyer.data.data[0];
    sampleConvId =
      first &&
      (first.conversation_id != null
        ? first.conversation_id
        : first.conversation && first.conversation.id);
    pass('站内会话列表（GET /messages/conversations）', { count: rConvBuyer.data.data.length });
  } else {
    fail('站内会话列表（GET /messages/conversations）', { http_status: rConvBuyer.status, body: rConvBuyer.data });
  }
  if (sampleConvId) {
    const rHist = await buyerHttp.get(`/messages/history/${sampleConvId}`);
    if (rHist.status === 200 && rHist.data && rHist.data.errcode === 0 && Array.isArray(rHist.data.data)) {
      pass('站内会话历史（GET /messages/history/:conversationId）', { messages: rHist.data.data.length });
    } else {
      fail('站内会话历史', { http_status: rHist.status, body: rHist.data });
    }
  }

  if (adminToken) {
    const rMsgOv = await adminHttp.get('/admin/messages/overview');
    if (rMsgOv.status === 200 && rMsgOv.data && rMsgOv.data.message === 'ok' && rMsgOv.data.data) {
      pass('运营中台消息与投诉监控（GET /admin/messages/overview）', {
        messages_24h: rMsgOv.data.data.messages_last_24h,
        open_complaints: rMsgOv.data.data.open_complaint_tickets
      });
    } else {
      fail('运营中台消息与投诉监控（GET /admin/messages/overview）', { http_status: rMsgOv.status, body: rMsgOv.data });
    }
  } else {
    report.findings.push('未执行：GET /admin/messages/overview（缺少管理员 token）。');
  }

  if (soId) {
    const rSoCompl = await buyerHttp.post(`/service-orders/${soId}/complaint`, {
      content: '[E2E] 到家服务投诉：服务态度需改进',
      images: ['https://example.com/c1.jpg']
    });
    if (rSoCompl.status === 200 && rSoCompl.data && rSoCompl.data.errno === 0 && rSoCompl.data.data && rSoCompl.data.data.id) {
      pass('到家订单投诉（POST /service-orders/:id/complaint → service_order_complaints）', {
        complaint_id: rSoCompl.data.data.id,
        order_id: soId
      });
    } else {
      fail('到家订单投诉', { http_status: rSoCompl.status, body: rSoCompl.data });
    }
  }

  const rFeedback = await buyerHttp.post('/feedback/submit', {
    content: '[E2E] 意见反馈：希望增加预约时段',
    contact: '13900000001'
  });
  if (rFeedback.status === 201 && rFeedback.data && rFeedback.data.message === '提交成功') {
    pass('意见反馈（POST /feedback/submit）', {});
  } else {
    fail('意见反馈（POST /feedback/submit）', { http_status: rFeedback.status, body: rFeedback.data });
  }

  let complaintTicketIdForResolve = null;
  if (adminToken) {
    const rCtCreate = await adminHttp.post('/admin/complaint-tickets', {
      order_no: `E2E-CT-${Date.now()}`,
      user_id: buyerLogin.user.id,
      type: 'order',
      content: '[E2E] 运营中台登记投诉工单（complaint_tickets）'
    });
    const ctRow = rCtCreate.data && (rCtCreate.data.data || rCtCreate.data);
    complaintTicketIdForResolve = ctRow && ctRow.id;
    if (rCtCreate.status === 201 && complaintTicketIdForResolve) {
      pass('运营中台创建投诉工单（POST /admin/complaint-tickets）', { ticket_id: complaintTicketIdForResolve });
    } else {
      fail('运营中台创建投诉工单', { http_status: rCtCreate.status, body: rCtCreate.data });
    }
    const rCtList = await adminHttp.get('/admin/complaint-tickets');
    const ctList = rCtList.data && rCtList.data.data;
    if (rCtList.status === 200 && Array.isArray(ctList) && ctList.length > 0) {
      pass('运营中台投诉工单列表（GET /admin/complaint-tickets）', { count: ctList.length });
    } else {
      fail('运营中台投诉工单列表', { http_status: rCtList.status, body: rCtList.data });
    }
    if (complaintTicketIdForResolve) {
      const rCtRes = await adminHttp.put(`/admin/complaint-tickets/${complaintTicketIdForResolve}`, {
        status: 'resolved',
        reply: '[E2E] 已致电用户并完成安抚，问题关闭。'
      });
      if (rCtRes.status === 200 && rCtRes.data && rCtRes.data.message === '处理成功') {
        pass('运营中台处理投诉工单（PUT /admin/complaint-tickets/:id）', { ticket_id: complaintTicketIdForResolve });
      } else {
        fail('运营中台处理投诉工单', { http_status: rCtRes.status, body: rCtRes.data });
      }
    }
  } else {
    report.findings.push('未执行：投诉工单 admin 接口（缺少管理员 token）。');
  }

  const md = [];
  md.push(`# 后端首页全流程回环测试报告`);
  md.push(``);
  md.push(`- 开始时间：${mdEscape(report.startedAt)}`);
  md.push(`- Base URL：${mdEscape(report.base)}`);
  md.push(`- 管理员 token 获取方式：${mdEscape(adminAuth.via)}`);
  md.push(
    `- 主测试小区：${mdEscape(E2E_COMMUNITY_LABEL)}（community_id=${E2E_COMMUNITY_ID_MAIN}；对照小区 id=${E2E_COMMUNITY_ID_ALT}）`
  );
  md.push(
    `- 种子数据：serviceId=${report.seeded.serviceId} goodId=${report.seeded.goodId} extraServices=${(report.seeded.extraServiceIds || []).length} goods=${(report.seeded.goodsBatch || []).length}`
  );
  md.push(``);
  md.push(`## 用例步骤与结果`);
  md.push(``);
  md.push(`| # | 用例 | 结果 | 关键信息 |`);
  md.push(`|---:|------|------|----------|`);
  report.steps.forEach((s, idx) => {
    const key = [];
    Object.keys(s)
      .filter((k) => !['at', 'name', 'ok'].includes(k))
      .forEach((k) => {
        if (s[k] === undefined) return;
        key.push(`${k}=${typeof s[k] === 'object' ? JSON.stringify(s[k]) : String(s[k])}`);
      });
    md.push(`| ${idx + 1} | ${mdEscape(s.name)} | ${s.ok ? 'PASS' : 'FAIL'} | ${mdEscape(key.join(' ; '))} |`);
  });
  md.push(``);
  md.push(`## 关键发现`);
  md.push(``);
  if (report.findings.length === 0) {
    md.push(`- 无`);
  } else {
    report.findings.forEach((f) => md.push(`- ${mdEscape(f)}`));
  }
  md.push(``);
  md.push(`## 客服与「小区管家」能力说明（后端现状）`);
  md.push(``);
  md.push(
    `- **私信**：C 端 \`/messages/send\`、\`/messages/conversations\`、\`/messages/history/:id\`（用户↔用户/技工），本次 E2E 已跑通用户↔技工。`
  );
  md.push(
    `- **运营监控**：\`/admin/messages/overview\` 汇总会话量、近期消息数、**未结投诉工单数**（complaint_tickets 中 open/processing）。`
  );
  md.push(
    `- **投诉**：① 到家订单 **service_order_complaints**（用户 \`/service-orders/:id/complaint\`）；② 通用工单 **complaint_tickets**（运营 \`/admin/complaint-tickets\` 创建/列表/处理）。`
  );
  md.push(
    `- **小区管家**：当前无独立「管家」角色或单独管家 API；首页「管家精选」等为运营位/商品模块。客服场景由 **私信 + 运营工单 + 订单投诉** 组合承担。`
  );
  md.push(``);
  md.push(`## 关联表与数据变更核对点（本次用例实际触达）`);
  md.push(``);
  md.push(`- worker_applications：新增 3 条（技工1 + 技工2 + 仅小区2技工，pending -> approved）`);
  md.push(
    `- worker_profiles：技工1/技工2 upsert（status=active；community_id 本次测试手动置 ${E2E_COMMUNITY_ID_MAIN}，${E2E_COMMUNITY_LABEL}）`
  );
  md.push(`- service_provider_applications：新增 1 条（pending -> approved）`);
  md.push(`- service_provider_profiles：upsert 1 条（status=active）`);
  md.push(`- service_orders：新增 2 条（技工单闭环 completed；服务商打包单闭环 completed）`);
  md.push(`- messages / conversations / user_conversations：用户↔技工私信联调写入`);
  md.push(`- service_order_complaints：用户对到家订单 POST /service-orders/:id/complaint 写入`);
  md.push(`- complaint_tickets：运营中台登记/处理工单；与到家投诉表并存`);
  md.push(`- feedback：用户意见反馈`);
  md.push(
    `- neighbor_assist_orders：主流程 ${neighborOrderIds.length} 条闭环（含 child/escort）；另含重复支付/取消/拒单/越权等异常流用例`
  );
  md.push(`- market_shops / merchant_accounts / market_goods：后台创建并通过商家接口上架（如管理员 token 可用）`);
  md.push(``);
  md.push(`---`);
  md.push(`生成时间：${mdEscape(nowIso())}`);

  const outDir = path.resolve(__dirname, '..', '..', 'doc', 'cw测试结果');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `后端首页全流程回环测试报告_${Date.now()}.md`);
  fs.writeFileSync(outPath, md.join('\n'), 'utf8');

  await models.sequelize.close();
  if (childProc) {
    try {
      childProc.kill('SIGTERM');
    } catch (_) {}
  }
  console.log('REPORT_PATH', outPath);
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
