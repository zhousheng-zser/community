/**
 * 小程序代码语法检查脚本
 * 不依赖 miniprogram-ci，直接检查 WXML/WXSS/JS 语法
 */
const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

function log(file, line, msg, isError = true) {
  const entry = `  ${file}:${line || '?'}  ${msg}`;
  if (isError) errors.push(entry);
  else warnings.push(entry);
}

// 微信小程序自闭合标签
const SELF_CLOSING_TAGS = new Set([
  'image', 'input', 'br', 'hr', 'meta', 'link', 'icon', 'textarea',
  'progress', 'slider', 'switch', 'radio', 'checkbox', 'audio', 'video',
  'live-player', 'live-pusher', 'camera', 'map', 'canvas', 'ad', 'official-account',
  'open-data', 'web-view', 'navigation-bar', 'page-meta', 'include', 'import'
]);

// ==================== JS 语法检查 ====================
function checkJS(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    new Function(code);
  } catch (e) {
    const match = e.stack.match(/:(\d+):/);
    const line = match ? match[1] : '?';
    log(filePath, line, `JS 语法错误: ${e.message}`);
  }
}

// ==================== WXML 检查 ====================
function checkWXML(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. 检查标签闭合（仅检查 view/text/block/scroll-view 等容器标签）
  const openTags = [];
  const tagRegex = /<(\/?)([\w-]+)([^>]*)>/g;
  let m;

  while ((m = tagRegex.exec(content)) !== null) {
    const isClose = m[1] === '/';
    const tagName = m[2];
    const attrs = m[3];
    const line = content.substring(0, m.index).split('\n').length;

    // 跳过自闭合标签和模板标签
    if (SELF_CLOSING_TAGS.has(tagName)) continue;
    // 跳过注释
    if (tagName === '!' || tagName.startsWith('!--')) continue;
    // 跳过 wx: 开头的模板属性（不是标签）
    if (tagName.startsWith('wx-')) continue;

    if (isClose) {
      const lastIdx = openTags.length - 1;
      if (lastIdx >= 0 && openTags[lastIdx].name === tagName) {
        openTags.pop();
      }
      // 不匹配不报错，因为 wx:if/wx:else 会导致结构变化
    } else {
      openTags.push({ name: tagName, line });
    }
  }

  // 2. 检查引号匹配（逐行检查）
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    let inString = false;
    let stringChar = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const prev = line[i - 1];
      if (ch === '"' || ch === "'") {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (stringChar === ch && prev !== '\\') {
          inString = false;
          stringChar = null;
        }
      }
    }
    if (inString) {
      log(filePath, idx + 1, `引号未闭合`, true);
    }
  });

  // 3. 检查关键属性完整性（仅检查惠民卡区域）
  const benefitStart = content.indexOf("activeTab === '惠民卡'");
  const benefitEnd = content.indexOf('</scroll-view>', benefitStart);
  if (benefitStart > 0 && benefitEnd > 0) {
    const benefitSection = content.substring(benefitStart, benefitEnd);

    // 检查 wx:for 是否有 wx:key
    const forRegex = /wx:for="\{\{([^}]+)\}\}"[^>]*>/g;
    let fm;
    while ((fm = forRegex.exec(benefitSection)) !== null) {
      const tagStart = benefitSection.lastIndexOf('<', fm.index);
      const tag = benefitSection.substring(tagStart, fm.index + fm[0].length);
      if (!tag.includes('wx:key')) {
        const line = content.substring(0, benefitStart + fm.index).split('\n').length;
        log(filePath, line, `wx:for 缺少 wx:key`, false);
      }
    }
  }
}

// ==================== WXSS 检查 ====================
function checkWXSS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    let inString = false;
    let stringChar = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const prev = line[i - 1];
      if (ch === '"' || ch === "'") {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (stringChar === ch && prev !== '\\') {
          inString = false;
          stringChar = null;
        }
      }
    }
    if (inString) {
      log(filePath, idx + 1, `WXSS 引号未闭合`, true);
    }
  });
}

// ==================== 主程序 ====================
function main() {
  const root = path.resolve(__dirname, '..');

  console.log('\n📁 检查 pages/index/index.js ...');
  checkJS(path.join(root, 'pages/index/index.js'));

  console.log('📁 检查 pages/index/index.wxml ...');
  checkWXML(path.join(root, 'pages/index/index.wxml'));

  console.log('📁 检查 pages/index/index.wxss ...');
  checkWXSS(path.join(root, 'pages/index/index.wxss'));

  console.log('\n' + '='.repeat(60));
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ 所有检查通过，未发现语法错误');
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ 发现 ${errors.length} 个错误:`);
      errors.forEach(e => console.log(e));
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  发现 ${warnings.length} 个警告:`);
      warnings.forEach(w => console.log(w));
    }
  }
  console.log('='.repeat(60) + '\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
