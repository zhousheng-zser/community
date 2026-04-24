/**
 * API 文档接口测试脚本
 * 测试 API_DOC.md 中 documented 的所有接口
 */
const http = require('http');

const BASE_URL = 'http://192.168.110.50:3001';
const API_PREFIX = '/api/v1';

// 测试结果统计
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// 测试接口列表（基于 API_DOC.md）
const endpoints = [
  // 健康检查
  { method: 'GET', path: '/', description: '健康检查' },
  
  // 1. 认证模块
  { method: 'GET', path: `${API_PREFIX}/auth/wx/getkey/test_code`, description: '获取 key (兼容接口)', skip: true, reason: '需要有效 code' },
  { method: 'POST', path: `${API_PREFIX}/auth/login`, description: '登录/注册', skip: true, reason: '需要有效 code' },
  
  // 2. 社区帖子
  { method: 'GET', path: `${API_PREFIX}/posts/`, description: '获取帖子列表 (公共)' },
  
  // 3. 核心数据
  { method: 'GET', path: `${API_PREFIX}/core/banners`, description: '获取 Banner 列表' },
  { method: 'GET', path: `${API_PREFIX}/core/categories`, description: '获取服务类目列表' },
  { method: 'GET', path: `${API_PREFIX}/core/services/hot`, description: '获取热门服务' },
  
  // 7. 公共接口
  { method: 'POST', path: `${API_PREFIX}/upload`, description: '文件上传', skip: true, reason: '需要文件' },
  
  // 7.1 惠民卡联盟
  { method: 'GET', path: `${API_PREFIX}/benefit/display`, description: '联盟顶栏展示' },
  { method: 'GET', path: `${API_PREFIX}/jd/benefit/goods`, description: '京东联盟商品列表' },
  { method: 'GET', path: `${API_PREFIX}/pdd/benefit/goods`, description: '拼多多进宝商品列表' },
];

function makeRequest(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: json,
            raw: data.substring(0, 200) // 只保留前200字符
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            data: data,
            raw: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        raw: ''
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Timeout',
        raw: ''
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testEndpoint(endpoint) {
  if (endpoint.skip) {
    results.skipped.push({
      ...endpoint,
      reason: endpoint.reason
    });
    return;
  }

  try {
    const result = await makeRequest(endpoint.method, endpoint.path);
    
    const success = result.statusCode >= 200 && result.statusCode < 400 && !result.error;
    
    const record = {
      ...endpoint,
      statusCode: result.statusCode,
      success,
      response: result.raw
    };

    if (success) {
      results.passed.push(record);
    } else {
      results.failed.push(record);
    }
  } catch (error) {
    results.failed.push({
      ...endpoint,
      error: error.message
    });
  }
}

async function runTests() {
  console.log('========================================');
  console.log('  API 文档接口测试');
  console.log('  基础地址:', BASE_URL);
  console.log('========================================\n');

  // 顺序执行测试
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.method} ${endpoint.path}... `);
    await testEndpoint(endpoint);
  }

  // 输出结果
  console.log('\n========================================');
  console.log('  测试结果统计');
  console.log('========================================\n');

  console.log(`✅ 通过: ${results.passed.length} 个\n`);
  results.passed.forEach(r => {
    console.log(`  ✓ ${r.method} ${r.path}`);
    console.log(`    状态码: ${r.statusCode}`);
    console.log(`    响应: ${r.response.substring(0, 100)}\n`);
  });

  console.log(`\n❌ 失败: ${results.failed.length} 个\n`);
  results.failed.forEach(r => {
    console.log(`  ✗ ${r.method} ${r.path}`);
    console.log(`    描述: ${r.description}`);
    console.log(`    状态码: ${r.statusCode || 'N/A'}`);
    console.log(`    错误: ${r.error || r.response?.substring(0, 100)}\n`);
  });

  console.log(`\n⏭️  跳过: ${results.skipped.length} 个\n`);
  results.skipped.forEach(r => {
    console.log(`  - ${r.method} ${r.path}`);
    console.log(`    原因: ${r.reason}\n`);
  });

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

runTests().catch(console.error);
