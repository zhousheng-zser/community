/**
 * 将 流量联盟/拼多多/ 素材按 pdd_local_images.json 复制为 img/pdd_benefit/{link_key}.jpeg
 * 与 拼多多.md 顺序、link_key 一一对应。
 * 项目根执行：node scripts/sync-pdd-benefit-images-from-local.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mapPath = path.join(root, '流量联盟', 'pdd_local_images.json');
const srcDir = path.join(root, '流量联盟', '拼多多');
const outDir = path.join(root, 'img', 'pdd_benefit');

function main() {
  const { items } = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  if (!Array.isArray(items) || items.length === 0) {
    console.error('pdd_local_images.json items 为空');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const row of items) {
    const { link_key: linkKey, source_file: name } = row;
    if (!linkKey || !name) continue;
    const src = path.join(srcDir, name);
    if (!fs.existsSync(src)) {
      console.error('缺少源文件:', name);
      process.exit(1);
    }
    const ext = path.extname(name).toLowerCase() || '.jpeg';
    const dest = path.join(outDir, `${linkKey}${ext}`);
    fs.copyFileSync(src, dest);
    for (const alt of ['.jpg', '.jpeg', '.png']) {
      if (alt === ext) continue;
      const stale = path.join(outDir, `${linkKey}${alt}`);
      if (fs.existsSync(stale)) fs.unlinkSync(stale);
    }
    console.log('ok', linkKey, '->', path.relative(root, dest));
  }
  console.log('sync pdd benefit images ok,', items.length, 'files');
}

main();
