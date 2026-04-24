const { Op } = require('sequelize');
const { MarketShop, MarketShopCategory, MarketGood, MarketGoodSku, MarketShopReview, sequelize } = require('../models');
const { normalizeShopCategory } = require('../constants/marketCategoryMap');
const { buildSkuTreeFromRows } = require('../utils/marketSku');

function ok(data) {
  return { code: 0, msg: 'ok', data };
}

/**
 * 与前端 normalizeMarketShop / loadShopFromApi 对齐：库表仅有 cover_url、logo_url 等，
 * 补充别名 cover、logo、cover_image、list_cover_url，避免仅认旧字段名时为空。
 */
function enrichShopJson(j) {
  if (!j || typeof j !== 'object') return j;
  const out = { ...j };
  if (out.cover_url != null && out.cover_url !== '' && out.cover == null) out.cover = out.cover_url;
  if (out.logo_url != null && out.logo_url !== '' && out.logo == null) out.logo = out.logo_url;
  if (out.cover_url != null && out.cover_url !== '') {
    if (out.cover_image == null) out.cover_image = out.cover_url;
    if (out.list_cover_url == null) out.list_cover_url = out.cover_url;
  }
  return out;
}

function enrichGoodJson(j) {
  if (!j || typeof j !== 'object') return j;
  const out = { ...j };
  if (out.main_image != null && out.main_image !== '' && out.image == null) out.image = out.main_image;
  return out;
}

function parseUserCoords(q) {
  const latRaw = q.user_lat ?? q.userLat;
  const lngRaw = q.user_lng ?? q.userLng;
  if (latRaw === undefined || latRaw === '' || lngRaw === undefined || lngRaw === '') {
    return null;
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function defaultRadiusKm() {
  const e = process.env.MARKET_SHOP_RADIUS_KM;
  if (e !== undefined && e !== '') {
    const n = Number(e);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 5;
}

/** Haversine 距离（km）；须与 Sequelize 查询别名 `MarketShop` 一致 */
function distanceKmSql(latNum, lngNum) {
  return `(
    6371 * ACOS(LEAST(1, GREATEST(-1,
      COS(RADIANS(${latNum})) * COS(RADIANS(\`MarketShop\`.\`latitude\`)) * COS(RADIANS(\`MarketShop\`.\`longitude\`) - RADIANS(${lngNum}))
      + SIN(RADIANS(${latNum})) * SIN(RADIANS(\`MarketShop\`.\`latitude\`))
    )))
  )`;
}

exports.listShops = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 10;
    const offset = (page - 1) * pageSize;
    const where = { is_active: 1 };
    if (req.query.category) where.category = normalizeShopCategory(req.query.category);

    let sort = req.query.sort || 'comprehensive';
    const coords = parseUserCoords(req.query);

    if (!coords) {
      if (sort === 'distance') sort = 'comprehensive';
      const order = [];
      if (sort === 'sales') order.push(['sold_count', 'DESC']);
      else if (sort === 'delivery_time') order.push(['avg_delivery_minutes', 'ASC']);
      else order.push(['sort_order', 'DESC']);
      const { rows, count } = await MarketShop.findAndCountAll({ where, order, offset, limit: pageSize });
      const list = rows.map((r) => {
        const j = enrichShopJson(r.toJSON());
        j.distance_km = null;
        return j;
      });
      return res.json(ok({ list, page, page_size: pageSize, total: count, sort_applied: sort }));
    }

    const radiusRaw = req.query.radius_km;
    const r =
      radiusRaw !== undefined && radiusRaw !== ''
        ? Number(radiusRaw)
        : defaultRadiusKm();
    const radiusKm = Number.isFinite(r) && r > 0 ? r : defaultRadiusKm();

    const { lat, lng } = coords;
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const distSql = distanceKmSql(latNum, lngNum);
    const distanceLiteral = sequelize.literal(distSql);

    const whereWithDist = {
      [Op.and]: [
        where,
        { latitude: { [Op.ne]: null } },
        { longitude: { [Op.ne]: null } },
        sequelize.where(distanceLiteral, { [Op.lte]: radiusKm })
      ]
    };

    let order = [];
    if (sort === 'distance') {
      order = [[sequelize.literal(distSql), 'ASC']];
    } else if (sort === 'sales') {
      order = [['sold_count', 'DESC'], [sequelize.literal(distSql), 'ASC']];
    } else if (sort === 'delivery_time') {
      order = [['avg_delivery_minutes', 'ASC'], [sequelize.literal(distSql), 'ASC']];
    } else {
      order = [['sort_order', 'DESC'], ['sold_count', 'DESC'], [sequelize.literal(distSql), 'ASC']];
    }

    const { rows, count } = await MarketShop.findAndCountAll({
      where: whereWithDist,
      attributes: { include: [[sequelize.literal(distSql), 'distance_km']] },
      order,
      offset,
      limit: pageSize,
      subQuery: false
    });

    const list = rows.map((row) => {
      const j = enrichShopJson(row.toJSON());
      if (j.distance_km != null && j.distance_km !== '') {
        j.distance_km = Math.round(Number(j.distance_km) * 100) / 100;
      }
      return j;
    });

    res.json(
      ok({
        list,
        page,
        page_size: pageSize,
        total: count,
        sort_applied: sort,
        radius_km: radiusKm
      })
    );
  } catch (e) {
    console.error('listShops error:', e);
    res.status(500).json({ code: 500, msg: '获取店铺列表失败', data: null });
  }
};

exports.getShopDetail = async (req, res) => {
  try {
    const shop = await MarketShop.findByPk(req.params.shopId);
    if (!shop || !shop.is_active) {
      return res.status(404).json({ code: 20001, msg: '店铺不存在或已下线', data: null });
    }
    const json = enrichShopJson(shop.toJSON());
    delete json.contact_name;
    if (process.env.LOG_MARKET_IMAGE_DEBUG === '1') {
      const base = process.env.PUBLIC_API_BASE || process.env.API_PUBLIC_URL || '';
      const abs = (u) =>
        u && !/^https?:\/\//i.test(u) && base
          ? `${String(base).replace(/\/$/, '')}${u.startsWith('/') ? u : `/${u}`}`
          : u;
      console.log('[LOG_MARKET_IMAGE_DEBUG] shop detail', {
        id: json.id,
        name: json.name,
        cover_url: json.cover_url,
        logo_url: json.logo_url,
        facade_image: json.facade_image,
        interior_image: json.interior_image,
        license_image: json.license_image,
        abs_preview: {
          cover: abs(json.cover_url),
          logo: abs(json.logo_url),
          facade: abs(json.facade_image),
          interior: abs(json.interior_image),
          license: abs(json.license_image)
        }
      });
    }
    res.json(ok(json));
  } catch (e) {
    console.error('getShopDetail error:', e);
    res.status(500).json({ code: 500, msg: '获取店铺详情失败', data: null });
  }
};

exports.listShopReviews = async (req, res) => {
  try {
    const shop = await MarketShop.findByPk(req.params.shopId);
    if (!shop || !shop.is_active) {
      return res.status(404).json({ code: 20001, msg: '店铺不存在或已下线', data: null });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 10;
    const offset = (page - 1) * pageSize;
    const { rows, count } = await MarketShopReview.findAndCountAll({
      where: { shop_id: shop.id },
      order: [['created_at', 'DESC']],
      offset,
      limit: pageSize
    });
    res.json(ok({ list: rows, page, page_size: pageSize, total: count }));
  } catch (e) {
    console.error('listShopReviews error:', e);
    res.status(500).json({ code: 500, msg: '获取店铺评价失败', data: null });
  }
};

exports.getShopCategories = async (req, res) => {
  try {
    const list = await MarketShopCategory.findAll({
      where: { shop_id: req.params.shopId, is_active: 1 },
      order: [['sort_order', 'DESC']]
    });
    res.json(ok(list));
  } catch (e) {
    console.error('getShopCategories error:', e);
    res.status(500).json({ code: 500, msg: '获取店铺分类失败', data: null });
  }
};

exports.getShopGoods = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 50;
    const offset = (page - 1) * pageSize;
    const where = { shop_id: req.params.shopId, status: 'on_sale' };
    if (req.query.category_key) where.category_key = req.query.category_key;
    const { rows, count } = await MarketGood.findAndCountAll({
      where,
      order: [['sort_order', 'DESC']],
      offset,
      limit: pageSize
    });
    const list = rows.map((row) => enrichGoodJson(row.toJSON()));
    res.json(ok({ list, page, page_size: pageSize, total: count }));
  } catch (e) {
    console.error('getShopGoods error:', e);
    res.status(500).json({ code: 500, msg: '获取店内商品失败', data: null });
  }
};

exports.getGoodsDetail = async (req, res) => {
  try {
    const goodsId = req.params.goodsId;
    const goods = await MarketGood.findByPk(goodsId);
    if (!goods || goods.status !== 'on_sale') {
      return res.status(404).json({ code: 20011, msg: '商品不存在或已下架', data: null });
    }
    const skus = await MarketGoodSku.findAll({
      where: { goods_id: goods.id, status: 'active' },
      order: [['id', 'ASC']]
    });
    const shop = await MarketShop.findByPk(goods.shop_id);
    const { sku_tree, sku_list } = buildSkuTreeFromRows(skus);
    const j = enrichGoodJson(goods.toJSON());
    const imgs = [];
    if (j.main_image) imgs.push(j.main_image);
    if (Array.isArray(j.images)) imgs.push(...j.images);
    const main_images = [...new Set(imgs.filter(Boolean))];
    let price_range = j.price_range;
    if (!price_range && sku_list.length) {
      const prices = sku_list.map((s) => Number(s.price));
      const a = Math.min(...prices).toFixed(2);
      const b = Math.max(...prices).toFixed(2);
      price_range = a === b ? a : `${a}-${b}`;
    }
    if (!price_range) price_range = j.price != null ? String(j.price) : '0';

    res.json(
      ok({
        id: j.id,
        shopId: shop ? shop.id : j.shop_id,
        shopName: shop ? shop.name : '',
        name: j.name,
        main_images,
        price_range,
        sales: j.sold_count,
        desc_html: j.desc_html || j.description || '',
        sku_tree,
        sku_list
      })
    );
  } catch (e) {
    console.error('getGoodsDetail error:', e);
    res.status(500).json({ code: 500, msg: '获取商品详情失败', data: null });
  }
};

/** GET /api/v1/market/goods/detail?id= */
exports.getGoodsDetailByQuery = async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ code: 400, msg: '缺少 id', data: null });
  req.params.goodsId = String(id);
  return exports.getGoodsDetail(req, res);
};
