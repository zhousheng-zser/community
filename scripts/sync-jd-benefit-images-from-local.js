/**
 * 将 流量联盟/京东联盟/ 下截图按 jd_local_images.json 复制为 img/jd_benefit/{sku_id}.png
 * 与 京东联盟.md 顺序、sku 一一对应。
 * 项目根执行：node scripts/sync-jd-benefit-images-from-local.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mapPath = path.join(root, '流量联盟', 'jd_local_images.json');
const srcDir = path.join(root, '流量联盟', '京东联盟');
const outDir = path.join(root, 'img', 'jd_benefit');

function main() {
  const { items } = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  if (!Array.isArray(items) || items.length === 0) {
    console.error('jd_local_images.json items 为空');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const row of items) {
    const { sku_id: skuId, source_file: name } = row;
    if (!skuId || !name) continue;
    const src = path.join(srcDir, name);
    if (!fs.existsSync(src)) {
      console.error('缺少源文件:', name);
      process.exit(1);
    }
    const dest = path.join(outDir, `${skuId}.png`);
    fs.copyFileSync(src, dest);
    const jpg = path.join(outDir, `${skuId}.jpg`);
    if (fs.existsSync(jpg)) fs.unlinkSync(jpg);
    console.log('ok', skuId, '->', path.relative(root, dest));
  }
  console.log('sync jd benefit images ok,', items.length, 'files');
}

main();
