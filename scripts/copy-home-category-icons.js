/**
 * 将 素材/家政/icons/256x256 下中文文件名图标复制为 img/home_categories/*.png（英文文件名，供小程序引用）
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, '素材', '家政', 'icons', '256x256');
const destDir = path.join(root, 'img', 'home_categories');

const map = {
  整理收纳: 'tidy',
  家修急事: 'urgent_fix',
  家电清洗: 'appliance_clean',
  开荒保洁: 'pioneer_clean',
  除螨服务: 'mite_remove',
  家具养护: 'furniture_care',
  宝宝家事: 'baby_home',
  房屋修缮: 'house_repair',
  上门美业: 'beauty_home'
};

if (!fs.existsSync(srcDir)) {
  console.error('源目录不存在:', srcDir);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });

for (const [cn, en] of Object.entries(map)) {
  const from = path.join(srcDir, `${cn}.png`);
  const to = path.join(destDir, `${en}.png`);
  if (!fs.existsSync(from)) {
    console.error('缺少源文件:', from);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
  console.log('ok', en + '.png');
}
