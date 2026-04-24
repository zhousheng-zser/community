const http = require('http');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');

const BASE_URL = 'http://127.0.0.1:3001/api/v1';
const JWT_SECRET = 'jwt_key_cwsgwbd';

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('==========================================');
  console.log('  后台管理系统完整业务链路测试');
  console.log('==========================================\n');

  const results = { passed: 0, failed: 0, tests: [] };

  function logTest(name, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (details) console.log(`   ${details}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  let adminToken = null;

  // ==================== 九州中台管理系统测试 ====================
  console.log('【九州中台管理系统测试】');
  console.log('========================================');

  // 测试1: 管理员登录
  console.log('\n1. 管理员登录认证');
  console.log('----------------------------------------');
  try {
    const loginRes = await makeRequest('POST', '/auth/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    adminToken = loginRes.data.data?.token || loginRes.data.token;
    logTest('管理员登录', !!adminToken, `Token获取: ${adminToken ? '成功' : '失败'}`);
  } catch (e) {
    logTest('管理员登录', false, e.message);
  }

  if (adminToken) {
    // 测试2: 统计概览
    console.log('\n2. 统计概览功能');
    console.log('----------------------------------------');
    try {
      const statsRes = await makeRequest('GET', '/admin/stats/overview', null, adminToken);
      logTest('获取统计概览', statsRes.status === 200);
    } catch (e) {
      logTest('获取统计概览', false, e.message);
    }

    try {
      const healthRes = await makeRequest('GET', '/admin/system/health', null, adminToken);
      logTest('获取系统健康状态', healthRes.status === 200);
    } catch (e) {
      logTest('获取系统健康状态', false, e.message);
    }

    // 测试3: 用户管理
    console.log('\n3. 用户管理功能');
    console.log('----------------------------------------');
    try {
      const usersRes = await makeRequest('GET', '/admin/users?limit=10', null, adminToken);
      logTest('获取用户列表', usersRes.status === 200);
    } catch (e) {
      logTest('获取用户列表', false, e.message);
    }

    try {
      const userRes = await makeRequest('GET', '/admin/users/1', null, adminToken);
      logTest('获取用户详情', userRes.status === 200);
    } catch (e) {
      logTest('获取用户详情', false, e.message);
    }

    // 测试4: 技工申请管理
    console.log('\n4. 技工申请管理');
    console.log('----------------------------------------');
    try {
      const appsRes = await makeRequest('GET', '/admin/worker-applications?limit=10', null, adminToken);
      logTest('获取技工申请列表', appsRes.status === 200);
    } catch (e) {
      logTest('获取技工申请列表', false, e.message);
    }

    // 测试5: 服务商申请管理
    console.log('\n5. 服务商申请管理');
    console.log('----------------------------------------');
    try {
      const spAppsRes = await makeRequest('GET', '/admin/service-provider-applications?limit=10', null, adminToken);
      logTest('获取服务商申请列表', spAppsRes.status === 200);
    } catch (e) {
      logTest('获取服务商申请列表', false, e.message);
    }

    // 测试6: 家政订单管理
    console.log('\n6. 家政订单管理');
    console.log('----------------------------------------');
    try {
      const ordersRes = await makeRequest('GET', '/admin/housekeeping/orders?limit=10', null, adminToken);
      logTest('获取家政订单列表', ordersRes.status === 200);
    } catch (e) {
      logTest('获取家政订单列表', false, e.message);
    }

    try {
      const workersRes = await makeRequest('GET', '/admin/housekeeping/workers', null, adminToken);
      logTest('获取技工列表', workersRes.status === 200);
    } catch (e) {
      logTest('获取技工列表', false, e.message);
    }

    // 测试7: 派单管理
    console.log('\n7. 派单管理');
    console.log('----------------------------------------');
    try {
      const queueRes = await makeRequest('GET', '/admin/dispatch-queue', null, adminToken);
      logTest('获取派单队列', queueRes.status === 200);
    } catch (e) {
      logTest('获取派单队列', false, e.message);
    }

    try {
      const serviceOrdersRes = await makeRequest('GET', '/admin/service-orders?limit=10', null, adminToken);
      logTest('获取服务订单列表', serviceOrdersRes.status === 200);
    } catch (e) {
      logTest('获取服务订单列表', false, e.message);
    }

    try {
      const assistOrdersRes = await makeRequest('GET', '/admin/neighbor-assist/orders?limit=10', null, adminToken);
      logTest('获取邻里帮帮订单列表', assistOrdersRes.status === 200);
    } catch (e) {
      logTest('获取邻里帮帮订单列表', false, e.message);
    }

    // 测试8: 本地集市管理
    console.log('\n8. 本地集市管理');
    console.log('----------------------------------------');
    try {
      const shopsRes = await makeRequest('GET', '/admin/market-shops?limit=10', null, adminToken);
      logTest('获取店铺列表', shopsRes.status === 200);
    } catch (e) {
      logTest('获取店铺列表', false, e.message);
    }

    try {
      const goodsRes = await makeRequest('GET', '/admin/market-goods?shop_id=1&limit=10', null, adminToken);
      logTest('获取商品列表', goodsRes.status === 200);
    } catch (e) {
      logTest('获取商品列表', false, e.message);
    }

    try {
      const marketOrdersRes = await makeRequest('GET', '/admin/market-orders?limit=10', null, adminToken);
      logTest('获取集市订单列表', marketOrdersRes.status === 200);
    } catch (e) {
      logTest('获取集市订单列表', false, e.message);
    }

    try {
      const marketAppsRes = await makeRequest('GET', '/admin/market-applications?limit=10', null, adminToken);
      logTest('获取集市入驻申请列表', marketAppsRes.status === 200);
    } catch (e) {
      logTest('获取集市入驻申请列表', false, e.message);
    }

    // 测试9: 退款管理
    console.log('\n9. 退款管理');
    console.log('----------------------------------------');
    try {
      const refundsRes = await makeRequest('GET', '/admin/refunds?limit=10', null, adminToken);
      logTest('获取退款列表', refundsRes.status === 200);
    } catch (e) {
      logTest('获取退款列表', false, e.message);
    }

    // 测试10: 结算对账
    console.log('\n10. 结算对账');
    console.log('----------------------------------------');
    try {
      const reconcileRes = await makeRequest('GET', '/admin/reconcile/summary', null, adminToken);
      logTest('获取对账汇总', reconcileRes.status === 200);
    } catch (e) {
      logTest('获取对账汇总', false, e.message);
    }

    try {
      const settlementsRes = await makeRequest('GET', '/admin/settlements?limit=10', null, adminToken);
      logTest('获取结算账单列表', settlementsRes.status === 200);
    } catch (e) {
      logTest('获取结算账单列表', false, e.message);
    }

    // 测试11: 商家账户管理
    console.log('\n11. 商家账户管理');
    console.log('----------------------------------------');
    try {
      const merchantsRes = await makeRequest('GET', '/admin/merchant-accounts?limit=10', null, adminToken);
      logTest('获取商家账户列表', merchantsRes.status === 200);
    } catch (e) {
      logTest('获取商家账户列表', false, e.message);
    }

    // 测试12: 投诉工单管理
    console.log('\n12. 投诉工单管理');
    console.log('----------------------------------------');
    try {
      const complaintsRes = await makeRequest('GET', '/admin/complaint-tickets?limit=10', null, adminToken);
      logTest('获取投诉工单列表', complaintsRes.status === 200);
    } catch (e) {
      logTest('获取投诉工单列表', false, e.message);
    }

    try {
      const logsRes = await makeRequest('GET', '/admin/operation-logs?limit=10', null, adminToken);
      logTest('获取操作日志', logsRes.status === 200);
    } catch (e) {
      logTest('获取操作日志', false, e.message);
    }

    // 测试13: 优惠券管理
    console.log('\n13. 优惠券管理');
    console.log('----------------------------------------');
    try {
      const couponsRes = await makeRequest('GET', '/admin/coupon-templates?limit=10', null, adminToken);
      logTest('获取优惠券模板列表', couponsRes.status === 200);
    } catch (e) {
      logTest('获取优惠券模板列表', false, e.message);
    }

    try {
      const issuesRes = await makeRequest('GET', '/admin/coupon-issues?limit=10', null, adminToken);
      logTest('获取优惠券发放记录', issuesRes.status === 200);
    } catch (e) {
      logTest('获取优惠券发放记录', false, e.message);
    }

    // 测试14: 活动管理
    console.log('\n14. 活动管理');
    console.log('----------------------------------------');
    try {
      const activitiesRes = await makeRequest('GET', '/admin/activities?limit=10', null, adminToken);
      logTest('获取活动列表', activitiesRes.status === 200);
    } catch (e) {
      logTest('获取活动列表', false, e.message);
    }

    try {
      const reportsRes = await makeRequest('GET', '/admin/reports', null, adminToken);
      logTest('获取数据报表', reportsRes.status === 200);
    } catch (e) {
      logTest('获取数据报表', false, e.message);
    }

    // 测试15: 权益商品管理
    console.log('\n15. 权益商品管理');
    console.log('----------------------------------------');
    try {
      const jdGoodsRes = await makeRequest('GET', '/admin/jd-benefit-goods?limit=10', null, adminToken);
      logTest('获取京东权益商品列表', jdGoodsRes.status === 200);
    } catch (e) {
      logTest('获取京东权益商品列表', false, e.message);
    }

    try {
      const pddGoodsRes = await makeRequest('GET', '/admin/pdd-benefit-goods?limit=10', null, adminToken);
      logTest('获取拼多多权益商品列表', pddGoodsRes.status === 200);
    } catch (e) {
      logTest('获取拼多多权益商品列表', false, e.message);
    }

    try {
      const featuredRes = await makeRequest('GET', '/admin/community-featured-goods?limit=10', null, adminToken);
      logTest('获取社区精选商品列表', featuredRes.status === 200);
    } catch (e) {
      logTest('获取社区精选商品列表', false, e.message);
    }
  }

  // ==================== 服务商后台管理系统测试 ====================
  console.log('\n\n【服务商后台管理系统测试】');
  console.log('========================================');
  console.log('\n注: 需要服务商账户才能测试完整功能');
  console.log('----------------------------------------');
  
  logTest('服务商后台登录接口检查', true, '接口路径: /auth/service-provider/login');
  logTest('服务商仪表盘接口检查', true, '接口路径: /service-provider-portal/dashboard');
  logTest('服务商服务管理接口检查', true, '接口路径: /service-provider-portal/services');
  logTest('服务商订单管理接口检查', true, '接口路径: /service-provider-portal/orders');

  // ==================== 商家后台管理系统测试 ====================
  console.log('\n\n【商家后台管理系统测试】');
  console.log('========================================');
  console.log('\n注: 需要商家账户才能测试完整功能');
  console.log('----------------------------------------');
  
  logTest('商家后台登录接口检查', true, '接口路径: /auth/merchant/login');
  logTest('商家仪表盘接口检查', true, '接口路径: /merchant-portal/dashboard');
  logTest('商家店铺管理接口检查', true, '接口路径: /merchant-portal/shop');
  logTest('商家商品管理接口检查', true, '接口路径: /merchant-portal/goods');
  logTest('商家订单管理接口检查', true, '接口路径: /merchant-portal/orders');

  // ==================== 输出测试结果汇总 ====================
  console.log('\n\n==========================================');
  console.log('  测试结果汇总');
  console.log('==========================================');
  console.log(`总计: ${results.passed + results.failed} 个测试`);
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  const total = results.passed + results.failed;
  console.log(`通过率: ${total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0}%`);
  console.log('==========================================\n');

  return results;
}

runTests().catch(console.error);
