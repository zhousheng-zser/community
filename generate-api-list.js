/**
 * 完整 API 清单生成器
 * 从前端 API 定义中提取所有接口并生成报告
 */
const fs = require('fs');
const path = require('path');

// 解析前端 API 文件
function parseApiFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const endpoints = [];
  
  // 匹配函数定义和注释
  const functionRegex = /const\s+(\w+)\s*=\s*\(.*?\)\s*=>\s*\{[\s\S]*?return\s+(get|post|put|patch|del)\s*\((['"`])(\/[^'`"]*)\3/g;
  
  let match;
  const lines = content.split('\n');
  let currentEndpoint = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查是否有 API 注释
    if (line.match(/^(GET|POST|PUT|PATCH|DELETE)\s+\/[\w\-/:]/)) {
      const parts = line.match(/(GET|POST|PUT|PATCH|DELETE)\s+(\/[\w\-/:]+)/);
      if (parts) {
        currentEndpoint = {
          method: parts[1],
          path: parts[2],
          description: ''
        };
      }
    }
    
    // 检查是否有描述注释
    if (line.match(/^\*\s*[\u4e00-\u9fa5]/) && currentEndpoint) {
      currentEndpoint.description = line.replace(/^\*\s*/, '').trim();
    }
    
    // 检查函数调用
    if (currentEndpoint && (line.includes('return get(') || line.includes('return post(') || 
                            line.includes('return put(') || line.includes('return patch(') || 
                            line.includes('return del('))) {
      endpoints.push(currentEndpoint);
      currentEndpoint = null;
    }
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
    if (endpoints.length > 0) {
      allEndpoints.push({
        file,
        endpoints
      });
    }
  }
  
  return allEndpoints;
}

console.log('========================================');
console.log('  完整 API 清单');
console.log('  基础路径: /api/v1');
console.log('========================================\n');

const frontendApis = getAllFrontendApis();

// 按模块分组输出
let totalEndpoints = 0;

for (const module of frontendApis) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`模块: ${module.file}`);
  console.log('='.repeat(60));
  
  for (const endpoint of module.endpoints) {
    console.log(`\n${endpoint.method} ${endpoint.path}`);
    if (endpoint.description) {
      console.log(`  描述: ${endpoint.description}`);
    }
    totalEndpoints++;
  }
}

console.log(`\n\n${'='.repeat(60)}`);
console.log(`总计: ${totalEndpoints} 个接口`);
console.log('='.repeat(60));

// 生成 Markdown 格式
console.log('\n\n========================================');
console.log('Markdown 格式 (可用于更新 API_DOC.md)');
console.log('========================================\n');

for (const module of frontendApis) {
  console.log(`## ${module.file.replace('.js', '')}\n`);
  
  for (const endpoint of module.endpoints) {
    console.log(`- **${endpoint.method}** \`${endpoint.path}\` - ${endpoint.description || ''}\n`);
  }
}
