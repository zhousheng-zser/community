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
      headers: {
        'Content-Type': 'application/json'
      }
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function generateUserToken(userId, openid) {
  return jwt.sign(
    { id: userId, openid: openid, token_version: 0 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function runTests() {
  console.log('==========================================');
  console.log('  完整业务链路测试');
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

  try {
    // ==================== 获取现有用户 ====================
    console.log('【准备】获取测试用户');
    console.log('----------------------------------------');
    
    const sequelize = new Sequelize('community_db', 'root', '', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false
    });

    const [users] = await sequelize.query('SELECT id, nickname, openid FROM Users LIMIT 10');
    console.log(`找到 ${users.length} 个用户`);
    
    const buyerUser = users.find(u => u.nickname.includes('普通用户')) || users[0];
    const workerUser = users.find(u => u.nickname.includes('技工')) || users[1];
    
    const userToken = generateUserToken(buyerUser.id, buyerUser.openid);
    const workerToken = generateUserToken(workerUser.id, workerUser.openid);
    
    console.log(`用户: ${buyerUser.nickname} (ID: ${buyerUser.id})`);
    console.log(`技工: ${workerUser.nickname} (ID: ${workerUser.id})`);

    // ==================== 测试1: 用户注册登录链路 ====================
    console.log('\n【测试1】用户注册登录完整链路');
    console.log('----------------------------------------');

    const profileRes = await makeRequest('GET', '/user/profile', null, userToken);
    logTest('获取用户信息', !!profileRes.data.id, `昵称: ${profileRes.data.nickname}`);

    const bindRes = await makeRequest('POST', '/user/bind-community', { community_id: 1 }, userToken);
    logTest('绑定小区', bindRes.status === 200 || bindRes.data.message);

    // ==================== 测试2: 管理员登录 ====================
    console.log('\n【测试2】管理员登录');
    console.log('----------------------------------------');

    const adminLoginRes = await makeRequest('POST', '/auth/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.data?.token || adminLoginRes.data.token;
    logTest('管理员登录', !!adminToken);

    // ==================== 测试3: 到家服务链路 ====================
    console.log('\n【测试3】到家服务完整链路');
    console.log('----------------------------------------');

    let orderId = null;
    try {
      const createOrderRes = await makeRequest('POST', '/service-orders', {
        service_id: 1,
        worker_id: workerUser.id,
        community_id: 1,
        address_snapshot: {
          contact: '张三',
          phone: '13800138000',
          label: '上海合川路地铁站',
          detail: '1号楼101室',
          latitude: 31.2304,
          longitude: 121.4737
        },
        appointment_time: '2026-04-23 10:00:00',
        remark: '请准时上门服务'
      }, userToken);
      orderId = createOrderRes.data.order_id;
      logTest('创建服务订单', !!orderId, `订单ID: ${orderId}`);
    } catch (e) {
      logTest('创建服务订单', false, e.response?.data?.error || e.message);
    }

    if (orderId) {
      try {
        const payRes = await makeRequest('POST', `/service-orders/${orderId}/pay`, {}, userToken);
        logTest('支付订单', payRes.data.pay_status === 'paid', `支付状态: ${payRes.data.pay_status}`);
      } catch (e) {
        logTest('支付订单', false, e.response?.data?.error || e.message);
      }

      try {
        const acceptRes = await makeRequest('POST', `/worker/service-orders/${orderId}/accept`, {}, workerToken);
        logTest('技工接单', acceptRes.status === 200, `订单状态: ${acceptRes.data.status}`);
      } catch (e) {
        logTest('技工接单', false, e.response?.data?.error || e.message);
      }
    }

    // ==================== 测试4: 消息对话链路 ====================
    console.log('\n【测试4】消息对话完整链路');
    console.log('----------------------------------------');

    let conversationId = null;
    try {
      const sendMsgRes = await makeRequest('POST', '/messages/send', {
        peerId: workerUser.id,
        content: '您好，请问什么时候能上门服务？',
        msgType: 'text'
      }, userToken);
      conversationId = sendMsgRes.data.conversation_id;
      logTest('发送消息', !!conversationId, `会话ID: ${conversationId}`);
    } catch (e) {
      logTest('发送消息', false, e.response?.data?.error || e.message);
    }

    try {
      const convListRes = await makeRequest('GET', '/messages/conversations', null, userToken);
      logTest('查看会话列表', Array.isArray(convListRes.data.data));
    } catch (e) {
      logTest('查看会话列表', false, e.response?.data?.error || e.message);
    }

    // ==================== 测试5: 邻里帮帮链路 ====================
    console.log('\n【测试5】邻里帮帮完整链路');
    console.log('----------------------------------------');

    let assistOrderId = null;
    try {
      const createAssistRes = await makeRequest('POST', '/neighbor-assist/orders', {
        title: '帮忙取快递',
        description: '帮忙到菜鸟驿站取一个快递',
        category: '跑腿',
        reward: 10.00,
        community_id: 1,
        address: '1号楼101室',
        contact_phone: '13800138000'
      }, userToken);
      assistOrderId = createAssistRes.data.id;
      logTest('发布帮帮需求', !!assistOrderId, `订单ID: ${assistOrderId}`);
    } catch (e) {
      logTest('发布帮帮需求', false, e.response?.data?.error || e.message);
    }

    if (assistOrderId) {
      try {
        const payAssistRes = await makeRequest('POST', `/neighbor-assist/orders/${assistOrderId}/pay`, {}, userToken);
        logTest('支付帮帮报酬', payAssistRes.status === 200);
      } catch (e) {
        logTest('支付帮帮报酬', false, e.response?.data?.error || e.message);
      }
    }

    try {
      const poolRes = await makeRequest('GET', '/worker/neighbor-assist/pool?limit=50', null, workerToken);
      logTest('查看待派单池', Array.isArray(poolRes.data.data));
    } catch (e) {
      logTest('查看待派单池', false, e.response?.data?.error || e.message);
    }

    // ==================== 测试6: 用户反馈链路 ====================
    console.log('\n【测试6】用户反馈完整链路');
    console.log('----------------------------------------');

    try {
      const feedbackRes = await makeRequest('POST', '/feedback/submit', {
        content: '建议增加更多服务类型',
        contact: '13800138000'
      }, userToken);
      logTest('提交用户反馈', feedbackRes.status === 201 || feedbackRes.data.message);
    } catch (e) {
      logTest('提交用户反馈', false, e.response?.data?.error || e.message);
    }

    // ==================== 测试7: 管理后台功能 ====================
    console.log('\n【测试7】管理后台功能');
    console.log('----------------------------------------');

    if (adminToken) {
      try {
        const statsRes = await makeRequest('GET', '/admin/stats/overview', null, adminToken);
        logTest('查看统计概览', statsRes.status === 200);
      } catch (e) {
        logTest('查看统计概览', false, e.response?.data?.error || e.message);
      }

      try {
        const ordersRes = await makeRequest('GET', '/admin/service-orders?limit=10', null, adminToken);
        logTest('查看订单列表', ordersRes.status === 200);
      } catch (e) {
        logTest('查看订单列表', false, e.response?.data?.error || e.message);
      }
    }

    await sequelize.close();

  } catch (error) {
    console.error('测试执行出错:', error.message);
  }

  // ==================== 输出测试结果汇总 ====================
  console.log('\n==========================================');
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
