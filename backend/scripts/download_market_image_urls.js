/**
 * 仅下载：读取 scripts/data/vjshi_image_urls.json（HTTPS 图片 URL 数组），保存到
 * data/uploads/images/market/_vjshi_import/，不修改数据库。
 *
 * 用法：node scripts/download_market_image_urls.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { UPLOAD_ROOT } = require('./lib/seed_mkdir_cp');

function loadUrlList() {
  const p = path.join(__dirname, 'data', 'vjshi_image_urls.json');
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (Array.isArray(j)) return j.map(String).filter((s) => /^https?:\/\//i.test(s.trim()));
    return [];
  } catch {
    return [];
  }
}

function refererForUrl(u) {
  try {
    const h = new URL(u).hostname;
    if (h.includes('unsplash.com') || h.includes('images.unsplash.com')) return 'https://unsplash.com/';
    if (h.includes('pixabay.com') || h.includes('cdn.pixabay.com')) return 'https://pixabay.com/';
    if (h.includes('699pic.com')) return 'https://699pic.com/';
    if (h.includes('58pic.com')) return 'https://58pic.com/';
    if (h.includes('nipic.com')) return 'https://nipic.com/';
    return `https://${h}/`;
  } catch {
    return 'https://www.google.com/';
  }
}

function downloadToFile(urlStr, dest) {
  return new Promise((resolve, reject) => {
    const tryOnce = (u) => {
      const lib = u.startsWith('https') ? https : http;
      const req = lib.request(
        u,
        {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: refererForUrl(u)
          },
          timeout: 30000
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            tryOnce(new URL(res.headers.location, u).href);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode} for ${u}`));
            return;
          }
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          const ws = fs.createWriteStream(dest);
          res.pipe(ws);
          ws.on('finish', () => {
            ws.close();
            resolve();
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
      req.end();
    };
    tryOnce(urlStr);
  });
}

async function main() {
  const urls = loadUrlList();
  if (!urls.length) {
    console.error('❌ scripts/data/vjshi_image_urls.json 为空或不存在，请先填入图片 URL 数组。');
    process.exitCode = 1;
    return;
  }
  const dir = path.join(UPLOAD_ROOT, 'market', '_vjshi_import');
  fs.mkdirSync(dir, { recursive: true });
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < urls.length; i += 1) {
    const u = urls[i].trim();
    const ext = (() => {
      try {
        const pathname = new URL(u).pathname;
        const m = pathname.match(/\.(jpe?g|png|webp)$/i);
        if (m) return `.${m[1].toLowerCase().replace('jpeg', 'jpg')}`;
      } catch {
        /* ignore */
      }
      return '.jpg';
    })();
    const dest = path.join(dir, `import_${String(i + 1).padStart(4, '0')}${ext}`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      ok += 1;
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      await downloadToFile(u, dest);
      ok += 1;
      console.log(`OK ${i + 1}/${urls.length} -> ${path.basename(dest)}`);
    } catch (e) {
      fail += 1;
      console.warn(`FAIL ${i + 1}/${urls.length}:`, e.message || e);
    }
  }
  console.log(`\n✅ 完成：成功/跳过 ${ok}，失败 ${fail}，目录: ${dir}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
