/**
 * 全面业务功能测试脚本
 * 测试角色: 普通用户、商家、技工、服务商、管理员
 * 测试场景: 完整订单流程、退单退款、管理员介入、社区互动、服务订单
 */

const http = require('http');

const BASE_URL = 'http://8.136.29.208:3001';
const API_PREFIX = '/api/v1';

// 测试数据存储
const testData = {
  userToken: null,
  merchantToken: null,
  workerToken: null,
  adminToken: null,
  orderId: null,
  orderNo: null,
  postId: null,
  serviceOrderId: null
};

// 测试结果统计
const testResults = {
  pass: 0,
  fail: 0,
  warn: 0,
  errors: []
};

function writeTestResult(testName, status, message) {
  const colors = {
    PASS: '\x1b[32m',
    FAIL: '\x1b[31m',
    WARN: '\x1b[33m',
    INFO: '\x1b[36m'
  };
  const reset = '\x1b[0m';
  const color = colors[status] || reset;
  console.log(`${color}[${status}] ${testName}: ${message}${reset}`);

  if (status === 'PASS') testResults.pass++;
  else if (status === 'FAIL') {
    testResults.fail++;
    testResults.errors.push({ test: testName, error: message });
  }
  else if (status === 'WARN') testResults.warn++;
}

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: result,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: {},
            raw: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ========================================
// 测试 1: 基础接口测试（无需登录）
// ========================================
async function testBasicEndpoints() {
  console.log('\n========================================');
  console.log('测试 1: 基础接口测试（公共接口）');
  console.log('========================================\n');

  // 1.1 健康检查
  try {
    const res = await apiRequest('GET', '/');
    writeTestResult('健康检查', res.status === 200 ? 'PASS' : 'FAIL', res.data.message || '无消息');
  } catch (e) {
    writeTestResult('健康检查', 'FAIL', e.message);
  }

  // 1.2 轮播图
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/core/banners`);
    writeTestResult('轮播图列表', res.status === 200 ? 'PASS' : 'FAIL',
      `返回 ${res.status}, 数据: ${JSON.stringify(res.data).substring(0, 100)}`);
  } catch (e) {
    writeTestResult('轮播图列表', 'FAIL', e.message);
  }

  // 1.3 服务分类
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/core/categories`);
    writeTestResult('服务分类', res.status === 200 ? 'PASS' : 'FAIL',
      `返回 ${res.data.length || 0} 个分类`);
  } catch (e) {
    writeTestResult('服务分类', 'FAIL', e.message);
  }

  // 1.4 热门服务
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/core/services/hot`);
    writeTestResult('热门服务', res.status === 200 ? 'PASS' : 'FAIL',
      `返回 ${res.data.length || 0} 个服务`);
  } catch (e) {
    writeTestResult('热门服务', 'FAIL', e.message);
  }

  // 1.5 店铺列表
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/market/shops`);
    if (res.status === 200 && res.data.list) {
      writeTestResult('店铺列表', 'PASS', `返回 ${res.data.list.length} 个店铺`);
      if (res.data.list.length > 0) {
        console.log(`  店铺示例: ${res.data.list[0].name || res.data.list[0].shop_name} (ID: ${res.data.list[0].id})`);
      }
    } else {
      writeTestResult('店铺列表', 'WARN', `返回 ${res.status}, 可能无数据`);
    }
  } catch (e) {
    writeTestResult('店铺列表', 'FAIL', e.message);
  }

  // 1.6 帖子列表
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/posts`);
    writeTestResult('帖子列表', res.status === 200 ? 'PASS' : 'FAIL',
      `返回 ${res.status}, total: ${res.data.total || 0}`);
  } catch (e) {
    writeTestResult('帖子列表', 'FAIL', e.message);
  }

  // 1.7 惠民卡展示
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/benefit/display`);
    writeTestResult('惠民卡展示', res.status === 200 ? 'PASS' : 'FAIL',
      `返回 ${JSON.stringify(res.data).substring(0, 100)}`);
  } catch (e) {
    writeTestResult('惠民卡展示', 'FAIL', e.message);
  }
}

// ========================================
// 测试 2: 用户登录与注册
// ========================================
async function testUserAuth() {
  console.log('\n========================================');
  console.log('测试 2: 用户认证测试');
  console.log('========================================\n');

  // 2.1 用户注册
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/auth/register`, {
      phone: '13800138000',
      nickname: '测试用户_全链路',
      password: 'test123456'
    });
    writeTestResult('用户注册', res.status === 200 || res.status === 201 ? 'PASS' : 'FAIL',
      `${res.status} - ${JSON.stringify(res.data).substring(0, 100)}`);
  } catch (e) {
    writeTestResult('用户注册', 'WARN', `可能已存在: ${e.message}`);
  }

  // 2.2 用户登录（账号密码）
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/auth/login`, {
      phone: '13800138000',
      password: 'test123456'
    });
    if (res.status === 200 && res.data.token) {
      testData.userToken = res.data.token;
      writeTestResult('用户登录', 'PASS', `获取Token成功, 用户: ${res.data.user?.nickname || res.data.user?.name}`);
    } else {
      writeTestResult('用户登录', 'FAIL', `无Token: ${res.raw.substring(0, 200)}`);
    }
  } catch (e) {
    writeTestResult('用户登录', 'FAIL', e.message);
  }

  // 2.3 获取用户信息
  if (testData.userToken) {
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/user/profile`, null, testData.userToken);
      writeTestResult('获取用户信息', res.status === 200 ? 'PASS' : 'FAIL',
        `用户: ${res.data.nickname || res.data.name}, 角色: ${res.data.role || 'user'}`);
    } catch (e) {
      writeTestResult('获取用户信息', 'FAIL', e.message);
    }
  }
}

// ========================================
// 测试 3: 商家登录与店铺管理
// ========================================
async function testMerchantAuth() {
  console.log('\n========================================');
  console.log('测试 3: 商家认证与店铺管理');
  console.log('========================================\n');

  // 3.1 商家登录
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/merchant-portal/login`, {
      phone: '13800138001',
      password: 'merchant123'
    });
    if (res.status === 200 && res.data.token) {
      testData.merchantToken = res.data.token;
      writeTestResult('商家登录', 'PASS', `获取Token成功`);
    } else {
      writeTestResult('商家登录', 'FAIL', `${res.status} - ${res.raw.substring(0, 200)}`);
    }
  } catch (e) {
    writeTestResult('商家登录', 'FAIL', e.message);
  }

  // 3.2 商家dashboard
  if (testData.merchantToken) {
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/market/merchant/dashboard`, null, testData.merchantToken);
      writeTestResult('商家Dashboard', res.status === 200 ? 'PASS' : 'FAIL',
        `${res.status} - ${JSON.stringify(res.data).substring(0, 150)}`);
    } catch (e) {
      writeTestResult('商家Dashboard', 'FAIL', e.message);
    }

    // 3.3 商家商品列表
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/market/merchant/goods`, null, testData.merchantToken);
      writeTestResult('商家商品列表', res.status === 200 ? 'PASS' : 'FAIL',
        `商品数: ${res.data.length || 0}`);
    } catch (e) {
      writeTestResult('商家商品列表', 'FAIL', e.message);
    }

    // 3.4 商家订单列表
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/market/merchant/orders`, null, testData.merchantToken);
      writeTestResult('商家订单列表', res.status === 200 ? 'PASS' : 'FAIL',
        `订单数: ${res.data.length || 0}`);
    } catch (e) {
      writeTestResult('商家订单列表', 'FAIL', e.message);
    }
  }
}

// ========================================
// 测试 4: 技工登录与服务订单
// ========================================
async function testWorkerAuth() {
  console.log('\n========================================');
  console.log('测试 4: 技工认证与服务订单');
  console.log('========================================\n');

  // 4.1 技工登录
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/worker-portal/login`, {
      phone: '13800138002',
      password: 'worker123'
    });
    if (res.status === 200 && res.data.token) {
      testData.workerToken = res.data.token;
      writeTestResult('技工登录', 'PASS', `获取Token成功`);
    } else {
      writeTestResult('技工登录', 'FAIL', `${res.status} - ${res.raw.substring(0, 200)}`);
    }
  } catch (e) {
    writeTestResult('技工登录', 'FAIL', e.message);
  }

  // 4.2 技工服务订单列表
  if (testData.workerToken) {
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/worker/service-orders`, null, testData.workerToken);
      writeTestResult('技工订单列表', res.status === 200 ? 'PASS' : 'FAIL',
        `订单数: ${res.data.length || 0}`);
    } catch (e) {
      writeTestResult('技工订单列表', 'FAIL', e.message);
    }
  }
}

// ========================================
// 测试 5: 管理员登录与后台管理
// ========================================
async function testAdminAuth() {
  console.log('\n========================================');
  console.log('测试 5: 管理员认证与后台管理');
  console.log('========================================\n');

  // 5.1 管理员登录
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/auth/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    if (res.status === 200 && res.data.token) {
      testData.adminToken = res.data.token;
      writeTestResult('管理员登录', 'PASS', `获取Token成功`);
    } else {
      writeTestResult('管理员登录', 'FAIL', `${res.status} - ${res.raw.substring(0, 200)}`);
    }
  } catch (e) {
    writeTestResult('管理员登录', 'FAIL', e.message);
  }

  // 5.2 管理员查看订单
  if (testData.adminToken) {
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/admin/market-orders`, null, testData.adminToken);
      writeTestResult('管理员订单列表', res.status === 200 ? 'PASS' : 'FAIL',
        `订单数: ${res.data.length || res.data.total || 0}`);
    } catch (e) {
      writeTestResult('管理员订单列表', 'FAIL', e.message);
    }

    // 5.3 管理员查看退款
    try {
      const res = await apiRequest('GET', `${API_PREFIX}/admin/refunds`, null, testData.adminToken);
      writeTestResult('管理员退款列表', res.status === 200 ? 'PASS' : 'FAIL',
        `退款数: ${res.data.length || 0}`);
    } catch (e) {
      writeTestResult('管理员退款列表', 'FAIL', e.message);
    }
  }
}

// ========================================
// 测试 6: 完整下单流程（用户→商家→支付）
// ========================================
async function testOrderFlow() {
  console.log('\n========================================');
  console.log('测试 6: 完整下单流程测试');
  console.log('========================================\n');

  if (!testData.userToken) {
    writeTestResult('下单流程', 'WARN', '用户未登录，跳过下单测试');
    return;
  }

  // 6.1 获取商品详情
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/market/goods/1`);
    if (res.status === 200 && res.data) {
      writeTestResult('商品详情', 'PASS', `商品: ${res.data.name || '未知'}, 价格: ¥${res.data.price}`);
    } else {
      writeTestResult('商品详情', 'FAIL', `商品不存在或无权限`);
      return;
    }
  } catch (e) {
    writeTestResult('商品详情', 'FAIL', e.message);
    return;
  }

  // 6.2 加入购物车
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/market/cart/items`, {
      goods_id: 1,
      quantity: 2,
      sku_id: null
    }, testData.userToken);
    writeTestResult('加入购物车', res.status === 200 || res.status === 201 ? 'PASS' : 'FAIL',
      `${res.status} - ${JSON.stringify(res.data).substring(0, 100)}`);
  } catch (e) {
    writeTestResult('加入购物车', 'FAIL', e.message);
  }

  // 6.3 查看购物车
  try {
    const res = await apiRequest('GET', `${API_PREFIX}/market/cart`, null, testData.userToken);
    writeTestResult('查看购物车', res.status === 200 ? 'PASS' : 'FAIL',
      `购物车商品数: ${res.data.length || 0}`);
  } catch (e) {
    writeTestResult('查看购物车', 'FAIL', e.message);
  }

  // 6.4 订单预览
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/market/orders/preview`, {
      items: [{ goods_id: 1, quantity: 2 }]
    }, testData.userToken);
    writeTestResult('订单预览', res.status === 200 ? 'PASS' : 'FAIL',
      `预览数据: ${JSON.stringify(res.data).substring(0, 150)}`);
  } catch (e) {
    writeTestResult('订单预览', 'FAIL', e.message);
  }

  // 6.5 创建订单
  try {
    const res = await apiRequest('POST', `${API_PREFIX}/market/orders`, {
      items: [{ goods_id: 1, quantity: 1 }],
      address_id: 1,
      remark: '全链路测试订单'
    }, testData.userToken);

    if (res.status === 200 || res.status === 201) {
      testData.orderNo = res.data.order_no || res.data.orderNo;
      testData.orderId = res.data.id;
      writeTestResult('创建订单', 'PASS', `订单号: ${testData.orderNo}`);
    } else {
      writeTestResult('创建订单', 'FAIL', `${res.status} - ${res.raw.substring(0, 200)}`);
