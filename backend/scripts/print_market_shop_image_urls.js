/**
 * 联调：按店铺名称查询 DB，打印各图片字段、拼接后的完整 URL，并检查本地静态文件是否存在。
 *
 * 用法（在 backend 目录）：
 *   PUBLIC_API_BASE=http://114.55.167.14:3000 node scripts/print_market_shop_image_urls.js "母婴生活馆官方店"
 *
 * 未传名称时默认：母婴生活馆官方店
 * 完整 URL = PUBLIC_API_BASE（或 API_PUBLIC_URL）+ 相对路径；未配置环境变量时仅打印相对路径。
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize, MarketShop, MarketGood } = require('../src/models');

function publicBase() {
  const b = process.env.PUBLIC_API_BASE || process.env.API_PUBLIC_URL || '';
  return String(b).replace(/\/$/, '');
}

function abs(u) {
  if (u == null || u === '') return '(空)';
  if (/^https?:\/\//i.test(u)) return u;
  const base = publicBase();
  if (!base) return `(相对) ${u}`;
  return base + (String(u).startsWith('/') ? u : `/${u}`);
}

function localFileFromUploadPath(u) {
  if (!u || typeof u !== 'string' || !u.startsWith('/uploads/')) return null;
  const rel = u.replace(/^\/uploads\//, '');
  return path.join(__dirname, '..', 'data', 'uploads', 'images', rel);
}

async function main() {
  const nameLike = process.argv[2] || '母婴生活馆官方店';
  await sequelize.authenticate();

  const shop = await MarketShop.findOne({
    where: { name: nameLike },
    raw: true
  });

  if (!shop) {
    console.error(`未找到 name="${nameLike}" 的店铺。可用 SQL: SELECT id,name FROM market_shops LIMIT 20;`);
    process.exit(1);
  }

  const base = publicBase() || '(未设置 PUBLIC_API_BASE，仅相对路径)';
  console.log('\n======== 本地集市图片联调 =========');
  console.log('店铺:', shop.name, 'id=', shop.id, 'shop_no=', shop.shop_no);
  console.log('PUBLIC_API_BASE / API_PUBLIC_URL =', base);
  console.log('静态映射: GET /uploads/* → backend/data/uploads/images/*');
  console.log('');

  const shopFields = [
    ['cover_url（列表/详情横幅）', shop.cover_url],
    ['logo_url（列表兜底/详情 Logo）', shop.logo_url],
    ['facade_image', shop.facade_image],
    ['interior_image', shop.interior_image],
    ['license_image', shop.license_image]
  ];

  for (const [label, val] of shopFields) {
    const file = localFileFromUploadPath(val);
    const exists = file && fs.existsSync(file);
    console.log(`[${label}]`);
    console.log(`  库内值: ${val == null || val === '' ? '(空)' : val}`);
    console.log(`  完整 URL: ${abs(val)}`);
    if (file) console.log(`  本地文件: ${file} → ${exists ? '存在' : '【缺失】请放入该路径或换可访问 URL'}`);
    else console.log(`  本地文件: (非 /uploads 相对路径，跳过存在性检查)`);
    console.log('');
  }

  const goods = await MarketGood.findAll({
    where: { shop_id: shop.id, status: 'on_sale' },
    limit: 5,
    raw: true
  });

  console.log(`--- 店内商品（最多 5 条）共 ${goods.length} 条 ---`);
  for (const g of goods) {
    const val = g.main_image;
    const file = localFileFromUploadPath(val);
    const exists = file && fs.existsSync(file);
    console.log(`商品 ${g.goods_no} ${g.name}`);
    console.log(`  main_image: ${val == null || val === '' ? '(空)' : val}`);
    console.log(`  完整 URL: ${abs(val)}`);
    if (file) console.log(`  本地文件: ${exists ? '存在' : '【缺失】'}`);
    console.log('');
  }

  console.log('浏览器核对：将「完整 URL」复制到地址栏；若 404 多为静态文件未部署到 data/uploads/images。');
  console.log('================================\n');

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
