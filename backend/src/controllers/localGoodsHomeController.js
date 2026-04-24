const { Op } = require('sequelize');
const {
  MarketGood,
  MarketShop,
  LgHomeDailyNewsProduct,
  LgHomeTopSalesProduct,
  LgHomePeriodicModule,
  LgHomePeriodicModuleProduct,
  LgHomeFeedModule,
  LgHomeFeedModuleProduct,
  LgHomeZone,
  LgHomeZoneProduct,
  LgHomeZoneGiftSubcategory,
  LgHomeZoneSidebarCategory,
  LgHomeChannel,
  LgHomeChannelProduct,
  LgHomeChannelTab,
  LgHomeChannelTabProduct
} = require('../models');

function ok(data) {
  return { code: 0, msg: 'ok', data };
}

function parseUserCoords(q) {
  const latRaw = q.user_lat ?? q.userLat;
  const lngRaw = q.user_lng ?? q.userLng;
  if (latRaw === undefined || latRaw === '' || lngRaw === undefined || lngRaw === '') return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseRadiusKm(q) {
  const raw = q.distance_km ?? q.radius_km;
  if (raw === undefined || raw === '') return 5;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 5;
  return Math.min(n, 50);
}

function absUrl(u) {
  if (!u || typeof u !== 'string') return '';
  if (/^https?:\/\//i.test(u)) return u;
  const base = process.env.PUBLIC_API_BASE || process.env.API_PUBLIC_URL || '';
  if (!base) return u;
  return `${String(base).replace(/\/$/, '')}${u.startsWith('/') ? u : `/${u}`}`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function rowTimeOk(row) {
  if (row.start_at == null && row.end_at == null) return true;
  const now = Date.now();
  if (row.start_at && new Date(row.start_at).getTime() > now) return false;
  if (row.end_at && new Date(row.end_at).getTime() < now) return false;
  return true;
}

function formatItem(good, shop, distKm) {
  return {
    id: Number(good.id),
    name: good.name,
    pay_price: Number(good.price),
    rebate_amount: 0,
    main_image: absUrl(good.main_image),
    shop_id: Number(shop.id),
    distance_km: Math.round(distKm * 100) / 100
  };
}

/**
 * @param {Array<{goods_id:number,shop_id:number,sort:number,status:number,start_at?:Date,end_at?:Date}>} rows
 */
async function mapRowsToGoodsItems(rows, lat, lng, radiusKm, limit) {
  const validRows = rows.filter((r) => r.status === 1 && rowTimeOk(r));
  validRows.sort((a, b) => (b.sort || 0) - (a.sort || 0));
  const goodsIds = [...new Set(validRows.map((r) => Number(r.goods_id)))];
  if (goodsIds.length === 0) return [];

  const goodsList = await MarketGood.findAll({
    where: { id: { [Op.in]: goodsIds }, status: 'on_sale' }
  });
  const goodsMap = new Map(goodsList.map((g) => [Number(g.id), g]));

  const shopIds = [...new Set(validRows.map((r) => Number(r.shop_id)))];
  const shops = await MarketShop.findAll({
    where: { id: { [Op.in]: shopIds }, is_active: 1 }
  });
  const shopMap = new Map(shops.map((s) => [Number(s.id), s]));

  const seen = new Set();
  const out = [];
  for (const r of validRows) {
    const gid = Number(r.goods_id);
    if (seen.has(gid)) continue;
    const g = goodsMap.get(gid);
    if (!g || Number(g.shop_id) !== Number(r.shop_id)) continue;
    const shop = shopMap.get(Number(r.shop_id));
    if (!shop) continue;
    if (shop.latitude == null || shop.longitude == null) continue;
    const dist = haversineKm(lat, lng, Number(shop.latitude), Number(shop.longitude));
    if (dist > radiusKm) continue;
    seen.add(gid);
    out.push(formatItem(g, shop, dist));
    if (limit != null && out.length >= limit) break;
  }
  return out;
}

const DAILY_LIMIT = 10;
const TOP_LIMIT = 10;
const PERIODIC_LIMIT = 10;
const FEED_AGG_LIMIT = 10;

function applyZoneProductFilters(rows, giftSubCategory, sidebarCategory) {
  const g = giftSubCategory ? String(giftSubCategory).trim() : '';
  const s = sidebarCategory ? String(sidebarCategory).trim() : '';
  return rows.filter((r) => {
    if (Number(r.status) !== 1) return false;
    if (g) {
      const code = r.gift_sub_code ? String(r.gift_sub_code).trim() : '';
      if (code && code !== g) return false;
    }
    if (s) {
      const cat = r.sidebar_category ? String(r.sidebar_category).trim() : '';
      if (cat && cat !== s) return false;
    }
    return true;
  });
}

exports.getModules = async (req, res) => {
  try {
    const coords = parseUserCoords(req.query);
    const radiusKm = parseRadiusKm(req.query);

    const emptyPayload = {
      daily_news: [],
      top_sales: [],
      periodic_modules: [],
      feed_modules: []
    };

    if (!coords) {
      return res.json(ok(emptyPayload));
    }

    const { lat, lng } = coords;

    const [dailyRows, topRows, periodicMods, feedMods] = await Promise.all([
      LgHomeDailyNewsProduct.findAll({ where: { status: 1 }, order: [['sort', 'DESC']] }),
      LgHomeTopSalesProduct.findAll({ where: { status: 1 }, order: [['sort', 'DESC']] }),
      LgHomePeriodicModule.findAll({ where: { status: 1 }, order: [['sort', 'DESC']] }),
      LgHomeFeedModule.findAll({ where: { status: 1 }, order: [['sort', 'DESC']] })
    ]);

    const daily_news = await mapRowsToGoodsItems(dailyRows, lat, lng, radiusKm, DAILY_LIMIT);
    const top_sales = await mapRowsToGoodsItems(topRows, lat, lng, radiusKm, TOP_LIMIT);

    const periodic_modules = [];
    for (const m of periodicMods) {
      const rows = await LgHomePeriodicModuleProduct.findAll({
        where: { module_id: m.id, status: 1 },
        order: [['sort', 'DESC']]
      });
      const goods_list = await mapRowsToGoodsItems(rows, lat, lng, radiusKm, PERIODIC_LIMIT);
      periodic_modules.push({ module_name: m.module_name, goods_list });
    }

    const feed_modules = [];
    for (const m of feedMods) {
      const rows = await LgHomeFeedModuleProduct.findAll({
        where: { module_id: m.id, status: 1 },
        order: [['sort', 'DESC']]
      });
      const all = await mapRowsToGoodsItems(rows, lat, lng, radiusKm, null);
      const slice = all.slice(0, FEED_AGG_LIMIT);
      feed_modules.push({
        module_name: m.module_name,
        page: 1,
        has_more: all.length > FEED_AGG_LIMIT,
        goods_list: slice
      });
    }

    return res.json(
      ok({
        daily_news,
        top_sales,
        periodic_modules,
        feed_modules
      })
    );
  } catch (e) {
    console.error('local-goods-home modules error:', e);
    return res.status(500).json({ code: 500, msg: '获取首页本地商城失败', data: null });
  }
};

exports.getFeedProducts = async (req, res) => {
  try {
    const moduleName = req.query.module_name != null ? String(req.query.module_name).trim() : '';
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 10;
    const coords = parseUserCoords(req.query);
    const radiusKm = parseRadiusKm(req.query);

    if (!moduleName) {
      return res.status(400).json({ code: 40001, msg: '缺少 module_name', data: null });
    }
    if (page < 1) {
      return res.status(400).json({ code: 40002, msg: 'page 非法', data: null });
    }
    const ps = Math.min(Math.max(pageSize, 1), 50);

    if (!coords) {
      return res.json(ok({ list: [], has_more: false }));
    }

    const mod = await LgHomeFeedModule.findOne({ where: { module_name: moduleName, status: 1 } });
    if (!mod) {
      return res.json(ok({ list: [], has_more: false }));
    }

    const rows = await LgHomeFeedModuleProduct.findAll({
      where: { module_id: mod.id, status: 1 },
      order: [['sort', 'DESC']]
    });
    const { lat, lng } = coords;
    const all = await mapRowsToGoodsItems(rows, lat, lng, radiusKm, null);
    const offset = (page - 1) * ps;
    const list = all.slice(offset, offset + ps);
    const has_more = all.length > offset + ps;

    return res.json(ok({ list, has_more }));
  } catch (e) {
    console.error('local-goods-home feed-products error:', e);
    return res.status(500).json({ code: 500, msg: '获取 Feed 商品失败', data: null });
  }
};

exports.getZoneProducts = async (req, res) => {
  try {
    const zoneId = parseInt(req.query.zone_id, 10);
    if (!Number.isFinite(zoneId) || zoneId < 1 || zoneId > 4) {
      return res.status(400).json({ code: 40004, msg: 'zone_id 须为 1～4', data: null });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 40;
    const ps = Math.min(Math.max(pageSize, 1), 50);
    if (page < 1) {
      return res.status(400).json({ code: 40002, msg: 'page 非法', data: null });
    }

    const coords = parseUserCoords(req.query);
    const radiusKm = parseRadiusKm(req.query);
    const giftSubCategory = req.query.gift_sub_category != null ? String(req.query.gift_sub_category).trim() : '';
    const sidebarCategory = req.query.sidebar_category != null ? String(req.query.sidebar_category).trim() : '';

    const zone = await LgHomeZone.findByPk(zoneId);
    const zoneActive = !!(zone && Number(zone.status) === 1);

    let sub_categories = [];
    let sidebar_categories = [];
    if (zoneId === 2) {
      const subs = await LgHomeZoneGiftSubcategory.findAll({
        where: { zone_id: 2, status: 1 },
        order: [['sort', 'DESC']]
      });
      sub_categories = subs.map((x) => ({
        name: x.name,
        image: absUrl(x.cover_image || '')
      }));
    }
    if (zoneId === 3) {
      const sides = await LgHomeZoneSidebarCategory.findAll({
        where: { zone_id: 3, status: 1 },
        order: [['sort', 'DESC']]
      });
      sidebar_categories = sides.map((x) => x.category_name);
    }

    const emptyData = { list: [], sub_categories, sidebar_categories };
    if (!coords || !zoneActive) {
      return res.json(ok(emptyData));
    }

    const { lat, lng } = coords;
    let rows = await LgHomeZoneProduct.findAll({
      where: { zone_id: zoneId, status: 1 },
      order: [['sort', 'DESC']]
    });
    rows = applyZoneProductFilters(rows, giftSubCategory || undefined, sidebarCategory || undefined);
    const all = await mapRowsToGoodsItems(rows, lat, lng, radiusKm, null);
    const offset = (page - 1) * ps;
    const list = all.slice(offset, offset + ps);

    return res.json(ok({ list, sub_categories, sidebar_categories }));
  } catch (e) {
    console.error('local-goods-home zone-products error:', e);
    return res.status(500).json({ code: 500, msg: '获取专区商品失败', data: null });
  }
};

const CHANNEL_KEYS = new Set(['brand_goods', 'jiuzhou_haowu', 'autumn_winter']);

exports.getChannelProducts = async (req, res) => {
  try {
    const channelKey = req.query.channel_key != null ? String(req.query.channel_key).trim() : '';
    if (!CHANNEL_KEYS.has(channelKey)) {
      return res.status(400).json({ code: 40006, msg: 'channel_key 非法', data: null });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 20;
    const ps = Math.min(Math.max(pageSize, 1), 50);
    if (page < 1) {
      return res.status(400).json({ code: 40002, msg: 'page 非法', data: null });
    }

    const coords = parseUserCoords(req.query);
    const radiusKm = parseRadiusKm(req.query);

    const ch = await LgHomeChannel.findOne({ where: { channel_key: channelKey, status: 1 } });
    if (!ch) {
      return res.json(ok({ list: [] }));
    }

    const tabs = await LgHomeChannelTab.findAll({
      where: { channel_id: ch.id, status: 1 },
      order: [['sort', 'DESC']]
    });

    if (!coords) {
      if (tabs.length > 0) return res.json(ok({ tab_groups: [] }));
      return res.json(ok({ list: [] }));
    }

    const { lat, lng } = coords;

    if (tabs.length > 0) {
      const tab_groups = [];
      for (const tab of tabs) {
        const rows = await LgHomeChannelTabProduct.findAll({
          where: { tab_id: tab.id, status: 1 },
          order: [['sort', 'DESC']]
        });
        const goods_list = await mapRowsToGoodsItems(rows, lat, lng, radiusKm, null);
        tab_groups.push({ tab_name: tab.tab_name, goods_list });
      }
      return res.json(ok({ tab_groups }));
    }

    const rows = await LgHomeChannelProduct.findAll({
      where: { channel_id: ch.id, status: 1 },
      order: [['sort', 'DESC']]
    });
    const all = await mapRowsToGoodsItems(rows, lat, lng, radiusKm, null);
    const offset = (page - 1) * ps;
    const list = all.slice(offset, offset + ps);

    return res.json(ok({ list }));
  } catch (e) {
    console.error('local-goods-home channel-products error:', e);
    return res.status(500).json({ code: 500, msg: '获取频道商品失败', data: null });
  }
};

async function callWithFixedQuery(req, res, extraQuery, handler) {
  const nextReq = { query: { ...(req.query || {}), ...extraQuery } };
  return handler(nextReq, res);
}

exports.getBrandGoods = async (req, res) =>
  callWithFixedQuery(req, res, { channel_key: 'brand_goods' }, exports.getChannelProducts);

exports.getJiuzhouHaowu = async (req, res) =>
  callWithFixedQuery(req, res, { channel_key: 'jiuzhou_haowu' }, exports.getChannelProducts);

exports.getAutumnWinter = async (req, res) =>
  callWithFixedQuery(req, res, { channel_key: 'autumn_winter' }, exports.getChannelProducts);

exports.getHotZone = async (req, res) =>
  callWithFixedQuery(req, res, { zone_id: 1 }, exports.getZoneProducts);

exports.getGiftZone = async (req, res) =>
  callWithFixedQuery(req, res, { zone_id: 2 }, exports.getZoneProducts);

exports.getPickZone = async (req, res) =>
  callWithFixedQuery(req, res, { zone_id: 3 }, exports.getZoneProducts);

exports.getHighCommZone = async (req, res) =>
  callWithFixedQuery(req, res, { zone_id: 4 }, exports.getZoneProducts);

async function fetchRankList(Model, req, limit) {
  const coords = parseUserCoords(req.query || {});
  const radiusKm = parseRadiusKm(req.query || {});
  if (!coords) return [];
  const rows = await Model.findAll({ where: { status: 1 }, order: [['sort', 'DESC']] });
  return mapRowsToGoodsItems(rows, coords.lat, coords.lng, radiusKm, limit);
}

async function fetchPeriodicListByAliases(req, aliases, limit) {
  const coords = parseUserCoords(req.query || {});
  const radiusKm = parseRadiusKm(req.query || {});
  if (!coords) return [];

  const mod = await LgHomePeriodicModule.findOne({
    where: { status: 1, module_name: { [Op.in]: aliases } },
    order: [['sort', 'DESC']]
  });
  if (!mod) return [];

  const rows = await LgHomePeriodicModuleProduct.findAll({
    where: { module_id: mod.id, status: 1 },
    order: [['sort', 'DESC']]
  });

  return mapRowsToGoodsItems(rows, coords.lat, coords.lng, radiusKm, limit);
}

exports.getDailyNews = async (req, res) => {
  try {
    const list = await fetchRankList(LgHomeDailyNewsProduct, req, DAILY_LIMIT);
    return res.json(ok({ list }));
  } catch (e) {
    console.error('local-goods-home daily-news error:', e);
    return res.status(500).json({ code: 500, msg: '获取每日上新失败', data: null });
  }
};

exports.getTopSales = async (req, res) => {
  try {
    const list = await fetchRankList(LgHomeTopSalesProduct, req, TOP_LIMIT);
    return res.json(ok({ list }));
  } catch (e) {
    console.error('local-goods-home top-sales error:', e);
    return res.status(500).json({ code: 500, msg: '获取热门TOP榜失败', data: null });
  }
};

const TODAY_PUSH_ALIASES = ['今日主推', 'today_push', 'today-push', 'todayPush'];
const WEEK_SELECT_ALIASES = ['本周甄选', 'week_select', 'week-select', 'weekSelect'];

exports.getTodayPush = async (req, res) => {
  try {
    const list = await fetchPeriodicListByAliases(req, TODAY_PUSH_ALIASES, PERIODIC_LIMIT);
    return res.json(ok({ list }));
  } catch (e) {
    console.error('local-goods-home today-push error:', e);
    return res.status(500).json({ code: 500, msg: '获取今日主推失败', data: null });
  }
};

exports.getWeekSelect = async (req, res) => {
  try {
    const list = await fetchPeriodicListByAliases(req, WEEK_SELECT_ALIASES, PERIODIC_LIMIT);
    return res.json(ok({ list }));
  } catch (e) {
    console.error('local-goods-home week-select error:', e);
    return res.status(500).json({ code: 500, msg: '获取本周甄选失败', data: null });
  }
};
