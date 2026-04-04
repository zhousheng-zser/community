/**
 * 从 素材/家政/2 的海报图中抠出圆形图标区域，输出 256×256 透明底 PNG 到 素材/家政/icons2/256x256
 * 依赖：项目根目录已安装 sharp（见 package.json）
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, '素材', '家政', '2');
const outDir = path.join(root, '素材', '家政', 'icons2', '256x256');
const SIZE = 256;
const R = SIZE / 2 - 1.5;

const circleMaskSvg = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${R}" fill="#ffffff"/>
  </svg>`
);

/** 按文件名关键词映射为短英文名（与首页 quickActions / knowledgeList 等可对齐） */
const slugByKeyword = [
  ['秒杀', 'miaosha'],
  ['积分', 'points'],
  ['宠物喂养', 'pet_feed'],
  ['直约服务商', 'merchant_direct'],
  ['接送小孩', 'child_pickup'],
  ['代扔垃圾', 'trash_proxy'],
  ['代取', 'pickup'],
  ['直约技工', 'worker_direct'],
  ['陪诊', 'escort'],
  ['领券', 'coupon']
];

function slugForFile(name) {
  for (const [kw, slug] of slugByKeyword) {
    if (name.includes(kw)) return slug;
  }
  return name.replace(/\.png$/i, '').replace(/[^\w\u4e00-\u9fa5]+/g, '_').slice(0, 48);
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('缺少源目录:', srcDir);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter((f) => /\.png$/i.test(f));
  if (!files.length) {
    console.error('目录内无 PNG:', srcDir);
    process.exit(1);
  }

  const used = new Set();
  for (const file of files) {
    const slugBase = slugForFile(file);
    let slug = slugBase;
    let n = 1;
    while (used.has(slug)) {
      slug = `${slugBase}_${++n}`;
    }
    used.add(slug);

    const inPath = path.join(srcDir, file);
    const outPath = path.join(outDir, `${slug}.png`);

    await sharp(inPath)
      .rotate()
      .ensureAlpha()
      .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
      .composite([{ input: circleMaskSvg, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log('ok', slug + '.png', '<-', file);
  }

  const readme = path.join(path.dirname(outDir), 'README.md');
  fs.writeFileSync(
    readme,
    [
      '# icons2',
      '',
      '`256x256/` 内为从 `../2/` 源图居中裁剪并圆形抠图后的 PNG（透明底）。',
      '',
      '重新生成：在项目根执行 `node scripts/extract-icons2-circles.js`。',
      ''
    ].join('\n'),
    'utf8'
  );
  console.log('done ->', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
