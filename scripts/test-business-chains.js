#!/usr/bin/env node
const http = require('http');
const jwt = require('jsonwebtoken');
const JWT = 'jwt_key_cwsgwbd';
const BASE = 'http://8.136.29.208:3002/api/v1';

let N = 0, P = 0, F = 0;
const fails = [];

function req(method, path, body, tok) {
  return new Promise((resolve, reject) => {
    const full = BASE + path;
    const payload = body ? JSON.stringify(body) : null;
    const h = { 'Content-Type': 'application/json' };
    if (tok) h['Authorization'] = 'Bearer ' + tok;
    const u = new URL(full);
    const opts = { method, hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers: h };
    const rq = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ ...JSON.parse(d) }); } catch (e) { resolve({ raw: d }); } });
    });
    rq.on('error', reject); rq.setTimeout(15000, () => { rq.destroy(); reject(new Error('T')); });
    if (payload) rq.write(payload); rq.end();
  });
}

function token(uid) { return jwt.sign({ id: uid, openid: 't' + uid, token_version: 0 }, JWT, { expiresIn: '7d' }); }
const TA = { id: 1, t: token(1) };
const TB = { id: 2, t: token(2) };

async function t(name, fn) {
  N++; try { await fn(); P++; console.log('  [PASS] ' + name); } catch (e) { F++; fails.push(name); console.log('  [FAIL] ' + name + ': ' + e.message); }
}
function A(c, m) { if (!c) throw new Error(m); }

(async () => {
  console.log('\n========== 邻里帮帮完整链路测试 ==========\n');

  await t('用户A鉴权', async () => {
    const r = await req('GET', '/user/profile', null, TA.t);
    A(r.id || r.errno === 0 || (r.data && r.data.id), JSON.stringify(r).slice(0, 80));
  });

  await t('用户B鉴权', async () => {
    const r = await req('GET', '/user/profile', null, TB.t);
    A(r.id || r.errno === 0 || (r.data && r.data.id), JSON.stringify(r).slice(0, 80));
  });

  let oid;
  await t('创建订单(陪读)', async () => {
    const r = await req('POST', '/neighbor-assist/orders', {
      assist_type: '陪读', community_id: 1,
      origin_address_snapshot: { address: '上海市合川路站', detail: '上海市合川路站' },
      destination_address_snapshot: { address: '上海市合川路站附近学校', detail: '上海市合川路站附近学校' },
      content: '需要陪孩子放学后读书30分钟',
      remark: '需要陪孩子放学后读书30分钟',
      reward_amount: 25
    }, TA.t);
    A(r.errno === 0, 'errno=' + r.errno + ' ' + r.errmsg);
    A(r.data && r.data.id, 'no id: ' + JSON.stringify(r.data).slice(0, 100));
    oid = r.data.id;
  });

  await t('订单详情-状态', async () => {
    const r = await req('GET', '/neighbor-assist/orders/' + oid, null, TA.t);
    A(r.data && r.data.order, 'no order');
    A(r.data.order.status === 'pending_pay', r.data.order.status);
    A(r.data.order.pay_status === 'unpaid', r.data.order.pay_status);
  });

  await t('订单详情-类型(陪读)', async () => {
    const r = await req('GET', '/neighbor-assist/orders/' + oid, null, TA.t);
    A(r.data.order.assist_type === '陪读', r.data.order.assist_type);
    A(r.data.order.assist_type_label && r.data.order.assist_type_label.includes('陪读'), r.data.order.assist_type_label);
  });

  await t('订单详情-备注', async () => {
    const r = await req('GET', '/neighbor-assist/orders/' + oid, null, TA.t);
    A(r.data.order.content || r.data.order.remark, 'no content');
    A((r.data.order.content || r.data.order.remark).includes('读书'), 'wrong content');
  });

  await t('发布人-订单列表', async () => {
    const r = await req('GET', '/neighbor-assist/orders/my?role=publisher', null, TA.t);
    A(r.data && r.data.list && r.data.list.length > 0, 'empty');
    A(r.data.list.find(x => x.id === oid), 'not found');
  });

  await t('发布人支付', async () => {
    const r = await req('POST', '/neighbor-assist/orders/' + oid + '/pay', {}, TA.t);
    A(r.errno === 0, r.errmsg || JSON.stringify(r).slice(0, 80));
    A(r.data.pay_status === 'paid', r.data.pay_status);
  });

  await t('用户B-社区接单池', async () => {
    const r = await req('GET', '/neighbor-assist/orders/community-pool', null, TB.t);
    A(r.data && r.data.list && Array.isArray(r.data.list), 'pool error');
    // Pool should have our order or other paid_pending_dispatch orders
    const found = r.data.list.find(x => x.id === oid);
    A(found || r.data.list.length > 0, 'pool empty: total=' + r.data.total);
  });

  await t('用户B接单', async () => {
    const r = await req('POST', '/neighbor-assist/orders/' + oid + '/community-grab', {}, TB.t);
    A(r.errno === 0, r.errmsg || JSON.stringify(r).slice(0, 80));
    A(r.data.status === 'dispatched', r.data.status);
  });

  await t('接单后-发布人视图', async () => {
    const r = await req('GET', '/neighbor-assist/orders/' + oid, null, TA.t);
    A(r.data.order.status === 'dispatched', r.data.order.status);
    A(r.data.order.assigned_worker_id === 2, r.data.order.assigned_worker_id);
    A(r.data.order.helper, 'no helper');
  });

  await t('接单后-接单方视图', async () => {
    const r = await req('GET', '/neighbor-assist/orders/' + oid, null, TB.t);
    A(r.data.order.my_role === 'helper', r.data.order.my_role);
  });

  await t('接单方-订单列表', async () => {
    const r = await req('GET', '/neighbor-assist/orders/my?role=helper', null, TB.t);
    A(r.data.list && r.data.list.length > 0, 'empty');
    A(r.data.list.find(x => x.id === oid), 'not found');
  });

  await t('接单方-开始服务', async () => {
    const r = await req('POST', '/neighbor-assist/orders/' + oid + '/accept', {}, TB.t);
    A(r.errno === 0, r.errmsg || JSON.stringify(r).slice(0, 80));
    A(r.data.status === 'in_service', r.data.status);
  });

  await t('接单方-完成服务', async () => {
    const r = await req('POST', '/neighbor-assist/orders/' + oid + '/complete', {}, TB.t);
    A(r.errno === 0, r.errmsg || JSON.stringify(r).slice(0, 80));
    A(r.data.status === 'completed', r.data.status);
  });

  await t('发布人-确认完成', async () => {
    const r = await req('POST', '/neighbor-assist/orders/' + oid + '/confirm', {}, TA.t);
    A(r.errno === 0, r.errmsg || JSON.stringify(r).slice(0, 80));
    A(r.data.confirmed, 'not confirmed');
  });

  await t('最终状态', async () => {
    const r = await req('GET', '/neighbor-assist/orders/' + oid, null, TA.t);
    A(r.data.order.status === 'completed', r.data.order.status);
    A(r.data.order.pay_status === 'paid', r.data.order.pay_status);
  });

  // Cancel
  await t('创建并取消', async () => {
    const r = await req('POST', '/neighbor-assist/orders', {
      assist_type: '代取', community_id: 1,
      origin_address_snapshot: { address: 'A' }, destination_address_snapshot: { address: 'B' },
      content: '取消测试', remark: '取消测试', reward_amount: 5
    }, TA.t);
    A(r.errno === 0, r.errmsg);
    const c = await req('POST', '/neighbor-assist/orders/' + r.data.id + '/cancel', {}, TA.t);
    A(c.errno === 0, c.errmsg || JSON.stringify(c).slice(0, 80));
    A(c.data.status === 'cancelled', c.data.status);
  });

  // Self grab
  await t('防止接自己订单', async () => {
    const r = await req('POST', '/neighbor-assist/orders', {
      assist_type: '跑腿', community_id: 1,
      origin_address_snapshot: { address: 'X' }, destination_address_snapshot: { address: 'Y' }, reward_amount: 10
    }, TA.t);
    A(r.errno === 0, r.errmsg);
    const g = await req('POST', '/neighbor-assist/orders/' + r.data.id + '/community-grab', {}, TA.t);
    A(g.errno === 400, 'self grab should fail');
    await req('POST', '/neighbor-assist/orders/' + r.data.id + '/cancel', {}, TA.t);
  });

  // All types
  for (const cat of ['代取', '接送小孩', '陪诊', '陪读', '代扔垃圾', '宠物喂养', '跑腿', '其他']) {
    await t('类型:' + cat, async () => {
      const r = await req('POST', '/neighbor-assist/orders', {
        assist_type: cat, community_id: 1,
        origin_address_snapshot: { address: '测试' }, destination_address_snapshot: { address: '测试' },
        content: '测试' + cat, remark: '测试' + cat, reward_amount: 10
      }, TA.t);
      A(r.errno === 0, cat + ' failed: ' + (r.errmsg || ''));
    });
  }

  // ============ Service Provider ============
  console.log('\n========== 服务商完整链路测试 ==========\n');

  await t('技工列表', async () => {
    const r = await req('GET', '/core/workers?page=1&limit=5&community_id=1', null, TA.t);
    A(r.errno === 0 || r.list || Array.isArray(r.data) || (r.data && r.data.workers), JSON.stringify(r).slice(0, 80));
  });

  await t('服务列表', async () => {
    const r = await req('GET', '/core/services?page=1&limit=10', null, TA.t);
    A(r.errno === 0 || r.data, JSON.stringify(r).slice(0, 80));
  });

  let sid;
  await t('创建服务订单', async () => {
    const r = await req('POST', '/service-orders', {
      service_id: 1, community_id: 1,
      address_snapshot: { address: '上海市合川路站', detail: '上海市合川路站' },
      contact_name: '张先生', contact_phone: '13800001234',
      amount: 100, remark: '需要上门服务'
    }, TA.t);
    A(r.errno === 0 || r.data, 'no data: ' + JSON.stringify(r).slice(0, 150));
    sid = r.data && r.data.id;
  });

  if (sid) {
    await t('服务订单-支付', async () => {
      const r = await req('POST', '/service-orders/' + sid + '/pay', {}, TA.t);
      A(r.errno === 0, r.errmsg || JSON.stringify(r).slice(0, 80));
    });

    await t('服务订单-详情', async () => {
      const r = await req('GET', '/service-orders/' + sid, null, TA.t);
      A(r.errno === 0 || r.data, 'detail failed');
    });
  }

  // Summary
  console.log('\n========== 测试结果 ==========\n');
  console.log('总计:' + N + '  通过:' + P + '  失败:' + F);
  if (fails.length) { console.log('\n失败:'); fails.forEach((x, i) => console.log('  ' + (i + 1) + '. ' + x)); }
  process.exit(F > 0 ? 1 : 0);
})();
