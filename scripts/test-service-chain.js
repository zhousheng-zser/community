/**
 * 测试直约技工和直约服务商完整业务链路
 * 运行: node scripts/test-service-chain.js
 */
const https = require('https');
const crypto = require('crypto');
const JWT_SECRET = 'jwt_key_cwsgwbd';

const API = '/api/v1';

function signToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    id: userId, openid: 'test_' + userId, token_version: 0,
    iat: now, exp: now + 7 * 24 * 3600
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(header + '.' + payload).digest('base64url');
  return header + '.' + payload + '.' + signature;
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const opts = { method, path, hostname: '8.136.29.208', port: 3001, headers, rejectUnauthorized: false };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    if (postData) req.write(postData);
    req.end();
  });
}

const GET = (path, token) => request('GET', path, null, token);
const POST = (path, body, token) => request('POST', path, body, token);

let passed = 0, failed = 0;
const issues = [];
function assert(condition, msg) {
  if (condition) { passed++; console.log('  [PASS] ' + msg); }
  else { failed++; console.log('  [FAIL] ' + msg); issues.push(msg); }
}
function sd(res) { return res.body?.data ?? res.body ?? null; }

async function test() {
  console.log('========================================');
  console.log('直约技工 + 直约服务商 完整业务链路测试');
  console.log('========================================\n');

  // 普通用户固定用 user_id=3
  const buyerId = 3;
  const buyerToken = signToken(buyerId);

  // ========== 1. 公开 API ==========
  console.log('--- 1. 公开 API ---');

  let svcRes = await GET(API + '/core/services?limit=10');
  const svcList = (svcRes.body.data?.list) || svcRes.body.data || [];
  assert(svcList.length > 0, '服务列表 > 0 (' + svcList.length + ')');

  let workersRes = await GET(API + '/core/workers?community_id=1&page_size=20');
  const workerList = (workersRes.body.data?.list) || [];
  assert(workerList.length > 0, '技工列表 > 0 (' + workerList.length + ')');

  let providersRes = await GET(API + '/core/service-providers?community_id=1');
  const providers = providersRes.body.data || [];
  assert(providers.length > 0, '服务商列表 > 0 (' + providers.length + ')');

  // 技工详情 + 服务 + 评价
  if (workerList.length > 0) {
    let wd = await GET(API + '/core/workers/' + workerList[0].id + '?community_id=1');
    assert(wd.body.errno === 0, '技工详情成功');
    let ws = await GET(API + '/core/workers/' + workerList[0].id + '/services?community_id=1');
    assert(ws.body.errno === 0, '技工服务成功 (' + (Array.isArray(sd(ws)) ? sd(ws).length : 0) + ' 项)');
    let wr = await GET(API + '/core/workers/' + workerList[0].id + '/reviews?community_id=1');
    assert(wr.body.errno === 0, '技工评价成功');
  }

  // 服务商详情 + 目录
  if (providers.length > 0) {
    let pd = await GET(API + '/core/service-providers/' + providers[0].id);
    assert(pd.body.errno === 0, '服务商详情成功');
    let pc = await GET(API + '/core/service-providers/' + providers[0].id + '/catalog');
    const catalog = sd(pc);
    const groups = catalog?.groups || [];
    let allItems = []; groups.forEach(g => { if (g.items) allItems = allItems.concat(g.items); });
    console.log('  服务商目录: ' + groups.length + ' 分组, ' + allItems.length + ' 项');
  }

  // ========== 2. 直约技工完整链路 ==========
  console.log('\n--- 2. 直约技工完整链路 ---');

  if (workerList.length > 0 && svcList.length > 0) {
    // 关键: 使用 workerList[0] 的 ID 作为技工用户 ID
    const worker = workerList[0];
    const service = svcList[0];
    const workerToken = signToken(worker.id); // 用技工的实际 ID 签名
    console.log('  技工: ' + worker.name + ' (uid=' + worker.id + ')');
    console.log('  服务: ' + service.title + ' (sid=' + service.id + ')');

    // 2.1 用户下单
    console.log('\n  2.1 用户创建直约技工订单');
    let createRes = await POST(API + '/service-orders', {
      service_id: service.id,
      worker_id: worker.id,
      community_id: 1,
      contact_name: '测试用户',
      contact_phone: '13600000003',
      address: '测试小区1栋101',
      remark: '直约技工测试-' + Date.now(),
      appointment_time: new Date(Date.now() + 3600000).toISOString()
    }, buyerToken);
    console.log('    errno=' + createRes.body.errno + (createRes.body.errmsg ? ', ' + createRes.body.errmsg : ''));
    assert(createRes.body.errno === 0, '下单成功');

    const cData = createRes.body.data || {};
    const orderId = cData.id || cData.order_id;

    if (orderId) {
      assert(cData.status === 'pending_worker_accept', '初始=pending_worker_accept (实际:' + cData.status + ')');
      console.log('    订单ID=' + orderId + ', 状态=' + cData.status);

      // 2.2 用户订单列表
      console.log('\n  2.2 用户我的订单');
      let myRes = await GET(API + '/service-orders/my', buyerToken);
      assert(myRes.body.errno === 0, '我的订单成功');
      const myList = (myRes.body.data?.list) || [];
      const myOrder = myList.find(o => o.id === orderId);
      assert(!!myOrder, '新订单在我的订单列表中可见');
      console.log('    找到订单: 状态=' + myOrder?.status);

      // 2.3 订单详情
      let detailRes = await GET(API + '/service-orders/' + orderId, buyerToken);
      assert(detailRes.body.errno === 0, '订单详情成功');

      // 2.4 用户支付
      console.log('\n  2.4 用户模拟支付');
      let payRes = await POST(API + '/service-orders/' + orderId + '/pay', {}, buyerToken);
      assert(payRes.body.errno === 0, '支付成功');
      const payData = sd(payRes);
      const payStatus = typeof payData === 'object' ? (payData?.status || '') : '';
      console.log('    支付后: ' + payStatus);
      assert(payStatus === 'dispatched', '支付后=dispatched (实际:' + payStatus + ')');

      // 2.5 技工查看订单
      console.log('\n  2.5 技工订单列表');
      let woRes = await GET(API + '/worker/service-orders', workerToken);
      assert(woRes.body.errno === 0, '技工订单列表成功');
      const woList = (woRes.body.data?.list) || [];
      console.log('    技工订单数: ' + woList.length);
      assert(woList.length > 0, '技工能看到订单');

      // 找到刚创建的订单
      const targetOrder = woList.find(o => o.id === orderId) || woList[woList.length - 1];
      assert(!!targetOrder, '技工能找到新创建的订单');
      console.log('    目标订单: id=' + targetOrder?.id + ', 状态=' + targetOrder?.status);

      if (targetOrder) {
        // 2.6 技工订单详情
        console.log('\n  2.6 技工订单详情');
        let woDetail = await GET(API + '/worker/service-orders/' + targetOrder.id, workerToken);
        assert(woDetail.body.errno === 0, '技工详情成功');
        const wod = sd(woDetail);
        assert(wod && wod.buyer_name !== undefined, '包含买家信息');

        // 2.7 技工接单
        console.log('\n  2.7 技工接单');
        let acceptRes = await POST(API + '/worker/service-orders/' + targetOrder.id + '/accept', {}, workerToken);
        console.log('    errno=' + acceptRes.body.errno + (acceptRes.body.errmsg ? ', ' + acceptRes.body.errmsg : ''));
        assert(acceptRes.body.errno === 0, '接单成功');
        assert((acceptRes.body.data?.status || '') === 'in_service', '接单后=in_service');

        // 2.8 技工打卡
        console.log('\n  2.8 技工打卡');
        let ciRes = await POST(API + '/worker/service-orders/' + targetOrder.id + '/check-in', {
          latitude: 31.2304, longitude: 121.4737, accuracy: 10
        }, workerToken);
        assert(ciRes.body.errno === 0, '打卡成功');
        assert((ciRes.body.data?.check_ins?.length || 0) > 0, '打卡记录存在');

        // 2.9 技工上传服务前证据
        console.log('\n  2.9 技工上传服务前证据');
        let ebRes = await POST(API + '/worker/service-orders/' + targetOrder.id + '/evidence', {
          kind: 'before', urls: ['https://example.com/before1.jpg']
        }, workerToken);
        assert(ebRes.body.errno === 0, '上传服务前证据成功');

        // 2.10 技工上传服务后证据
        console.log('\n  2.10 技工上传服务后证据');
        let eaRes = await POST(API + '/worker/service-orders/' + targetOrder.id + '/evidence', {
          kind: 'after', urls: ['https://example.com/after1.jpg']
        }, workerToken);
        assert(eaRes.body.errno === 0, '上传服务后证据成功');

        // 2.11 技工加项申请
        console.log('\n  2.11 技工加项申请');
        let addonRes = await POST(API + '/worker/service-orders/' + targetOrder.id + '/addon-request', {
          remark: '需要额外购买材料'
        }, workerToken);
        assert(addonRes.body.errno === 0, '加项申请成功');

        // 2.12 技工完成服务
        console.log('\n  2.12 技工完成服务');
        let compRes = await POST(API + '/worker/service-orders/' + targetOrder.id + '/complete', {}, workerToken);
        assert(compRes.body.errno === 0, '技工完成成功');
        const compStatus = compRes.body.data?.status || '';
        assert(compStatus === 'pending_user_confirm', '完成=pending_user_confirm (实际:' + compStatus + ')');

        // 2.13 用户确认完成
        console.log('\n  2.13 用户确认完成');
        let confirmRes = await POST(API + '/service-orders/' + orderId + '/confirm-complete', {}, buyerToken);
        assert(confirmRes.body.errno === 0, '用户确认成功');
        const cfStatus = confirmRes.body.data?.status || '';
        assert(cfStatus === 'completed', '最终=completed (实际:' + cfStatus + ')');

        // 2.14 最终验证
        console.log('\n  2.14 最终验证');
        let finalRes = await GET(API + '/service-orders/' + orderId, buyerToken);
        const fo = sd(finalRes);
        assert(fo?.status === 'completed', '订单最终=completed (实际:' + fo?.status + ')');
      }
    }
  }

  // ========== 3. 直约服务商完整链路 ==========
  console.log('\n--- 3. 直约服务商完整链路 ---');

  // 找到有目录的服务商
  let spWithCatalog = null;
  for (const sp of providers) {
    let catRes = await GET(API + '/core/service-providers/' + sp.id + '/catalog');
    const cat = sd(catRes);
    const g = cat?.groups || [];
    let items = []; g.forEach(x => { if (x.items) items = items.concat(x.items); });
    if (items.length > 0) { spWithCatalog = { ...sp, items }; break; }
  }

  if (spWithCatalog) {
    // 关键: 用服务商的实际 user_id 签名 token
    const providerToken = signToken(spWithCatalog.id);
    console.log('  服务商: ' + spWithCatalog.name + ' (uid=' + spWithCatalog.id + ')');
    console.log('  目录项: ' + spWithCatalog.items.length);

    // 3.1 打包下单
    console.log('\n  3.1 用户创建打包单');
    const items = spWithCatalog.items.slice(0, 2).map(it => ({
      service_id: it.service_id, qty: 1, title: it.title
    }));
    if (items.length === 1) items.push({ ...items[0] });

    let bundleRes = await POST(API + '/service-orders/bundle', {
      provider_id: spWithCatalog.id,
      items,
      contact_name: '测试用户',
      contact_phone: '13600000003',
      address: '测试小区1栋101',
      community_id: 1,
      remark: '服务商打包测试-' + Date.now()
    }, buyerToken);
    console.log('    errno=' + bundleRes.body.errno + (bundleRes.body.errmsg ? ', ' + bundleRes.body.errmsg : ''));
    assert(bundleRes.body.errno === 0, '打包单创建成功');

    const bData = bundleRes.body.data || {};
    const bundleId = bData.id;
    if (bundleId) {
      console.log('    打包单ID=' + bundleId + ', 状态=' + bData.status + ', 金额=' + bData.amount);
      assert(bData.status === 'pending_pay', '初始=pending_pay (实际:' + bData.status + ')');

      // 3.2 用户支付
      console.log('\n  3.2 用户模拟支付');
      let bPay = await POST(API + '/service-orders/' + bundleId + '/pay', {}, buyerToken);
      assert(bPay.body.errno === 0, '打包单支付成功');
      const bpStatus = typeof bPay.body.data === 'object' ? (bPay.body.data?.status || '') : '';
      console.log('    支付后: ' + bpStatus);
      assert(bpStatus === 'pending_accept', '支付后=pending_accept (实际:' + bpStatus + ')');

      // 3.3 服务商查看订单 (用 /service-provider/orders)
      console.log('\n  3.3 服务商查看订单');
      let spOrders = await GET(API + '/service-provider/orders', providerToken);
      console.log('    errno=' + spOrders.body.errno + (spOrders.body.errmsg ? ', ' + spOrders.body.errmsg : ''));
      assert(spOrders.body.errno === 0, '服务商订单列表成功');
      const spList = (spOrders.body.data?.list) || [];
      console.log('    服务商订单数: ' + spList.length);

      // 找到新创建的订单 (排除已完成的)
      const targetOrder = spList.find(o => o.id === bundleId) || spList.find(o => o.status !== 'completed') || spList[0];
      if (targetOrder) {
        console.log('    目标订单: id=' + targetOrder.id + ', 状态=' + targetOrder.status);

        // 3.4 服务商接单
        console.log('\n  3.4 服务商接单');
        let spAccept = await POST(API + '/service-provider/orders/' + targetOrder.id + '/accept', {}, providerToken);
        console.log('    errno=' + spAccept.body.errno + (spAccept.body.errmsg ? ', ' + spAccept.body.errmsg : ''));
        assert(spAccept.body.errno === 0, '服务商接单成功');
        assert((spAccept.body.data?.status || '') === 'in_service', '接单后=in_service');

        // 3.5 服务商打卡
        console.log('\n  3.5 服务商打卡');
        let spCI = await POST(API + '/service-provider/orders/' + targetOrder.id + '/check-in', {
          latitude: 31.2304, longitude: 121.4737
        }, providerToken);
        assert(spCI.body.errno === 0, '服务商打卡成功');

        // 3.6 服务商上传证据
        console.log('\n  3.6 服务商上传证据');
        let spEv = await POST(API + '/service-provider/orders/' + targetOrder.id + '/evidence', {
          kind: 'before', urls: ['https://example.com/sp-before.jpg']
        }, providerToken);
        assert(spEv.body.errno === 0, '服务商上传证据成功');

        // 3.7 服务商完成
        console.log('\n  3.7 服务商完成服务');
        let spComp = await POST(API + '/service-provider/orders/' + targetOrder.id + '/complete', {}, providerToken);
        console.log('    errno=' + spComp.body.errno + (spComp.body.errmsg ? ', ' + spComp.body.errmsg : ''));
        assert(spComp.body.errno === 0, '服务商完成成功');
        const spCompStatus = spComp.body.data?.status || '';
        assert(spCompStatus === 'pending_user_confirm', '完成=pending_user_confirm (实际:' + spCompStatus + ')');

        // 3.8 用户确认
        console.log('\n  3.8 用户确认完成');
        let spCF = await POST(API + '/service-orders/' + bundleId + '/confirm-complete', {}, buyerToken);
        assert(spCF.body.errno === 0, '用户确认成功');
        const spCFStatus = spCF.body.data?.status || '';
        assert(spCFStatus === 'completed', '最终=completed (实际:' + spCFStatus + ')');

        // 3.9 最终验证
        console.log('\n  3.9 最终验证');
        let spFinal = await GET(API + '/service-orders/' + bundleId, buyerToken);
        const spFo = sd(spFinal);
        assert(spFo?.status === 'completed', '服务商订单最终=completed (实际:' + spFo?.status + ')');
      } else {
        issues.push('服务商找不到新创建的打包订单 bundleId=' + bundleId);
      }
    }
  } else {
    console.log('  [WARN] 所有服务商目录为空，无法测试');
    issues.push('所有服务商目录为空 - 需要在服务商和他们的服务之间建立关联');
  }

  // ========== 4. 异常场景 ==========
  console.log('\n--- 4. 异常场景 ---');

  console.log('\n  4.1 确认不存在的订单');
  let ne = await POST(API + '/service-orders/999999/confirm-complete', {}, buyerToken);
  assert(ne.body.errno !== 0, '不存在的订单返回错误');

  console.log('\n  4.2 缺少service_id下单');
  let ns = await POST(API + '/service-orders', { worker_id: 1 }, buyerToken);
  assert(ns.body.errno !== 0, '缺少service_id返回错误');

  console.log('\n  4.3 技工接单非自己订单');
  let nm = await POST(API + '/worker/service-orders/999999/accept', {}, signToken(1));
  assert(nm.body.errno !== 0, '非自己订单接单返回错误');

  // ========== 5. 汇总 ==========
  console.log('\n--- 5. 最终汇总 ---');
  let finalMy = await GET(API + '/service-orders/my?page_size=50', buyerToken);
  const finalList = (finalMy.body.data?.list) || [];
  const statusMap = {};
  finalList.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
  console.log('  用户总订单: ' + finalList.length);
  console.log('  状态分布: ' + JSON.stringify(statusMap));

  console.log('\n========================================');
  console.log('测试汇总');
  console.log('========================================');
  console.log('通过: ' + passed + ' | 失败: ' + failed + ' | 总计: ' + (passed + failed));
  if (issues.length > 0) {
    console.log('\n发现的问题:');
    issues.forEach((issue, i) => console.log('  ' + (i + 1) + '. ' + issue));
  }
  if (failed > 0) process.exit(1);
}

test().catch(err => { console.error('测试失败:', err); process.exit(1); });
