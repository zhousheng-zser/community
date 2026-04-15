/**
 * 将本地集市店铺/商品图片迁移为分层目录，并更新数据库路径。
 *
 * 目录：
 *   uploads/market/{店铺分类 category}/{shop_no}/shop_media/   — 非商品图（logo/cover/门面/内景/证照）
 *   uploads/market/{店铺分类}/{shop_no}/goods/{category_key}/   — 商品主图（按 goods_no 命名）
 *
 * 使用系统命令 mkdir -p、cp（与需求一致）。
 *
 * 用法（在 backend 目录）：
 *   node scripts/restructure_market_images.js           # 执行迁移
 *   node scripts/restructure_market_images.js --dry-run # 只打印计划
 *
 * 若库中路径指向的文件不存在（如 shop1001_logo.png），会尝试从扁平示例图回退复制
 * （market_shop01_*.jpg、market_goods_*.jpg 等），见 scripts/lib/market_image_fallbacks.js。
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { sequelize, MarketShop, MarketGood } = require('../src/models');
const { pathSegment, shopUploadPrefix } = require('./lib/market_upload_paths');
const {
  shopMediaFallbackRel,
  goodsFallbackRelByGoodsNo,
  g2001SeriesDefaultRel
} = require('./lib/market_image_fallbacks');

const UPLOAD_ROOT = path.join(__dirname, '..', 'data', 'uploads', 'images');
const dryRun = process.argv.includes('--dry-run');

function absFromRel(rel) {
  return path.join(UPLOAD_ROOT, ...String(rel).split('/'));
}

/** 旧 seed 笔误：第 10 家店号 SHOP20010 → SHOP2010 */
async function fixShop20010Typo() {
  const row = await MarketShop.findOne({ where: { shop_no: 'SHOP20010' } });
  if (!row) return;
  const other = await MarketShop.findOne({ where: { shop_no: 'SHOP2010' } });
  if (other && other.id !== row.id) {
    console.warn('⚠ 已存在其他店铺的 shop_no=SHOP2010，跳过自动修正 SHOP20010');
    return;
  }
  const catSeg = pathSegment(row.category);
  const oldDir = path.join(UPLOAD_ROOT, 'market', catSeg, 'SHOP20010');
  const newDir = path.join(UPLOAD_ROOT, 'market', catSeg, 'SHOP2010');

  if (dryRun) {
    console.log('[dry-run] 将修正 shop_no: SHOP20010 -> SHOP2010');
    if (fs.existsSync(oldDir)) console.log('[dry-run] mv', oldDir, '->', newDir);
    return;
  }
  await row.update({ shop_no: 'SHOP2010' });
  console.log('✓ 已修正错误 shop_no: SHOP20010 -> SHOP2010');
  if (fs.existsSync(oldDir) && !fs.existsSync(newDir)) {
    execFileSync('mv', [oldDir, newDir], { stdio: 'inherit' });
    console.log('✓ 已重命名目录 SHOP20010 -> SHOP2010');
  }
}

function urlToAbsDisk(url) {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url)) return null;
  if (!url.startsWith('/uploads/')) return null;
  const rel = url.slice('/uploads/'.length);
  return path.join(UPLOAD_ROOT, rel);
}

function extFromUrlOrFile(url, absPath) {
  const u = path.extname(url || '');
  if (u) return u;
  const a = path.extname(absPath || '');
  if (a) return a;
  return '.jpg';
}

function mkdirPCpFromChosen(chosenSrc, destAbs) {
  if (!chosenSrc || !fs.existsSync(chosenSrc)) {
    console.warn('    无可用源文件，跳过');
    return false;
  }
  if (dryRun) {
    console.log('    [dry-run] mkdir -p', path.dirname(destAbs));
    console.log('    [dry-run] cp', chosenSrc, '->', destAbs);
    return true;
  }
  execFileSync('mkdir', ['-p', path.dirname(destAbs)], { stdio: 'inherit' });
  execFileSync('cp', [chosenSrc, destAbs], { stdio: 'inherit' });
  return true;
}

/** 主路径不存在时尝试：同目录下换扩展名、shop_media 角色备用图 */
function resolveShopImageSrc(primaryAbs, role) {
  if (primaryAbs && fs.existsSync(primaryAbs)) return primaryAbs;
  const bn = primaryAbs ? path.basename(primaryAbs, path.extname(primaryAbs)) : '';
  if (bn) {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const alt = path.join(path.dirname(primaryAbs), bn + ext);
      if (fs.existsSync(alt)) {
        console.log('    主路径缺失，改用同目录:', path.basename(alt));
        return alt;
      }
    }
  }
  const rel = shopMediaFallbackRel[role];
  if (rel) {
    const fb = absFromRel(rel);
    if (fs.existsSync(fb)) {
      console.log('    主路径缺失，使用示例备用图:', rel);
      return fb;
    }
  }
  if (primaryAbs) console.warn('    源不存在且无可用备用:', primaryAbs);
  return null;
}

function resolveGoodImageSrc(primaryAbs, goodsNo) {
  if (primaryAbs && fs.existsSync(primaryAbs)) return primaryAbs;
  const bn = primaryAbs ? path.basename(primaryAbs, path.extname(primaryAbs)) : '';
  if (bn) {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const alt = path.join(path.dirname(primaryAbs), bn + ext);
      if (fs.existsSync(alt)) {
        console.log('    主路径缺失，改用同目录:', path.basename(alt));
        return alt;
      }
    }
  }
  const byNo = goodsFallbackRelByGoodsNo[goodsNo];
  if (byNo) {
    const fb = absFromRel(byNo);
    if (fs.existsSync(fb)) {
      console.log('    使用 goods_no 对应示例图:', byNo);
      return fb;
    }
  }
  if (goodsNo && /^G2001/i.test(goodsNo)) {
    const fb = absFromRel(g2001SeriesDefaultRel);
    if (fs.existsSync(fb)) {
      console.log('    G2001* 商品使用默认示例图:', g2001SeriesDefaultRel);
      return fb;
    }
  }
  if (primaryAbs) console.warn('    源不存在且无可用备用:', primaryAbs);
  return null;
}

function alreadyShopMediaUrl(url, shop) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith(`${shopUploadPrefix(shop)}/shop_media/`);
}

function alreadyGoodImageUrl(url, shop) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith(`${shopUploadPrefix(shop)}/goods/`);
}

async function main() {
  await sequelize.authenticate();
  await fixShop20010Typo();

  const shops = await MarketShop.findAll({ order: [['id', 'ASC']] });
  const shopById = Object.fromEntries(shops.map((s) => [s.id, s]));

  console.log(dryRun ? '\n=== DRY RUN ===\n' : '\n=== 本地集市图片路径迁移 ===\n');

  for (const shop of shops) {
    const s = shop.get({ plain: true });
    const prefix = shopUploadPrefix(s);
    console.log(`店铺 ${s.shop_no} (${s.name}) category=${s.category}`);
    console.log(`  前缀: ${prefix}`);

    const mediaRoles = [
      ['logo_url', 'logo'],
      ['cover_url', 'cover'],
      ['facade_image', 'facade'],
      ['interior_image', 'interior'],
      ['license_image', 'license']
    ];

    const updates = {};
    for (const [field, role] of mediaRoles) {
      const oldUrl = s[field];
      if (!oldUrl || String(oldUrl).trim() === '') continue;
      if (alreadyShopMediaUrl(oldUrl, s)) {
        console.log(`  ${field}: 已是 shop_media 路径，跳过`);
        continue;
      }
      const srcAbs = urlToAbsDisk(oldUrl);
      if (!srcAbs) {
        console.log(`  ${field}: 非本地 /uploads 路径，跳过:`, oldUrl);
        continue;
      }
      const chosen = resolveShopImageSrc(srcAbs, role);
      if (!chosen) continue;
      const ext = path.extname(chosen) || extFromUrlOrFile(oldUrl, chosen);
      const destUrl = `${prefix}/shop_media/${role}${ext}`;
      const destAbs = urlToAbsDisk(destUrl);
      console.log(`  ${field}: ${oldUrl} -> ${destUrl}`);
      if (mkdirPCpFromChosen(chosen, destAbs)) {
        updates[field] = destUrl;
      }
    }

    if (Object.keys(updates).length && !dryRun) {
      await shop.update(updates);
      Object.assign(s, updates);
    }
  }

  const goods = await MarketGood.findAll({ order: [['id', 'ASC']] });
  for (const g of goods) {
    const row = g.get({ plain: true });
    const shop = shopById[row.shop_id];
    if (!shop) {
      console.warn('商品', row.goods_no, 'shop_id', row.shop_id, '无对应店铺，跳过');
      continue;
    }
    const s = shop.get({ plain: true });

    const migrateOneUrl = (oldUrl, label) => {
      if (!oldUrl || String(oldUrl).trim() === '') return oldUrl;
      if (alreadyGoodImageUrl(oldUrl, s)) return oldUrl;
      const srcAbs = urlToAbsDisk(oldUrl);
      if (!srcAbs) {
        console.log(`  商品 ${row.goods_no} ${label}: 非本地路径，跳过`, oldUrl);
        return oldUrl;
      }
      const chosen = resolveGoodImageSrc(srcAbs, row.goods_no);
      if (!chosen) return oldUrl;
      const ext = path.extname(chosen) || extFromUrlOrFile(oldUrl, chosen);
      const destUrl = `${shopUploadPrefix(s)}/goods/${pathSegment(row.category_key)}/${row.goods_no}${ext}`;
      const destAbs = urlToAbsDisk(destUrl);
      console.log(`  商品 ${row.goods_no} ${label}: ${oldUrl} -> ${destUrl}`);
      if (mkdirPCpFromChosen(chosen, destAbs)) return destUrl;
      return oldUrl;
    };

    let mainNew = migrateOneUrl(row.main_image, 'main_image');
    let imagesNew = row.images;
    if (imagesNew != null) {
      let arr = imagesNew;
      if (typeof arr === 'string') {
        try {
          arr = JSON.parse(arr);
        } catch {
          arr = null;
        }
      }
      if (Array.isArray(arr)) {
        imagesNew = arr.map((u, idx) =>
          typeof u === 'string' ? migrateOneUrl(u, `images[${idx}]`) : u
        );
      }
    }

    const gu = {};
    if (mainNew !== row.main_image) gu.main_image = mainNew;
    if (JSON.stringify(imagesNew) !== JSON.stringify(row.images)) gu.images = imagesNew;

    if (Object.keys(gu).length && !dryRun) {
      await g.update(gu);
    }
  }

  console.log(dryRun ? '\n=== DRY RUN 结束（未改库、未复制文件）===\n' : '\n✅ 迁移完成\n');
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
