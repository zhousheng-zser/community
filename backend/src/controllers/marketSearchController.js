const { Op } = require('sequelize');
const { sequelize, MarketShop, MarketGood } = require('../models');
const { normalizeShopCategory } = require('../constants/marketCategoryMap');

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

function distanceKmSql(latNum, lngNum) {
  return `(
    6371 * ACOS(LEAST(1, GREATEST(-1,
      COS(RADIANS(${latNum})) * COS(RADIANS(\`MarketShop\`.\`latitude\`)) * COS(RADIANS(\`MarketShop\`.\`longitude\`) - RADIANS(${lngNum}))
      + SIN(RADIANS(${latNum})) * SIN(RADIANS(\`MarketShop\`.\`latitude\`))
    )))
  )`;
}

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

// GET /api/v1/market/search
exports.search = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    const type = req.query.type === 'shop' ? 'shop' : 'goods';
    const sort = req.query.sort || 'smart';
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = Math.min(parseInt(req.query.page_size, 10) || 20, 50);
    const offset = (page - 1) * pageSize;

    if (type === 'shop') {
      const where = { is_active: 1 };
      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { address: { [Op.like]: `%${keyword}%` } }
        ];
      }
      if (req.query.category) where.category = normalizeShopCategory(req.query.category);

      const coords = parseUserCoords(req.query);
      let order = [];
      if (coords) {
        const { lat, lng } = coords;
        const distSql = distanceKmSql(Number(lat), Number(lng));
        const distanceLiteral = sequelize.literal(distSql);
        const radiusKm = 50;
        const whereWithDist = {
          [Op.and]: [
            where,
            { latitude: { [Op.ne]: null } },
            { longitude: { [Op.ne]: null } },
            sequelize.where(distanceLiteral, { [Op.lte]: radiusKm })
          ]
        };
        if (sort === 'price_asc') order = [['min_order_amount', 'ASC']];
        else if (sort === 'sales') order = [['sold_count', 'DESC'], [sequelize.literal(distSql), 'ASC']];
        else if (sort === 'rating') order = [['rating', 'DESC'], [sequelize.literal(distSql), 'ASC']];
        else order = [['sort_order', 'DESC'], ['sold_count', 'DESC'], [sequelize.literal(distSql), 'ASC']];

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
          if (j.distance_km != null) j.distance_km = Math.round(Number(j.distance_km) * 100) / 100;
          return j;
        });
        return res.json(ok({ list, page, page_size: pageSize, total: count, type: 'shop' }));
      }

      if (sort === 'sales') order = [['sold_count', 'DESC']];
      else if (sort === 'rating') order = [['rating', 'DESC']];
      else if (sort === 'price_asc') order = [['min_order_amount', 'ASC']];
      else order = [['sort_order', 'DESC']];

      const { rows, count } = await MarketShop.findAndCountAll({ where, order, offset, limit: pageSize });
      const list = rows.map((r) => enrichShopJson(r.toJSON()));
      return res.json(ok({ list, page, page_size: pageSize, total: count, type: 'shop' }));
    }

    // goods
    const goodWhere = { status: 'on_sale' };
    const shopWhere = { is_active: 1 };
    if (keyword) {
      goodWhere[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (req.query.category) shopWhere.category = normalizeShopCategory(req.query.category);

    let include = [
      {
        model: MarketShop,
        as: 'shop',
        attributes: ['id', 'name', 'logo_url', 'cover_url', 'category', 'sold_count', 'rating'],
        where: shopWhere,
        required: true
      }
    ];

    let orderGoods = [['sold_count', 'DESC'], ['sort_order', 'DESC']];
    if (sort === 'price_asc') orderGoods = [['price', 'ASC']];
    else if (sort === 'rating') orderGoods = [[sequelize.col('shop.rating'), 'DESC'], ['sold_count', 'DESC']];
    else if (sort === 'sales') orderGoods = [['sold_count', 'DESC'], ['sort_order', 'DESC']];
    else if (sort === 'smart') orderGoods = [['sold_count', 'DESC'], ['sort_order', 'DESC']];

    const { rows, count } = await MarketGood.findAndCountAll({
      where: goodWhere,
      include,
      order: orderGoods,
      offset,
      limit: pageSize,
      subQuery: false
    });

    const list = rows.map((row) => {
      const j = enrichGoodJson(row.toJSON());
      const s = j.shop;
      delete j.shop;
      return {
        ...j,
        shop_id: s && s.id,
        shopName: s && s.name,
        shop: s
          ? {
              id: s.id,
              name: s.name,
              logo_url: s.logo_url,
              cover_url: s.cover_url
            }
          : null
      };
    });

    res.json(ok({ list, page, page_size: pageSize, total: count, type: 'goods' }));
  } catch (e) {
    console.error('market search error:', e);
    res.status(500).json({ code: 500, msg: '搜索失败', data: null });
  }
};
