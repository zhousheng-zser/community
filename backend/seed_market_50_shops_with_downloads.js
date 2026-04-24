/**
 * 创建 50 家店铺（AAAA~AAAJ 各 5 家）及商品（每店 8~12），并下载免费图片落盘。
 *
 * 用法：
 *   cd backend
 *   node seed_market_50_shops_with_downloads.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { Op } = require('sequelize');
const { pathSegment, shopMediaUrl, goodMainImageUrl } = require('./scripts/lib/market_upload_paths');
const { UPLOAD_ROOT } = require('./scripts/lib/seed_mkdir_cp');
const { MARKET_CATEGORY_MAPPINGS } = require('./src/constants/marketCategoryMap');
const {
  sequelize,
  MarketShop,
  MarketShopCategory,
  MarketGood
} = require('./src/models');

const BASE_LAT = 31.1694;
const BASE_LNG = 121.3783;
const SHOPS_PER_CATEGORY = 5;
const TARGET_SHOPS = 50;
const MIN_GOODS_PER_SHOP = 8;
const MAX_GOODS_PER_SHOP = 12;
const MIN_IMAGE_BYTES = 15 * 1024;
const SHOP_MEDIA_ROLES = ['logo', 'cover', 'facade', 'interior', 'license'];
const REMOTE_POOL_DIR = path.join(UPLOAD_ROOT, 'market', '_remote_pool');

const SHOP_NAME_LIBRARY = {
  AAAA: ['生鲜优选', '鲜食工坊', '家常菜篮', '每日果蔬', '食光市集'],
  AAAB: ['美妆优选', '净护生活', '颜值研究所', '护肤小站', '悦己洗护'],
  AAAC: ['居家优选', '生活百货', '家居小栈', '厨房好物', '日用精选'],
  AAAD: ['衣橱精选', '时尚箱包', '轻奢服饰', '都市穿搭', '潮流鞋包'],
  AAAE: ['母婴生活', '宝宝优选', '亲子成长', '婴童好物', '妈咪优品'],
  AAAF: ['电器优选', '家电到家', '智能家居', '小电器馆', '品质电器'],
  AAAG: ['数码优选', '科技小站', '手机配件', '影音设备', '数码工坊'],
  AAAH: ['饰品优选', '珠宝小馆', '轻奢饰界', '银饰工坊', '雅致首饰'],
  AAAI: ['出行优选', '旅行补给', '户外装备', '轻旅好物', '城市出行'],
  AAAJ: ['传统工艺', '手作工坊', '非遗小馆', '匠心艺品', '国风器物']
};

const INNER_CATEGORY_LIBRARY = {
  AAAA: ['蔬菜水果', '肉禽蛋品', '速食冷冻', '粮油调味'],
  AAAB: ['面部护理', '身体洗护', '美妆彩妆', '香氛个护'],
  AAAC: ['厨房用品', '清洁收纳', '床品家纺', '家居摆件'],
  AAAD: ['上衣外套', '裤装裙装', '鞋履箱包', '配饰小物'],
  AAAE: ['奶粉辅食', '纸尿裤湿巾', '童装童鞋', '玩具启蒙'],
  AAAF: ['厨房电器', '生活电器', '清洁电器', '个护电器'],
  AAAG: ['手机平板', '电脑配件', '影音设备', '智能穿戴'],
  AAAH: ['项链耳饰', '手链戒指', '发饰胸针', '礼盒套装'],
  AAAI: ['旅行箱包', '露营装备', '骑行用品', '酒店周边'],
  AAAJ: ['木作竹编', '陶瓷器皿', '布艺织染', '文创摆件']
};

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomCoordNearHechuan(radiusKm = 5) {
  const rKm = radiusKm * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  const latRad = (BASE_LAT * Math.PI) / 180;
  const dLat = (rKm / 111) * Math.cos(theta);
  const dLng = (rKm / (111 * Math.cos(latRad))) * Math.sin(theta);
  return {
    latitude: Math.round((BASE_LAT + dLat) * 1e7) / 1e7,
    longitude: Math.round((BASE_LNG + dLng) * 1e7) / 1e7
  };
}

function buildAddress(shopName) {
  const roads = ['合川路', '万源路', '虹泉路', '龙茗路', '漕宝路', '吴中路'];
  const no = randomInt(88, 999);
  const road = roads[randomInt(0, roads.length - 1)];
  return `上海市闵行区${road}${no}号（合川路地铁站约5km内）${shopName}`;
}

function toAbsByUploadUrl(uploadUrl) {
  if (!uploadUrl || typeof uploadUrl !== 'string' || !uploadUrl.startsWith('/uploads/')) return null;
  return path.join(UPLOAD_ROOT, uploadUrl.slice('/uploads/'.length).split('/').join(path.sep));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function normalizeExtFromContentType(contentType) {
  const t = String(contentType || '').toLowerCase();
  if (t.includes('image/png')) return '.png';
  if (t.includes('image/webp')) return '.webp';
  if (t.includes('image/jpeg') || t.includes('image/jpg')) return '.jpg';
  return '.jpg';
}

function requestBinary(url) {
  return new Promise((resolve, reject) => {
    const tryFetch = (target, redirectCount = 0) => {
      const lib = target.startsWith('https') ? https : http;
      const req = lib.request(
        target,
        {
          method: 'GET',
          timeout: 8000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: 'https://www.baidu.com/'
          }
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectCount < 5) {
            res.resume();
            const nextUrl = new URL(res.headers.location, target).href;
            tryFetch(nextUrl, redirectCount + 1);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const ext = normalizeExtFromContentType(res.headers['content-type']);
            resolve({ buffer, ext });
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.end();
    };
    tryFetch(url);
  });
}

function getRemoteImageCandidates(seed) {
  const encoded = encodeURIComponent(seed);
  return [
    // 国内随机图接口（可匿名访问，存在偶发 403，脚本会自动降级）
    `https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images&method=pc&t=${Date.now()}_${encoded}`,
    `https://api.vvhan.com/api/wallpaper/acg?type=json`,
    // 国外开放免费图库，作为稳定兜底
    `https://picsum.photos/seed/${encoded}/1280/960`,
    `https://loremflickr.com/1280/960/store,shop?lock=${Math.abs(seed.length * 13 + Date.now())}`
  ];
}

async function downloadRemotePool(targetCount = 420) {
  ensureDir(REMOTE_POOL_DIR);
  const existing = fs
    .readdirSync(REMOTE_POOL_DIR, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.(jpe?g|png|webp)$/i.test(d.name))
    .map((d) => path.join(REMOTE_POOL_DIR, d.name));
  if (existing.length >= targetCount) {
    return { ok: existing.length, fail: 0, files: existing };
  }

  let ok = existing.length;
  let fail = 0;
  let fileSeq = ok;
  const categories = MARKET_CATEGORY_MAPPINGS.map((x) => x.name).join(',');
  let attempts = 0;
  while (ok < targetCount) {
    attempts += 1;
    const seed = `${categories}_${ok}_${Math.random().toString(36).slice(2, 8)}`;
    const candidates = getRemoteImageCandidates(seed);
    let success = false;
    for (let i = 0; i < candidates.length; i += 1) {
      const url = candidates[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        const { buffer, ext } = await requestBinary(url);
        if (!buffer || buffer.length < MIN_IMAGE_BYTES) {
          throw new Error(`image-too-small-${buffer ? buffer.length : 0}`);
        }
        fileSeq += 1;
        const fn = `remote_${String(fileSeq).padStart(5, '0')}${ext}`;
        const fp = path.join(REMOTE_POOL_DIR, fn);
        fs.writeFileSync(fp, buffer);
        ok += 1;
        success = true;
        break;
      } catch (e) {
        if (i === candidates.length - 1) fail += 1;
      }
    }

    // 防止网络不可用时长时间阻塞，失败较多则退出并回退本地池
    if (!success && fail >= 12) break;
    if (attempts >= 120) break;
  }

  const files = fs
    .readdirSync(REMOTE_POOL_DIR, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.(jpe?g|png|webp)$/i.test(d.name))
    .map((d) => path.join(REMOTE_POOL_DIR, d.name))
    .sort();
  return { ok, fail, files };
}

function generateShopNoList(existingShopNos) {
  const set = new Set(existingShopNos);
  const list = [];
  let n = 32001;
  while (list.length < TARGET_SHOPS) {
    const v = `SHOP${n}`;
    if (!set.has(v)) list.push(v);
    n += 1;
  }
  return list;
}

function pickDistinctIndexes(poolSize, count) {
  const used = new Set();
  const out = [];
  while (out.length < count) {
    const idx = randomInt(0, poolSize - 1);
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(idx);
    if (used.size >= poolSize) break;
  }
  while (out.length < count) out.push(randomInt(0, poolSize - 1));
  return out;
}

function copyFileToUpload(srcAbs, destUploadUrl) {
  const destAbs = toAbsByUploadUrl(destUploadUrl);
  if (!destAbs) return false;
  ensureDir(path.dirname(destAbs));
  fs.copyFileSync(srcAbs, destAbs);
  return true;
}

function buildGoodsName(shopName, innerName, index) {
  const suffixes = ['精选款', '热销款', '推荐款', '畅销款', '到家款', '加购款'];
  const s = suffixes[index % suffixes.length];
  return `${shopName}${innerName}${s}`;
}

async function insertDataWithTransaction(pool) {
  const existing = await MarketShop.findAll({ attributes: ['shop_no'] });
  const shopNos = generateShopNoList(existing.map((x) => x.shop_no));
  const report = {
    shopCount: 0,
    goodsCount: 0,
    categoryCount: {},
    sampleShops: []
  };

  let shopNoIndex = 0;
  const t = await sequelize.transaction();
  try {
    for (let catIdx = 0; catIdx < MARKET_CATEGORY_MAPPINGS.length; catIdx += 1) {
      const { code, name } = MARKET_CATEGORY_MAPPINGS[catIdx];
      report.categoryCount[code] = 0;
      for (let s = 0; s < SHOPS_PER_CATEGORY; s += 1) {
        const shopNo = shopNos[shopNoIndex];
        shopNoIndex += 1;
        const namePool = SHOP_NAME_LIBRARY[code] || ['示例店铺'];
        const shopName = `${name}·${namePool[s % namePool.length]}${s + 1}号店`;
        const coord = randomCoordNearHechuan(5);
        const shopMeta = { category: code, shop_no: shopNo };

        const shop = await MarketShop.create(
          {
            shop_no: shopNo,
            name: shopName,
            category: code,
            notice: `${name}新店开业，欢迎下单`,
            delivery_type: 'platform',
            min_order_amount: randomInt(0, 3) * 10,
            delivery_fee: randomInt(2, 8),
            avg_delivery_minutes: randomInt(25, 45),
            rating: Number((4.5 + Math.random() * 0.45).toFixed(2)),
            sold_count: randomInt(30, 450),
            is_open: 1,
            is_active: 1,
            sort_order: 1000 - catIdx * 20 - s,
            address: buildAddress(shopName),
            latitude: coord.latitude,
            longitude: coord.longitude,
            contact_name: `联系人${randomInt(1, 9)}`,
            contact_phone: `138${String(randomInt(10000000, 99999999))}`,
            business_hours: '09:00-22:00',
            logo_url: shopMediaUrl(shopMeta, 'logo', '.jpg'),
            cover_url: shopMediaUrl(shopMeta, 'cover', '.jpg'),
            facade_image: shopMediaUrl(shopMeta, 'facade', '.jpg'),
            interior_image: shopMediaUrl(shopMeta, 'interior', '.jpg'),
            license_image: shopMediaUrl(shopMeta, 'license', '.jpg')
          },
          { transaction: t }
        );

        const innerNames = INNER_CATEGORY_LIBRARY[code] || [`${name}精选`];
        const innerCount = randomInt(2, 4);
        const innerDefs = [];
        for (let c = 0; c < innerCount; c += 1) {
          const categoryKey = `in_${catIdx}_${s + 1}_${c + 1}`;
          const categoryName = innerNames[c % innerNames.length];
          innerDefs.push({ category_key: categoryKey, category_name: categoryName });
          await MarketShopCategory.create(
            {
              shop_id: shop.id,
              category_key: categoryKey,
              category_name: categoryName,
              sort_order: 100 - c * 10,
              is_active: 1
            },
            { transaction: t }
          );
        }

        const goodsCount = randomInt(MIN_GOODS_PER_SHOP, MAX_GOODS_PER_SHOP);
        for (let g = 1; g <= goodsCount; g += 1) {
          const goodsNo = `G${shopNo.slice(4)}${String(g).padStart(2, '0')}`;
          const inner = innerDefs[(g - 1) % innerDefs.length];
          const price = Number((9.9 + Math.random() * 189).toFixed(2));
          const origin = Number((price + 5 + Math.random() * 20).toFixed(2));
          const imageUrl = goodMainImageUrl(shopMeta, inner.category_key, goodsNo, '.jpg');
          await MarketGood.create(
            {
              goods_no: goodsNo,
              shop_id: shop.id,
              category_key: inner.category_key,
              name: buildGoodsName(shopName, inner.category_name, g),
              description: `${inner.category_name}分类商品，合川路附近配送`,
              main_image: imageUrl,
              images: null,
              price: String(price),
              origin_price: String(origin),
              stock: randomInt(40, 250),
              safe_stock: randomInt(3, 15),
              sold_count: randomInt(0, 40),
              status: 'on_sale',
              sort_order: 200 - g
            },
            { transaction: t }
          );
        }

        report.shopCount += 1;
        report.goodsCount += goodsCount;
        report.categoryCount[code] += 1;
        report.sampleShops.push({ shop_no: shopNo, category: code, name: shopName });
      }
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  // 复制图片：店铺 5 张 + 商品 1 张
  const createdShopNos = report.sampleShops.map((x) => x.shop_no);
  const shops = await MarketShop.findAll({
    where: { shop_no: { [Op.in]: createdShopNos } },
    attributes: ['id', 'shop_no', 'category']
  });
  let copiedShopImages = 0;
  let copiedGoodsImages = 0;

  for (const shop of shops) {
    const shopMeta = { category: shop.category, shop_no: shop.shop_no };
    const shopPickIdx = pickDistinctIndexes(pool.length, SHOP_MEDIA_ROLES.length);
    for (let i = 0; i < SHOP_MEDIA_ROLES.length; i += 1) {
      const role = SHOP_MEDIA_ROLES[i];
      const src = pool[shopPickIdx[i] % pool.length];
      const dest = shopMediaUrl(shopMeta, role, '.jpg');
      if (copyFileToUpload(src, dest)) copiedShopImages += 1;
    }

    const goodsRows = await MarketGood.findAll({
      where: { shop_id: shop.id },
      attributes: ['main_image']
    });
    const goodsPickIdx = pickDistinctIndexes(pool.length, goodsRows.length);
    for (let i = 0; i < goodsRows.length; i += 1) {
      const src = pool[goodsPickIdx[i] % pool.length];
      if (copyFileToUpload(src, goodsRows[i].main_image)) copiedGoodsImages += 1;
    }
  }

  report.copiedShopImages = copiedShopImages;
  report.copiedGoodsImages = copiedGoodsImages;
  return report;
}

async function verifyResult(sampleShopNos) {
  const shopCount = await MarketShop.count({ where: { shop_no: { [Op.in]: sampleShopNos } } });
  const shops = await MarketShop.findAll({
    where: { shop_no: { [Op.in]: sampleShopNos } },
    attributes: ['id', 'shop_no', 'category']
  });
  let minGoods = Infinity;
  let maxGoods = 0;
  let missingFiles = 0;
  const coveredCategories = new Set();
  for (const s of shops) {
    coveredCategories.add(s.category);
    const goods = await MarketGood.findAll({
      where: { shop_id: s.id },
      attributes: ['main_image']
    });
    minGoods = Math.min(minGoods, goods.length);
    maxGoods = Math.max(maxGoods, goods.length);

    const mediaUrls = [
      shopMediaUrl({ category: s.category, shop_no: s.shop_no }, 'logo', '.jpg'),
      shopMediaUrl({ category: s.category, shop_no: s.shop_no }, 'cover', '.jpg'),
      shopMediaUrl({ category: s.category, shop_no: s.shop_no }, 'facade', '.jpg'),
      shopMediaUrl({ category: s.category, shop_no: s.shop_no }, 'interior', '.jpg'),
      shopMediaUrl({ category: s.category, shop_no: s.shop_no }, 'license', '.jpg')
    ];
    for (const u of mediaUrls) {
      const abs = toAbsByUploadUrl(u);
      if (!abs || !fs.existsSync(abs)) missingFiles += 1;
    }
    for (const g of goods) {
      const abs = toAbsByUploadUrl(g.main_image);
      if (!abs || !fs.existsSync(abs)) missingFiles += 1;
    }
  }
  return {
    createdShops: shopCount,
    categoryCovered: coveredCategories.size,
    minGoodsPerShop: Number.isFinite(minGoods) ? minGoods : 0,
    maxGoodsPerShop: maxGoods,
    missingFiles
  };
}

async function main() {
  await sequelize.authenticate();
  console.log('✅ 数据库连接成功（dev）');

  const remoteResult = await downloadRemotePool(120);
  const pool = remoteResult.files;

  if (pool.length < 120) {
    throw new Error(
      `远程可用图片不足（${pool.length}），已禁用本地图片池回退。请检查网络后重试。`
    );
  }

  console.log(`📷 图片池就绪：remote=${remoteResult.ok}, remote_fail=${remoteResult.fail}, total=${pool.length}`);
  const report = await insertDataWithTransaction(pool);
  const sampleShopNos = report.sampleShops.map((x) => x.shop_no);
  const verify = await verifyResult(sampleShopNos);

  console.log('---------------- 结果 ----------------');
  console.log(`新增店铺：${report.shopCount}（目标 50）`);
  console.log(`新增商品：${report.goodsCount}`);
  console.log(`店铺图片复制：${report.copiedShopImages}`);
  console.log(`商品图片复制：${report.copiedGoodsImages}`);
  console.log(`分类覆盖：${verify.categoryCovered}/10`);
  console.log(`每店商品数范围：${verify.minGoodsPerShop} ~ ${verify.maxGoodsPerShop}`);
  console.log(`缺失文件数：${verify.missingFiles}`);
  console.log('分类分布：', report.categoryCount);
  console.log('示例店铺（前5）：', report.sampleShops.slice(0, 5));

  await sequelize.close();
}

main().catch(async (e) => {
  console.error('❌ 执行失败：', e.message || e);
  try {
    await sequelize.close();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
