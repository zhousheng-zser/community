/**
 * 打印「手机号 / 身份 / 商户店铺」对照（Markdown 友好 TSV）
 * 用法：cd backend && node scripts/export-user-identity-table.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), quiet: true });
const db = require('../src/models');

(async () => {
  const users = await db.User.findAll({ attributes: ['id', 'phone', 'nickname', 'role'], raw: true });
  const workerApp = new Set(
    (await db.WorkerApplication.findAll({ where: { status: 'approved' }, attributes: ['user_id'], raw: true })).map(
      (r) => r.user_id
    )
  );
  const workerProf = new Set(
    (await db.WorkerProfile.findAll({ where: { status: 'active' }, attributes: ['user_id'], raw: true })).map(
      (r) => r.user_id
    )
  );
  const workerUsers = new Set([...workerApp, ...workerProf]);
  const spSet = new Set(
    (await db.ServiceProviderProfile.findAll({ attributes: ['user_id'], raw: true })).map((r) => r.user_id)
  );

  const byPhone = new Map();
  for (const u of users) {
    const ph = (u.phone || '').trim() || '（无手机号）';
    if (!byPhone.has(ph)) {
      byPhone.set(ph, { nicknames: new Set(), isWorker: false, isSp: false, userRoleWorker: false });
    }
    const b = byPhone.get(ph);
    if (u.nickname) b.nicknames.add(u.nickname);
    if (workerUsers.has(u.id)) b.isWorker = true;
    if (spSet.has(u.id)) b.isSp = true;
    if (u.role === 'worker') b.userRoleWorker = true;
  }

  const merch = await db.MerchantAccount.findAll({ where: { status: 'active' }, attributes: ['username', 'shop_id'], raw: true });
  const shops = await db.MarketShop.findAll({ attributes: ['id', 'name', 'contact_phone'], raw: true });
  const sm = Object.fromEntries(shops.map((s) => [s.id, s]));
  const merchantByPhone = new Map();
  for (const m of merch) {
    const un = String(m.username || '').trim();
    const s = sm[m.shop_id];
    const entry = { username: un, shop: s ? s.name : '#' + m.shop_id, shopPhone: s && s.contact_phone };
    if (!merchantByPhone.has(un)) merchantByPhone.set(un, []);
    merchantByPhone.get(un).push(entry);
  }

  console.log('=== 按手机号：身份（TSV：手机号\\t身份）\n');
  const rows = [...byPhone.entries()].sort((a, b) => {
    if (a[0].includes('无手机')) return 1;
    if (b[0].includes('无手机')) return -1;
    return a[0].localeCompare(b[0]);
  });
  for (const [ph, b] of rows) {
    const workerLike = b.isWorker || b.userRoleWorker;
    let tag;
    if (workerLike && b.isSp) tag = '技工+到家服务商';
    else if (workerLike) tag = '技工';
    else if (b.isSp) tag = '到家服务商';
    else tag = '普通用户';
    if (merchantByPhone.has(ph)) {
      tag +=
        '；集市商户(' +
        merchantByPhone
          .get(ph)
          .map((x) => x.shop + '/' + x.username)
          .join('；') +
        ')';
    }
    console.log([ph, tag, [...b.nicknames].slice(0, 5).join(',')].join('\t'));
  }

  console.log('\n=== 商户登录名未出现在 Users.phone（TSV：登录名\\t店铺\\t店铺电话）\n');
  const phones = new Set([...byPhone.keys()].filter((p) => p && !p.includes('无')));
  for (const [un, list] of merchantByPhone) {
    if (!phones.has(un)) {
      for (const s of list) {
        console.log([un, s.shop, s.shopPhone || ''].join('\t'));
      }
    }
  }

  await db.sequelize.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
