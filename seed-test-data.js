/**
 * 创建测试数据的脚本
 * 在服务器上执行以创建测试账号
 */

const http = require('http');

const BASE = 'http://120.27.239.244:3001:3001';
const API = '/api/v1';

function api(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, BASE);
    const o = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };

    const req = http.request(o, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ s: res.statusCode, d: data ? JSON.parse(data) : {}, r: data });
        } catch (e) {
          resolve({ s: res.statusCode, d: {}, r: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedTestData() {
  console.log('\n========================================');
  console.log('创建测试数据');
  console.log('========================================\n');

  // 1. 创建测试用户（通过微信登录接口）
  console.log('[1] 创建测试用户...');
  let res = await api('POST', `${API}/auth/login`, {
    code: 'test_user_code_13800138000',
    nickname: '测试用户',
    phone: '13800138000'
  });
  console.log(`用户登录: ${res.s} - ${JSON.stringify(res.d).slice(0, 100)}`);

  // 2. 创建商家账号
  console.log('\n[2] 创建商家账号...');
  res = await api('POST', `${API}/market/apply`, {
    shop_name: '测试店铺',
    owner_name: '测试商家',
    phone: '13800138001',
    category: '食品生鲜',
    description: '测试用店铺'
  });
  console.log(`商家入驻申请: ${res.s} - ${JSON.stringify(res.d).slice(0, 100)}`);

  // 3. 创建技工申请
  console.log('\n[3] 创建技工申请...');
  res = await api('POST', `${API}/worker/apply`, {
    name: '测试技工',
    phone: '13800138002',
    skill: '水电维修',
    description: '测试技工'
  });
  console.log(`技工申请: ${res.s} - ${JSON.stringify(res.d).slice(0, 100)}`);

  // 4. 创建商品数据
  console.log('\n[4] 创建商品...');
  res = await api('POST', `${API}/market/shops/1/goods`, {
    name: '测试商品',
    price: 99.99,
    stock: 100,
    category: '测试分类',
    description: '测试用商品'
  });
  console.log(`创建商品: ${res.s} - ${JSON.stringify(res.d).slice(0, 100)}`);

  console.log('\n========================================');
  console.log('测试数据创建完成');
  console.log('========================================\n');
}

seedTestData().catch(e => {
  console.error('错误:', e);
  process.exit(1);
});
