/**
 * 将 素材/家政/首页素材/3 下与「小区热卖榜 / 直约服务商」兜底图对应的服务实拍
 * 复制到 img/home_service_photos/（不替换九宫格圆形分类图标）
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, '素材', '家政', '首页素材', '3');
const destDir = path.join(root, 'img', 'home_service_photos');

const map = {
  'washer.png': '洗衣机桶内清洗.png',
  'heater.png': '热水器内胆清洗.png',
  'hood.png': '油烟机拆洗.png',
  'daily_clean.png': '新房开荒保洁.png',
  'aircon.png': '空调深度清洗.png'
};

if (!fs.existsSync(srcDir)) {
  console.error('源目录不存在:', srcDir);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });

for (const [en, cn] of Object.entries(map)) {
  const from = path.join(srcDir, cn);
  const to = path.join(destDir, en);
  if (!fs.existsSync(from)) {
    console.error('缺少源文件:', from);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
  console.log('ok', en);
}
