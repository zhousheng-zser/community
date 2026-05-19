const https = require('https');
const BASE = 'https://jshsp1.eds-tech.cn/api/v1';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const u = new URL(BASE + path);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const r = https.request(opts, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch {
          resolve({ status: res.statusCode, body: b });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function loginSms(phone) {
  const r = await req('POST', '/auth/login_sms', { phone, code: '123456' });
  const d = r.body.data || r.body;
  return { phone, status: r.status, token: d.token, user: d.user, raw: r.body };
}

function listLen(payload) {
  if (!payload) return 0;
  if (Array.isArray(payload)) return payload.length;
  const list = payload.list || payload.rows || payload.orders || payload.items;
  if (Array.isArray(list)) return list.length;
  return 0;
}

async function testAccount(phone, token, loginUserId) {
  const profile = await req('GET', '/user/profile', null, token);
  const footprints = await req('GET', '/user/footprints?page=1&limit=5', null, token);
  const marketOrders = await req('GET', '/market/orders?page=1&limit=5', null, token);
  const serviceOrders = await req('GET', '/service-orders/my?page=1&limit=5', null, token);
  const p = profile.body.data || profile.body;
  const fp = footprints.body.data || footprints.body;
  const mo = marketOrders.body.data || marketOrders.body;
  const so = serviceOrders.body.data || serviceOrders.body;
  const profileId = p.id;
  const mismatch = loginUserId != null && profileId != null && String(loginUserId) !== String(profileId);
  return {
    profileId,
    profilePhone: p.phone || p.userMobile,
    profileRole: p.role,
    workerStatus: p.worker_status || p.workerStatus,
    loginProfileMismatch: mismatch,
    footprintTotal: fp.total,
    footprintSample: (fp.list || []).slice(0, 2).map((x) => x.title),
    marketOrderCount: listLen(mo),
    serviceOrderCount: listLen(so),
    profileStatus: profile.status,
    footprintsStatus: footprints.status,
    marketStatus: marketOrders.status,
    serviceStatus: serviceOrders.status
  };
}

(async () => {
  const phones = ['13800001111', '13900010001', '13800000000'];
  const results = [];
  for (const phone of phones) {
    console.log('\n=== ' + phone + ' ===');
    const login = await loginSms(phone);
    console.log('login status', login.status, 'userId', login.user && login.user.id);
    if (!login.token) {
      console.log('LOGIN FAIL', JSON.stringify(login.raw).slice(0, 300));
      results.push({ phone, ok: false, reason: 'no token' });
      continue;
    }
    const t = await testAccount(phone, login.token, login.user && login.user.id);
    console.log(JSON.stringify(t, null, 2));
    results.push({ phone, ok: !t.loginProfileMismatch, ...t });
  }
  console.log('\n--- summary ---');
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => console.error(e));
