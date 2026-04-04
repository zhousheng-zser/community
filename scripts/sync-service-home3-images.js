/**
 * 将 素材/家政/首页素材/3 下服务图同步到 img/service_home3/，
 * 若存在 首页素材/1，则其后覆盖同名文件（例如用 1/衣橱收纳.png 覆盖 3 下同名片）。
 * 并生成 utils/serviceHome3Filenames.js（供按标题匹配本地图是否存在）
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir3 = path.join(root, '素材', '家政', '首页素材', '3');
const dir1 = path.join(root, '素材', '家政', '首页素材', '1');
const destDir = path.join(root, 'img', 'service_home3');
const outFile = path.join(root, 'utils', 'serviceHome3Filenames.js');

if (!fs.existsSync(dir3)) {
  console.error('源目录不存在:', dir3);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });

function pngNamesIn(dir) {
  return fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));
}

for (const name of pngNamesIn(dir3)) {
  fs.copyFileSync(path.join(dir3, name), path.join(destDir, name));
}

if (fs.existsSync(dir1)) {
  for (const name of pngNamesIn(dir1)) {
    fs.copyFileSync(path.join(dir1, name), path.join(destDir, name));
  }
}

const names = fs
  .readdirSync(destDir)
  .filter((f) => /\.png$/i.test(f))
  .sort();

const body = `/**
 * 由 scripts/sync-service-home3-images.js 生成，勿手改（3 为底 + 1 覆盖同名）
 * @type {string[]}
 */
module.exports = ${JSON.stringify(names, null, 2)};
`;

fs.writeFileSync(outFile, body, 'utf8');
console.log('copied', names.length, 'png ->', path.relative(root, destDir));
console.log('wrote', path.relative(root, outFile));
