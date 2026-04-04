/**
 * 【已弃用】占位图下载，易与真实商品错位。
 * 正式主图请用 流量联盟/pdd_local_images.json + npm run sync:pdd-benefit-images。
 *
 * 历史：根据 pdd_image_map.json 下载到 img/pdd_benefit/{link_key}.jpg
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');
const mapPath = path.join(root, '流量联盟', 'pdd_image_map.json');
const outDir = path.join(root, 'img', 'pdd_benefit');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; community-pdd-sync/1.0)'
        }
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(dest, () => {});
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close((e) => (e ? reject(e) : resolve())));
      }
    );
    req.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
    req.setTimeout(25000, () => {
      req.destroy();
      file.close();
      fs.unlink(dest, () => {});
      reject(new Error('timeout'));
    });
  });
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const items = raw.items || [];
  fs.mkdirSync(outDir, { recursive: true });
  for (const it of items) {
    const dest = path.join(outDir, `${it.link_key}.jpg`);
    process.stdout.write(`${it.link_key} <- ${it.title} ... `);
    try {
      await download(it.source_url, dest);
      console.log('ok');
    } catch (e) {
      console.log('FAIL', e.message);
    }
  }
  console.log('done ->', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
