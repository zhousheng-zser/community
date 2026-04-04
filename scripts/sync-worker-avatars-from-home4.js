/**
 * 将 素材/家政/首页素材/4 下 PNG 按文件名中 (数字) 排序，复制为 img/worker_avatars/1.png … 6.png
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, '素材', '家政', '首页素材', '4');
const destDir = path.join(root, 'img', 'worker_avatars');

if (!fs.existsSync(srcDir)) {
  console.error('源目录不存在:', srcDir);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter((f) => /\.png$/i.test(f));
const parsed = files.map((f) => {
  const m = f.match(/\((\d+)\)/);
  return { file: f, n: m ? parseInt(m[1], 10) : 9999 };
});
parsed.sort((a, b) => a.n - b.n || a.file.localeCompare(b.file));

parsed.forEach((p, i) => {
  const slot = i + 1;
  const dest = path.join(destDir, `${slot}.png`);
  fs.copyFileSync(path.join(srcDir, p.file), dest);
  console.log('ok', slot + '.png', '<-', p.file);
});

if (parsed.length === 0) {
  console.error('目录内无 png:', srcDir);
  process.exit(1);
}
