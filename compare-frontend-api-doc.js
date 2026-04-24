/**
 * 前端 API 与文档对比工具
 * 1. 提取前端 API 定义
 * 2. 提取文档中的 API 定义
 * 3. 对比并生成差异报告
 */
const fs = require('fs');
const path = require('path');

// 解析前端 API 文件
function parseApiFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const endpoints = [];
  
  // 匹配注释中的 API 定义
  const commentRegex = /\*\s*(GET|POST|PUT|PATCH|DELETE)\s+(\/[\w\-/:]+)/g;
  let match;
  
  while ((match = commentRegex.exec(content)) !== null) {
    endpoints.push({
      method: match[1],
      path: match[2],
      source: 'frontend'
    });
  }
  
  return endpoints;
}

// 提取所有前端 API
function getAllFrontendApis() {
  const apiDir = path.join(__dirname, 'api');
  const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.js') && f !== 'index.js');
  
  const allEndpoints = [];
  
  for (const file of files) {
    const filePath = path.join(apiDir, file);
    const endpoints = parseApiFile(filePath);
    allEndpoints.push({
      file,
      endpoints
    });
  }
  
  return allEndpoints;
}

// 文档中记录的 API (基于 API_DOC.md)
const documentedApis = [
  // 认证
  { method: 'POST', path: '/api/v1/auth/login' },
  { method: 'GET', path: '/api/v1/auth/wx/getkey/:code' },
  
  // 帖子
  { method: 'GET', path: '/api/v1/posts/' },
  { method: 'GET', path: '/api/v1/posts/my/published' },
  { method: 'GET', path: '/api/v1/posts/my/liked' },
  { method: 'GET', path: '/api/v1/posts/my/participated' },
  { method: 'POST', path: '/api/v1/posts/' },
  { method: 'POST', path: '/api/v1/posts/:postId/like' },
  { method: 'POST', path: '/api/v1/posts/:postId/comment' },
  
  // 核心数据
  { method: 'GET', path: '/api/v1/core/banners' },
  { method: 'GET', path: '/api/v1/core/categories' },
  { method: 'GET', path: '/api/v1/core/services/hot' },
  { method: 'GET', path: '/api/v1/core/categories/:categoryId/services' },
  { method: 'GET', path: '/api/v1/core/services/:id' },
  
  // 订单
  { method: 'POST', path: '/api/v1/orders/' },
  { method: 'GET', path: '/api/v1/orders/my' },
  { method: 'POST', path: '/api/v1/orders/:id/pay' },
  
  // 用户
  { method: 'GET', path: '/api/v1/user/profile' },
  { method: 'POST', path: '/api/v1/user/profile' },
  { method: 'POST', path: '/api/v1/user/api/user_info/update' },
  { method: 'GET', path: '/api/v1/acount/info' },
  { method: 'GET', path: '/api/v1/wx/user/coupon/:id' },
  
  // 消息
  { method: 'GET', path: '/api/v1/messages/conversations' },
  { method: 'GET', path: '/api/v1/messages/history/:conversationId' },
  { method: 'DELETE', path: '/api/v1/messages/conversations/:conversationId' },
  { method: 'POST', path: '/api/v1/messages/send' },
  { method: 'POST', path: '/api/v1/messages/broadcast' },
  
  // 公共
  { method: 'GET', path: '/' },
  { method: 'POST', path: '/api/v1/upload' },
  
  // 惠民卡
  { method: 'GET', path: '/api/v1/benefit/display' },
  { method: 'GET', path: '/api/v1/jd/benefit/goods' },
  { method: 'GET', path: '/api/v1/jd/promotion/spread-url' },
  { method: 'GET', path: '/api/v1/pdd/benefit/goods' },
  { method: 'GET', path: '/api/v1/pdd/promotion/spread-url' },
];

console.log('========================================');
console.log('  前端 API 与文档对比分析');
console.log('========================================\n');

// 获取前端所有 API
const frontendApis = getAllFrontendApis();

console.log('📁 前端 API 模块:\n');
let frontendTotal = 0;

for (const module of frontendApis) {
  console.log(`  ${module.file}:`);
  for (const endpoint of module.endpoints) {
    console.log(`    - ${endpoint.method} ${endpoint.path}`);
    frontendTotal++;
  }
}

console.log(`\n前端 API 总数: ${frontendTotal}\n`);
console.log('----------------------------------------\n');

// 分析差异
const frontendPaths = new Set();
frontendApis.forEach(module => {
  module.endpoints.forEach(ep => {
    // 标准化路径 (移除 /api/v1 前缀用于比较)
    const normalizedPath = ep.path.replace('/api/v1', '').replace(/\/$/, '');
    frontendPaths.add(`${ep.method} ${normalizedPath}`);
  });
});

const docPaths = new Set();
documentedApis.forEach(api => {
  const normalizedPath = api.path.replace('/api/v1', '').replace(/\/$/, '').replace(/:\w+/g, '*');
  docPaths.add(`${api.method} ${normalizedPath}`);
});

// 前端有但文档没有的
const inFrontendNotDoc = [];
frontendApis.forEach(module => {
  module.endpoints.forEach(ep => {
    const normalizedPath = ep.path.replace('/api/v1', '').replace(/\/$/, '').replace(/\/\w+/g, '/*');
    const key = `${ep.method} ${normalizedPath}`;
    
    if (!docPaths.has(key)) {
      inFrontendNotDoc.push({
        file: module.file,
        method: ep.method,
        path: ep.path
      });
    }
  });
});

// 文档有但前端没有的
const inDocNotFrontend = [];
documentedApis.forEach(api => {
  const normalizedPath = api.path.replace('/api/v1', '').replace(/\/$/, '').replace(/:\w+/g, '*');
  const key = `${api.method} ${normalizedPath}`;
  
  if (!frontendPaths.has(key)) {
    inDocNotFrontend.push(api);
  }
});

console.log('🔍 差异分析:\n');

console.log(`❗ 前端有但文档未记录的 API (${inFrontendNotDoc.length} 个):\n`);
if (inFrontendNotDoc.length === 0) {
  console.log('  (无)\n');
} else {
  // 按模块分组
  const groupedByFile = {};
  inFrontendNotDoc.forEach(item => {
    if (!groupedByFile[item.file]) {
      groupedByFile[item.file] = [];
    }
    groupedByFile[item.file].push(item);
  });
  
  for (const [file, items] of Object.entries(groupedByFile)) {
    console.log(`  ${file}:`);
    items.forEach(item => {
      console.log(`    - ${item.method} ${item.path}`);
    });
  }
}

console.log(`\n📝 文档有但前端未调用的 API (${inDocNotFrontend.length} 个):\n`);
if (inDocNotFrontend.length === 0) {
  console.log('  (无)\n');
} else {
  inDocNotFrontend.forEach(api => {
    console.log(`  - ${api.method} ${api.path}`);
  });
}

console.log('\n========================================');
console.log('对比完成');
console.log('========================================');
