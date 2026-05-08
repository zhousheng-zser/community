/**
 * 一键替换小程序代码中的本地 /img/ 引用为网络 URL
 *
 * 使用步骤：
 * 1. 把 img/ 目录上传到 CDN 或服务器（可用 deploy-images.js 复制到后端 uploads）
 * 2. 修改下方 BASE_URL 为你的实际域名
 * 3. 运行: node scripts/replace-img-urls.js
 * 4. 如需撤销，运行: node scripts/replace-img-urls.js --restore
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 配置：修改为你的实际图片域名
// ========================================
const BASE_URL = 'https://your-cdn.example.com'; // 示例，请替换
// 或者使用后端地址（需确保外网可访问）：
// const BASE_URL = 'https://your-server.com/uploads';
// ========================================

// TabBar 图标保留本地引用（微信 TabBar iconPath 建议本地）
const KEEP_LOCAL = new Set([
  '/img/home-0.png', '/img/home-1.png',
  '/img/shop-0.png', '/img/shop-1.png',
  '/img/order-0.png', '/img/order-1.png',
  '/img/user-0.png', '/img/user-1.png'
]);

const DIRS = ['pages', 'package-worker', 'package-merchant', 'package-market', 'package-service-provider', 'package-rider', 'custom-tab-bar'];
const EXT = ['.js', '.wxml', '.wxss'];

const MARKER = '/* IMG-URL-REPLACED */';

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) walk(p, cb);
    else if (st.isFile() && EXT.some(e => f.endsWith(e))) cb(p);
  }
}

function replaceInFile(filePath, restore = false) {
  let content = fs.readFileSync(filePath, 'utf-8');

  if (restore) {
    // 恢复：把 BASE_URL + '/img/' 还原为 '/img/'
    const regex = new RegExp(BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$\u0026') + "(/img/[^'\"\\s]+)", 'g');
    const newContent = content.replace(regex, '$1');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('  restored:', filePath);
    }
    return;
  }

  // 已经替换过则跳过
  if (content.includes(MARKER)) return;

  let changed = false;

  // 模式1: 硬编码字符串 '/img/xxx.png'
  // 匹配单引号或双引号包裹的 /img/ 路径
  const quoteRegex = /(['"])(\/img\/[^'"\s{}]+)\1/g;
  content = content.replace(quoteRegex, (match, quote, imgPath) => {
    if (KEEP_LOCAL.has(imgPath)) return match;
    changed = true;
    return quote + BASE_URL + imgPath + quote;
  });

  // 模式2: WXML 中动态拼接的 src="/img/xxx/{{item.icon}}.png"
  // 替换为 src="{{imgBase}}/img/xxx/{{item.icon}}.png"
  // 同时需要在对应页面的 data 中注入 imgBase
  const dynamicRegex = /src=(['"])(\/img\/[^'"]*\{\{[^'"]+\}\}[^'"]*)\1/g;
  content = content.replace(dynamicRegex, (match, quote, imgPath) => {
    // 如果已经包含 imgBase 则跳过
    if (imgPath.includes('imgBase')) return match;
    changed = true;
    return 'src=' + quote + '{{imgBase}}' + imgPath + quote;
  });

  if (changed) {
    // 在文件末尾添加标记注释（JS 用 //，WXML/WXSS 用 <!-- -->）
    const ext = path.extname(filePath);
    if (ext === '.js') {
      content += '\n' + MARKER + '\n';
    } else {
      content += '\n' + MARKER + '\n';
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('  replaced:', filePath);
  }
}

function injectImgBase() {
  // 对于 WXML 中使用了 {{imgBase}} 的页面，需要在对应 JS 的 data 中注入 imgBase
  // 扫描所有 .wxml 文件，找出使用了 imgBase 的页面，然后修改对应 .js
  const pagesNeedInject = new Set();
  walk('pages', (p) => {
    if (!p.endsWith('.wxml')) return;
    const content = fs.readFileSync(p, 'utf-8');
    if (content.includes('{{imgBase}}')) {
      const jsFile = p.replace('.wxml', '.js');
      if (fs.existsSync(jsFile)) pagesNeedInject.add(jsFile);
    }
  });

  for (const jsFile of pagesNeedInject) {
    let content = fs.readFileSync(jsFile, 'utf-8');
    if (content.includes("imgBase:")) continue; // 已有则跳过

    // 尝试在 data: { 后面注入 imgBase
    const dataRegex = /data\s*:\s*\{/;
    if (dataRegex.test(content)) {
      content = content.replace(dataRegex, `data: {\n    imgBase: '${BASE_URL}',`);
      fs.writeFileSync(jsFile, content, 'utf-8');
      console.log('  injected imgBase:', jsFile);
    }
  }
}

function main() {
  const restore = process.argv.includes('--restore');

  if (!restore && BASE_URL.includes('your-cdn.example.com')) {
    console.error('ERROR: 请先修改 BASE_URL 为你的实际域名');
    process.exit(1);
  }

  console.log(restore ? 'Restoring local img paths...' : `Replacing img paths with ${BASE_URL}...`);

  for (const dir of DIRS) {
    walk(dir, (p) => replaceInFile(p, restore));
  }

  if (!restore) {
    injectImgBase();
    console.log('\nDone. 请检查改动，确保没有遗漏的本地 /img/ 引用。');
    console.log('提示：运行预览前，请确认图片已上传到服务器且外网可访问。');
  } else {
    console.log('\nRestoration complete.');
  }
}

main();
