/**
 * 全链路业务功能测试脚本
 * 测试所有角色和业务流程
 */

const http = require('http');

const BASE = 'https://jshsp1.eds-tech.cn';
const API = '/api/v1';
const TOKENS = { user: '', merchant: '', worker: '', admin: '' };
const RESULTS = { pass: 0, fail: 0, warn: 0, err: [] };

function report(name, status, msg) {
  const c = status === 'PASS' ? '32' : status === 'FAIL' ? '31' : status === 'WARN' ? '33' : '36';
  console.log(`\x1b[${c}m[${status}] ${name}: ${msg}\x1b[0m`);
  if (status === 'PASS') RESULTS.pass++;
  else if (status === 'FAIL') { RESULTS.fail++; RESULTS.err.push({ t: name, e: msg }); }
  else if (status === 'WARN') RESULTS.warn++;
}

function api(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, BASE);
    const o = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    if (token) o.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(o, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk });
      res.on('end', () => {
        try { resolve({ s: res.statusCode, d: data ? JSON.parse(data) : {}, r: data }) }
        catch (e) { resolve({ s: res.statusCode, d: {}, r: data }) }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('\n========================================');
  console.log('社区小程序 - 全链路业务功能测试');
  console.log('测试时间:', new Date().toLocaleString());
  console.log('========================================\n');

  // ===== 1. 公共接口 =====
  console.log('\n[1] 公共接口测试');
  console.log('------------------------');

  let res = await api('GET', '/');
  report('健康检查', res.s === 200 ? 'PASS' : 'FAIL', res.d.message);

  res = await api('GET', `${API}/core/banners`);
  report('轮播图', res.s === 200 ? 'PASS' : 'FAIL', `${res.s} - ${JSON.stringify(res.d).slice(0, 80)}`);

  res = await api('GET', `${API}/core/categories`);
  report('服务分类', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个分类`);

  res = await api('GET', `${API}/core/services/hot`);
  report('热门服务', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个服务`);

  res = await api('GET', `${API}/market/shops`);
  const shopList = res.d.data?.list || res.d.list || [];
  report('店铺列表', res.s === 200 && shopList.length > 0 ? 'PASS' : 'WARN', `${shopList.length}个店铺`);

  res = await api('GET', `${API}/posts`);
  report('帖子列表', res.s === 200 ? 'PASS' : 'FAIL', `total:${res.d.total || 0}`);

  res = await api('GET', `${API}/benefit/display`);
  report('惠民卡', res.s === 200 ? 'PASS' : 'FAIL', JSON.stringify(res.d).slice(0, 80));

  // ===== 2. 用户登录 =====
  console.log('\n[2] 用户认证');
  console.log('------------------------');

  // 使用真实微信code才能登录，这里使用模拟code会失败
  // 在实际环境中需要通过微信小程序获取code
  res = await api('POST', `${API}/auth/login`, { code: 'test_user_code_13800138000', nickname: '测试用户', phone: '13800138000' });
  if (res.s === 200 && res.d.token) {
    TOKENS.user = res.d.token;
    report('用户登录(微信code)', 'PASS', `Token: ${TOKENS.user.slice(0, 20)}...`);
  } else if (res.d.errno === 0 && res.d.data && res.d.data.token) {
    TOKENS.user = res.d.data.token;
    report('用户登录(微信code)', 'PASS', `Token: ${TOKENS.user.slice(0, 20)}...`);
  } else report('用户登录(微信code)', 'WARN', `需要真实微信code - ${res.s}`);

  if (TOKENS.user) {
    res = await api('GET', `${API}/user/profile`, null, TOKENS.user);
    report('用户信息', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.nickname || res.d.name || '未知'}`);
  }

  // ===== 3. 商家登录 =====
  console.log('\n[3] 商家认证');
  console.log('------------------------');

  res = await api('POST', `${API}/merchant-portal/login`, { username: 'merchant_test', password: 'merchant123' });
  if (res.s === 200 && res.d.data && res.d.data.token) {
    TOKENS.merchant = res.d.data.token;
    report('商家登录', 'PASS', '成功');
  } else if (res.s === 200 && res.d.token) {
    TOKENS.merchant = res.d.token;
    report('商家登录', 'PASS', '成功');
  } else report('商家登录', 'FAIL', `${res.s} - ${res.r.slice(0, 150)}`);

  if (TOKENS.merchant) {
    res = await api('GET', `${API}/market/merchant/dashboard`, null, TOKENS.merchant);
    report('商家Dashboard', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.d.msg || res.d.errmsg || 'ok'}`);

    res = await api('GET', `${API}/market/merchant/goods`, null, TOKENS.merchant);
    const merchantGoods = res.d.data?.list || res.d.list || res.d || [];
    report('商家商品', res.s === 200 ? 'PASS' : 'FAIL', `${Array.isArray(merchantGoods) ? merchantGoods.length : 0}个商品`);

    res = await api('GET', `${API}/market/merchant/orders`, null, TOKENS.merchant);
    const merchantOrders = res.d.data?.list || res.d.list || res.d || [];
    report('商家订单', res.s === 200 ? 'PASS' : 'FAIL', `${Array.isArray(merchantOrders) ? merchantOrders.length : 0}个订单`);

    // 测试商家接单
    if (merchantOrders.length > 0) {
      const pendingOrder = merchantOrders.find(o => o.order_status === 'pending_accept');
      if (pendingOrder) {
        res = await api('POST', `${API}/market/merchant/orders/${pendingOrder.order_no}/action`,
          { action: 'accept' }, TOKENS.merchant);
        report('商家接单', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.d.msg || res.d.errmsg || 'ok'}`);

        // 测试商家发货
        res = await api('POST', `${API}/market/merchant/orders/${pendingOrder.order_no}/action`,
          { action: 'ship' }, TOKENS.merchant);
        report('商家发货', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.d.msg || res.d.errmsg || 'ok'}`);
      }
    }
  }

  // ===== 4. 技工登录 =====
  console.log('\n[4] 技工认证');
  console.log('------------------------');

  res = await api('POST', `${API}/worker-portal/login`, { phone: '13800138002', code: '123456' });
  if (res.s === 200 && res.d.data && res.d.data.token) {
    TOKENS.worker = res.d.data.token;
    report('技工登录(验证码)', 'PASS', '成功');
  } else if (res.s === 200 && res.d.token) {
    TOKENS.worker = res.d.token;
    report('技工登录(验证码)', 'PASS', '成功');
  } else report('技工登录(验证码)', 'FAIL', `${res.s} - ${res.r.slice(0, 150)}`);

  if (TOKENS.worker) {
    res = await api('GET', `${API}/worker/service-orders`, null, TOKENS.worker);
    const workerOrders = res.d.data || res.d || [];
    report('技工订单列表', res.s === 200 ? 'PASS' : 'FAIL', `${Array.isArray(workerOrders) ? workerOrders.length : 0}个订单`);

    // 测试技工接单
    if (Array.isArray(workerOrders) && workerOrders.length > 0) {
      const pendingServiceOrder = workerOrders.find(o => o.status === 'pending_accept');
      if (pendingServiceOrder) {
        report('发现待接单服务订单', 'INFO', `订单号: ${pendingServiceOrder.order_no}`);

        res = await api('POST', `${API}/worker/service-orders/${pendingServiceOrder.id}/accept`, null, TOKENS.worker);
        report('技工接单', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.d.msg || res.d.errmsg || 'ok'}`);

        res = await api('POST', `${API}/worker/service-orders/${pendingServiceOrder.id}/check-in`, null, TOKENS.worker);
        report('技工打卡', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.d.msg || res.d.errmsg || 'ok'}`);

        res = await api('POST', `${API}/worker/service-orders/${pendingServiceOrder.id}/complete`, null, TOKENS.worker);
        report('技工完成', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.d.msg || res.d.errmsg || 'ok'}`);
      }
    }
  }

  // ===== 5. 管理员登录 =====
  console.log('\n[5] 管理员认证');
  console.log('------------------------');

  res = await api('POST', `${API}/auth/admin/login`, { username: 'wsxCDE', password: 'k*#D=4Od4xBd--9' });
  if (res.s === 200 && res.d.data && res.d.data.token) {
    TOKENS.admin = res.d.data.token;
    report('管理员登录', 'PASS', '成功');
  } else report('管理员登录', 'FAIL', `${res.s} - ${res.r.slice(0, 150)}`);

  if (TOKENS.admin) {
    res = await api('GET', `${API}/admin/market-orders`, null, TOKENS.admin);
    report('管理员订单', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.total || res.d.length || 0}个订单`);

    res = await api('GET', `${API}/admin/refunds`, null, TOKENS.admin);
    report('管理员退款', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个退款`);
  }

  // ===== 6. 完整下单流程 =====
  console.log('\n[6] 下单流程 (用户到商家到支付)');
  console.log('------------------------');

  if (!TOKENS.user) { report('下单流程', 'WARN', '用户未登录'); }
  else {
    res = await api('GET', `${API}/market/goods/1`);
    const goods = res.d.data || res.d;
    if (res.s === 200 && goods) {
      report('商品详情', 'PASS', `${goods.name || '未知'} - ¥${goods.price}`);
    } else {
      report('商品详情', 'FAIL', '商品不存在');
    }

    res = await api('POST', `${API}/market/cart/items`, { goods_id: 1, quantity: 2, sku_id: null }, TOKENS.user);
    report('加购物车', (res.s === 200 || res.s === 201) ? 'PASS' : 'FAIL', `${res.s}`);

    res = await api('GET', `${API}/market/cart`, null, TOKENS.user);
    report('查购物车', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}件商品`);

    res = await api('POST', `${API}/market/orders/preview`, { items: [{ goods_id: 1, quantity: 1 }] }, TOKENS.user);
    report('订单预览', res.s === 200 ? 'PASS' : 'FAIL', JSON.stringify(res.d).slice(0, 100));

    res = await api('POST', `${API}/market/orders`, {
      items: [{ goods_id: 1, quantity: 1 }],
      address_id: 1,
      remark: '全链路测试订单'
    }, TOKENS.user);

    if (res.s === 200 || res.s === 201) {
      const orderNo = res.d.order_no || res.d.orderNo;
      report('创建订单', 'PASS', `订单号: ${orderNo}`);

      res = await api('GET', `${API}/market/orders`, null, TOKENS.user);
      report('用户订单列表', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个订单`);

      if (TOKENS.merchant && orderNo) {
        res = await api('POST', `${API}/market/merchant/orders/${orderNo}/action`,
          { action: 'accept' }, TOKENS.merchant);
        report('商家接单', res.s === 200 ? 'PASS' : 'FAIL', `${res.s} - ${res.r.slice(0, 100)}`);

        res = await api('POST', `${API}/market/merchant/orders/${orderNo}/action`,
          { action: 'ship' }, TOKENS.merchant);
        report('商家发货', res.s === 200 ? 'PASS' : 'FAIL', `${res.s} - ${res.r.slice(0, 100)}`);
      }

      res = await api('POST', `${API}/market/payments/mock-success`, { order_no: orderNo }, TOKENS.user);
      report('模拟支付', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);

      if (orderNo) {
        res = await api('POST', `${API}/market/orders/${orderNo}/confirm-receipt`, null, TOKENS.user);
        report('确认收货', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);
      }
    } else {
      report('创建订单', 'FAIL', `${res.s} - ${res.r.slice(0, 200)}`);
    }
  }

  // ===== 7. 退单退款流程 =====
  console.log('\n[7] 退单退款流程 (用户到商家到管理员)');
  console.log('------------------------');

  if (TOKENS.user) {
    res = await api('POST', `${API}/market/orders`, {
      items: [{ goods_id: 1, quantity: 1 }],
      address_id: 1,
      remark: '退款测试订单'
    }, TOKENS.user);

    if (res.s === 200 || res.s === 201) {
      const refundOrderNo = res.d.order_no || res.d.orderNo;
      report('创建退款订单', 'PASS', `订单号: ${refundOrderNo}`);

      res = await api('POST', `${API}/market/orders/${refundOrderNo}/refund`,
        { reason: '测试退款', amount: 10 }, TOKENS.user);
      report('申请退款', res.s === 200 ? 'PASS' : 'FAIL', `${res.s} - ${res.r.slice(0, 100)}`);

      if (TOKENS.merchant) {
        res = await api('GET', `${API}/market/merchant/refunds`, null, TOKENS.merchant);
        report('商家退款列表', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个退款`);
      }

      if (TOKENS.admin) {
        res = await api('GET', `${API}/admin/refunds`, null, TOKENS.admin);
        report('管理员退款审核', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个待审核`);
      }
    }
  }

  // ===== 8. 社区功能 =====
  console.log('\n[8] 社区互动流程');
  console.log('------------------------');

  if (TOKENS.user) {
    res = await api('POST', `${API}/posts`, {
      content: '全链路测试帖子',
      category: '邻里互动',
      images: []
    }, TOKENS.user);

    if (res.s === 200 || res.s === 201) {
      const postId = res.d.id;
      report('发布帖子', 'PASS', `帖子ID: ${postId}`);

      res = await api('POST', `${API}/posts/${postId}/like`, null, TOKENS.user);
      report('点赞帖子', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);

      res = await api('POST', `${API}/posts/${postId}/like`, null, TOKENS.user);
      report('取消点赞', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);

      res = await api('POST', `${API}/posts/${postId}/comment`, { content: '测试评论' }, TOKENS.user);
      report('发表评论', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);
    } else {
      report('发布帖子', 'FAIL', `${res.s} - ${res.r.slice(0, 150)}`);
    }
  }

  // ===== 9. 服务订单流程 =====
  console.log('\n[9] 服务订单流程 (用户到服务商到技工)');
  console.log('------------------------');

  if (TOKENS.user) {
    res = await api('POST', `${API}/service-orders`, {
      service_id: 1,
      description: '测试服务订单',
      address: '测试地址'
    }, TOKENS.user);
    report('创建服务订单', res.s === 200 || res.s === 201 ? 'PASS' : 'FAIL', `${res.s} - ${res.r.slice(0, 100)}`);
  }

  if (TOKENS.worker) {
    res = await api('GET', `${API}/worker/service-orders`, null, TOKENS.worker);
    if (res.s === 200 && res.d && res.d.length > 0) {
      const serviceOrderId = res.d[0].id;
      report('技工查看订单', 'PASS', `${res.d.length}个订单`);

      res = await api('POST', `${API}/worker/service-orders/${serviceOrderId}/accept`, null, TOKENS.worker);
      report('技工接单', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);

      res = await api('POST', `${API}/worker/service-orders/${serviceOrderId}/check-in`, null, TOKENS.worker);
      report('技工打卡', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);

      res = await api('POST', `${API}/worker/service-orders/${serviceOrderId}/complete`, null, TOKENS.worker);
      report('技工完成', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);
    } else {
      report('技工订单', 'WARN', '无订单可测试');
    }
  }

  // ===== 10. 邻里帮帮 =====
  console.log('\n[10] 邻里帮帮功能');
  console.log('------------------------');

  res = await api('GET', `${API}/neighbor-assist/orders/public`);
  report('公开帮帮订单', res.s === 200 ? 'PASS' : 'WARN', `${res.s} - ${res.s === 401 ? '需登录' : ''}`);

  // 测试帮帮订单（用技工token）
  if (TOKENS.worker) {
    res = await api('GET', `${API}/neighbor-assist/orders/public`, null, TOKENS.worker);
    if (res.s === 200) {
      const assistList = res.d.data || res.d.list || res.d || [];
      report('帮帮订单列表(技工视角)', 'PASS', `${Array.isArray(assistList) ? assistList.length : 0}个订单`);
    }
  }

  // ===== 11. 消息功能 =====
  console.log('\n[11] 消息聊天功能');
  console.log('------------------------');

  if (TOKENS.user) {
    res = await api('GET', `${API}/messages/conversations`, null, TOKENS.user);
    report('会话列表', res.s === 200 ? 'PASS' : 'FAIL', `${res.d.length || 0}个会话`);
  }

  // ===== 12. 搜索功能 =====
  console.log('\n[12] 搜索功能');
  console.log('------------------------');

  res = await api('GET', `${API}/market/search?q=测试`);
  report('商品搜索', res.s === 200 ? 'PASS' : 'FAIL', `${res.s}`);

  // ===== 总结 =====
  console.log('\n========================================');
  console.log('测试结果汇总');
  console.log('========================================');
  console.log(`通过: ${RESULTS.pass}`);
  console.log(`失败: ${RESULTS.fail}`);
  console.log(`警告: ${RESULTS.warn}`);
  console.log(`通过率: ${(RESULTS.pass / (RESULTS.pass + RESULTS.fail) * 100).toFixed(1)}%`);

  if (RESULTS.err.length > 0) {
    console.log('\n失败详情:');
    RESULTS.err.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.t}: ${e.e}`);
    });
  }

  console.log('\n测试完成!\n');
}

test().catch(e => {
  console.error('测试异常:', e);
  process.exit(1);
});
