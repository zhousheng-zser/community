/**
 * 本地集市：删除旧中文分类店铺 + SHOP2001~SHOP2010 示例店，并按首页 10 类各新建 5 家店铺（合川路附近）。
 *
 * 图片策略：
 * 1) 优先使用 data/uploads/images/market 下扁平示例图（*.jpg）轮询复制，减少同店重复。
 * 2) 可选：在 scripts/data/vjshi_image_urls.json 中填入从「光厂免费专区」浏览器里复制的图片直链（每行一个 URL 的 JSON 数组），
 *    脚本会尝试下载到 data/uploads/images/market/_vjshi_import/ 并参与轮询（需本机网络可访问光厂 CDN；服务端直连常 403 属正常）。
 *
 * 用法：node seed_market_enrich_shops.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { pathSegment, safeShopNo, shopMediaUrl, goodMainImageUrl } = require('./scripts/lib/market_upload_paths');
const { UPLOAD_ROOT } = require('./scripts/lib/seed_mkdir_cp');
const { MARKET_CATEGORY_MAPPINGS } = require('./src/constants/marketCategoryMap');
const {
  sequelize,
  MarketShop,
  MarketShopCategory,
  MarketGood,
  MarketOrder,
  MarketOrderItem,
  MarketCartItem,
  MarketShopReview,
  MarketPayTransaction
} = require('./src/models');
const { Op } = require('sequelize');

const BASE_LAT = 31.1694;
const BASE_LNG = 121.3783;
const SHOPS_PER_CATEGORY = 5;
const MIN_IMAGE_BYTES = 20 * 1024;
/** shop_no = SHOP + (31000 + catIdx*100 + slot)，与其它批次不冲突 */
function shopNoFor(catIdx, slot) {
  return `SHOP${31000 + catIdx * 100 + slot}`;
}

const LEGACY_CHINESE_CATEGORIES = ['土特产', '生鲜果蔬', '餐饮外卖'];
const SHOP2000_SERIES = (() => {
  const a = [];
  for (let i = 1; i <= 9; i += 1) a.push(`SHOP200${i}`);
  a.push('SHOP2010');
  return a;
})();

/** 每类 5 家店名（自定义） */
const SHOP_NAMES_BY_CAT = [
  ['合川亲子臻选馆', '蓓蕾母婴·闵行店', '宝宝树合川小站', '妈咪优选母婴', '童梦坊母婴生活'],
  ['到家管家合川站', '邻里快修服务部', '焕新保洁·合川路', '安心开锁·闵行', '绿植养护小站'],
  ['城市之光便利店', '合川路鲜选超市', '邻里优选小超', '24h应急便利店', '闵行便民杂货铺'],
  ['巷口热食铺', '合川轻食工坊', '老上海馄饨王', '川味小馆·外卖', '深夜食堂·合川店'],
  ['合川大药房', '邻里健康药站', '慢病用药咨询店', '医疗器械便民点', '中医养生小铺'],
  ['花语时光花艺', '合川路鲜花站', '节日礼盒专营店', '绿植鲜花小铺', '婚礼花艺工作室'],
  ['鲜丰果蔬站', '合川鲜果直送', '有机蔬菜小铺', '进口水果精选', '闵行菜篮子'],
  ['风尚衣橱合川店', '轻奢饰品小铺', '运动休闲专营', '童装亲子服饰', '合川路鞋包馆'],
  ['数码快修合川站', '手机配件专营', '智能小家电铺', '摄影器材体验店', '合川电脑服务'],
  ['周末剧本杀小馆', '合川路桌游吧', '亲子游乐体验站', '城市骑行俱乐部', '闵行咖啡书吧']
];

const NOTICES = [
  '新店上线，欢迎下单体验',
  '合川路周边极速送达',
  '满额减免配送费（示例）',
  '每日新鲜备货，售完即止',
  '支持到店自提（示例）'
];

function urlToAbs(u) {
  if (!u || typeof u !== 'string' || !u.startsWith('/uploads/')) return null;
  return path.join(UPLOAD_ROOT, u.slice('/uploads/'.length).split('/').join(path.sep));
}

function rmShopDir(category, shopNo) {
  const rel = path.join('market', pathSegment(category), safeShopNo(shopNo));
  const abs = path.join(UPLOAD_ROOT, rel);
  if (fs.existsSync(abs)) fs.rmSync(abs, { recursive: true });
}

/** 在约 5km 半径内随机一点（近似平面，GCJ-02） */
function randomCoordNearHechuan() {
  const rKm = 4.2 * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  const latRad = (BASE_LAT * Math.PI) / 180;
  const dLat = (rKm / 111) * Math.cos(theta);
  const dLng = (rKm / (111 * Math.cos(latRad))) * Math.sin(theta);
  return {
    latitude: Math.round((BASE_LAT + dLat) * 1e7) / 1e7,
    longitude: Math.round((BASE_LNG + dLng) * 1e7) / 1e7
  };
}

function addressLine(name) {
  const roads = ['合川路', '万源路', '虹泉路', '龙茗路', '漕宝路'];
  const road = roads[name.length % roads.length];
  return `上海市闵行区${road}地铁站附近·${name}（示例地址）`;
}

function loadFlatImagePool() {
  const marketRoot = path.join(UPLOAD_ROOT, 'market');
  if (!fs.existsSync(marketRoot)) return [];
  const files = fs
    .readdirSync(marketRoot)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('.'))
    .map((f) => path.join(marketRoot, f))
    .filter((p) => fs.statSync(p).isFile());
  return files;
}

function loadImportedPool() {
  const dir = path.join(UPLOAD_ROOT, 'market', '_vjshi_import');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(dir, f))
    .sort();
}

function fileByteSize(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

function looksTooSmallImage(p) {
  return fileByteSize(p) < MIN_IMAGE_BYTES;
}

function loadVjshiUrlList() {
  const p = path.join(__dirname, 'scripts', 'data', 'vjshi_image_urls.json');
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (Array.isArray(j)) return j.map(String).filter((s) => /^https?:\/\//i.test(s.trim()));
    return [];
  } catch {
    return [];
  }
}

function downloadToFile(urlStr, dest) {
  return new Promise((resolve, reject) => {
    const tryOnce = (u) => {
      const lib = u.startsWith('https') ? https : http;
      const req = lib.request(
        u,
        {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: 'https://www.vjshi.com/'
          },
          timeout: 25000
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            tryOnce(new URL(res.headers.location, u).href);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode} for ${u}`));
            return;
          }
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          const ws = fs.createWriteStream(dest);
          res.pipe(ws);
          ws.on('finish', () => {
            ws.close();
            resolve();
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
      req.end();
    };
    tryOnce(urlStr);
  });
}

async function importVjshiUrlsToDisk(urls) {
  if (!urls.length) return;
  const dir = path.join(UPLOAD_ROOT, 'market', '_vjshi_import');
  fs.mkdirSync(dir, { recursive: true });
  let ok = 0;
  for (let i = 0; i < urls.length; i += 1) {
    const u = urls[i].trim();
    const ext = (() => {
      try {
        const p = new URL(u).pathname;
        const m = p.match(/\.(jpe?g|png|webp)$/i);
        if (m) return `.${m[1].toLowerCase().replace('jpeg', 'jpg')}`;
      } catch {
        /* ignore */
      }
      return '.jpg';
    })();
    const dest = path.join(dir, `import_${String(i + 1).padStart(4, '0')}${ext}`);
    if (fs.existsSync(dest)) {
      ok += 1;
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      await downloadToFile(u, dest);
      ok += 1;
    } catch (e) {
      console.warn(`[vjshi] 下载失败 (${i + 1}/${urls.length}):`, e.message || e);
    }
  }
  console.log(`✅ 光厂直链已尝试下载：成功/已存在约 ${ok} 个文件于 market/_vjshi_import/`);
}

function buildPool(flat, imported) {
  const seen = new Set();
  const out = [];
  for (const p of [...imported, ...flat]) {
    if (seen.has(p)) continue;
    seen.add(p);
    if (!looksTooSmallImage(p)) out.push(p);
  }
  if (out.length === 0) {
    throw new Error(
      '未找到任何可用图片：请在 data/uploads/images/market 放置示例 jpg，或配置 scripts/data/vjshi_image_urls.json 并保证可下载。'
    );
  }
  return out;
}

function pickPoolIndex(seq, salt) {
  return Math.abs(seq * 17 + salt * 31) % 100000;
}

function splitPoolForShopAndGoods(pool) {
  if (pool.length <= 2) return { shopPool: pool, goodsPool: pool };
  const pivot = Math.max(2, Math.floor(pool.length * 0.55));
  const shopPool = pool.slice(0, pivot);
  const goodsPool = pool.slice(pivot);
  return {
    shopPool: shopPool.length ? shopPool : pool,
    goodsPool: goodsPool.length ? goodsPool : pool
  };
}

function copyPoolToDest(srcFile, destUrl) {
  const dest = urlToAbs(destUrl);
  if (!dest) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(srcFile, dest);
  return true;
}

async function purgeShopCascade(shopRows, transaction) {
  const ids = shopRows.map((s) => s.id);
  if (ids.length === 0) return;

  await MarketCartItem.destroy({ where: { shop_id: { [Op.in]: ids } }, transaction });
  const orders = await MarketOrder.findAll({
    where: { shop_id: { [Op.in]: ids } },
    attributes: ['id', 'order_no'],
    transaction
  });
  const orderIds = orders.map((o) => o.id);
  const orderNos = orders.map((o) => o.order_no);
  if (orderNos.length) {
    await MarketPayTransaction.destroy({ where: { order_no: { [Op.in]: orderNos } }, transaction });
  }
  if (orderIds.length) {
    await MarketOrderItem.destroy({ where: { order_id: { [Op.in]: orderIds } }, transaction });
  }
  await MarketOrder.destroy({ where: { shop_id: { [Op.in]: ids } }, transaction });
  await MarketShopReview.destroy({ where: { shop_id: { [Op.in]: ids } }, transaction });
  await MarketGood.destroy({ where: { shop_id: { [Op.in]: ids } }, transaction });
  await MarketShopCategory.destroy({ where: { shop_id: { [Op.in]: ids } }, transaction });
  await MarketShop.destroy({ where: { id: { [Op.in]: ids } }, transaction });
}

async function main() {
  await sequelize.authenticate();
  const vjshiUrls = loadVjshiUrlList();
  if (vjshiUrls.length) await importVjshiUrlsToDisk(vjshiUrls);

  const flat = loadFlatImagePool();
  const imported = loadImportedPool();
  const pool = buildPool(flat, imported);
  const { shopPool, goodsPool } = splitPoolForShopAndGoods(pool);
  console.log(
    `📷 图片池共 ${pool.length} 个文件（店铺图池 ${shopPool.length}，商品图池 ${goodsPool.length}，已过滤小图 < ${Math.round(
      MIN_IMAGE_BYTES / 1024
    )}KB）`
  );

  const categories = MARKET_CATEGORY_MAPPINGS;
  if (categories.length !== 10) throw new Error('MARKET_CATEGORY_MAPPINGS 必须为 10 条');

  const toRemove = await MarketShop.findAll({
    where: {
      [Op.or]: [
        { category: { [Op.in]: LEGACY_CHINESE_CATEGORIES } },
        { shop_no: { [Op.in]: SHOP2000_SERIES } },
        { shop_no: { [Op.in]: ['SHOP1001', 'SHOP1002', 'SHOP1003'] } },
        { shop_no: { [Op.regexp]: '^SHOP31[0-9]{3}$' } }
      ]
    }
  });

  for (const s of toRemove) rmShopDir(s.category, s.shop_no);

  const t = await sequelize.transaction();
  try {
    await purgeShopCascade(toRemove, t);
    console.log(`🗑️ 已删除旧店铺 ${toRemove.length} 家（含中文分类、SHOP2001~2010、SHOP1001~3、SHOP31xxx）`);

    for (let catIdx = 0; catIdx < 10; catIdx += 1) {
      const catCode = categories[catIdx].code;
      const catName = categories[catIdx].name;
      for (let slot = 1; slot <= SHOPS_PER_CATEGORY; slot += 1) {
        const shopNo = shopNoFor(catIdx, slot);
        const name = SHOP_NAMES_BY_CAT[catIdx][slot - 1];
        const coord = randomCoordNearHechuan();
        const shopMeta = { category: catCode, shop_no: shopNo };
        const notice = NOTICES[(catIdx + slot) % NOTICES.length];

        const numInnerCats = 1 + ((catIdx + slot) % 2);
        const numGoods = 1 + ((catIdx * 3 + slot * 5) % 2);

        const innerDefs = [];
        for (let c = 0; c < numInnerCats; c += 1) {
          const key = `in_${catIdx}_${slot}_${c}`;
          innerDefs.push({
            category_key: key,
            category_name: c === 0 ? `${catName}精选` : `${catName}加购`,
            sort_order: 100 - c * 10,
            is_active: 1
          });
        }

        const payload = {
          shop_no: shopNo,
          name,
          category: catCode,
          notice,
          delivery_type: 'platform',
          min_order_amount: slot % 2 === 0 ? 0 : 20,
          delivery_fee: 3 + (slot % 3),
          avg_delivery_minutes: 25 + (catIdx % 5) * 5,
          rating: Number((4.5 + (slot % 5) * 0.08).toFixed(2)),
          sold_count: 50 * slot + catIdx * 17,
          is_open: 1,
          is_active: 1,
          sort_order: 200 - catIdx * 5 - slot,
          address: addressLine(name),
          latitude: coord.latitude,
          longitude: coord.longitude,
          contact_name: `联系人${(catIdx + slot) % 9}`,
          contact_phone: `138${String(10000000 + catIdx * 10001 + slot * 1009).padStart(8, '0').slice(0, 8)}`,
          business_hours: '09:00~22:00',
          logo_url: shopMediaUrl(shopMeta, 'logo', '.jpg'),
          cover_url: shopMediaUrl(shopMeta, 'cover', '.jpg'),
          facade_image: shopMediaUrl(shopMeta, 'facade', '.jpg'),
          interior_image: shopMediaUrl(shopMeta, 'interior', '.jpg'),
          license_image: shopMediaUrl(shopMeta, 'license', '.jpg')
        };

        const shop = await MarketShop.create(payload, { transaction: t });

        for (const ic of innerDefs) {
          await MarketShopCategory.create({ shop_id: shop.id, ...ic }, { transaction: t });
        }

        const goodsTemplates = [];
        if (numGoods === 1) {
          goodsTemplates.push({ innerIdx: 0, title: `${name}招牌款`, desc: '热销推荐，库存有限', price: 19.9 + slot, origin: 29.9 + slot });
        } else {
          goodsTemplates.push({ innerIdx: 0, title: `${name}入门款`, desc: '性价比之选', price: 12.5 + catIdx, origin: 18.0 + catIdx });
          goodsTemplates.push({ innerIdx: numInnerCats > 1 ? 1 : 0, title: `${name}搭配款`, desc: '可与入门款组合下单', price: 24.8 + slot, origin: 35.0 + slot });
        }

        for (let gi = 0; gi < goodsTemplates.length; gi += 1) {
          const g = goodsTemplates[gi];
          const gNo = `G${31000 + catIdx * 100 + slot}${gi + 1}`;
          const ck = innerDefs[g.innerIdx].category_key;
          const img = goodMainImageUrl(shopMeta, ck, gNo, '.jpg');
          await MarketGood.create(
            {
              goods_no: gNo,
              shop_id: shop.id,
              category_key: ck,
              name: g.title,
              description: g.desc,
              main_image: img,
              images: null,
              price: String(g.price.toFixed(2)),
              origin_price: String(g.origin.toFixed(2)),
              stock: 80 + gi * 30 + catIdx,
              sold_count: gi * 5,
              status: 'on_sale',
              sort_order: 100 - gi * 5
            },
            { transaction: t }
          );
        }
      }
    }

    await t.commit();
    console.log('✅ 已新建 10×5 家店铺及店内分类、商品（数据库）');
  } catch (e) {
    await t.rollback();
    console.error('❌ 事务失败:', e);
    process.exitCode = 1;
    return;
  }

  // 复制图片到分层目录（事务外即可）
  let seq = 0;
  for (let catIdx = 0; catIdx < 10; catIdx += 1) {
    const catCode = categories[catIdx].code;
    for (let slot = 1; slot <= SHOPS_PER_CATEGORY; slot += 1) {
      seq += 1;
      const shopNo = shopNoFor(catIdx, slot);
      const shopMeta = { category: catCode, shop_no: shopNo };
      const roles = ['logo', 'cover', 'facade', 'interior', 'license'];
      const usedShopIdx = new Set();
      roles.forEach((role, ri) => {
        let idx = pickPoolIndex(seq, ri + 1) % shopPool.length;
        let step = 0;
        while (usedShopIdx.has(idx) && step < shopPool.length) {
          idx = (idx + 1) % shopPool.length;
          step += 1;
        }
        usedShopIdx.add(idx);
        const dest = shopMediaUrl(shopMeta, role, '.jpg');
        copyPoolToDest(shopPool[idx], dest);
      });

      const shop = await MarketShop.findOne({ where: { shop_no: shopNo } });
      if (!shop) continue;
      const goods = await MarketGood.findAll({ where: { shop_id: shop.id } });
      const usedGoodsIdx = new Set();
      goods.forEach((row, gi) => {
        let idx = pickPoolIndex(seq, 50 + gi) % goodsPool.length;
        let step = 0;
        while (usedGoodsIdx.has(idx) && step < goodsPool.length) {
          idx = (idx + 1) % goodsPool.length;
          step += 1;
        }
        usedGoodsIdx.add(idx);
        copyPoolToDest(goodsPool[idx], row.main_image);
      });
    }
  }
  console.log('✅ 已复制图片到 uploads 分层目录（若池较小则不同店仍会复用部分图）');
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
