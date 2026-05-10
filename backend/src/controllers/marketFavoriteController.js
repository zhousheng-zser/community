const { Op } = require('sequelize');
const { MarketFavoriteItem, MarketGood, MarketShop } = require('../models');

function ok(data) {
  return { code: 0, msg: 'ok', data };
}

/** 与 authMiddleware、部分网关解析保持一致 */
function reqUserId(req) {
  const u = req.user || {};
  const raw = u.id ?? u.user_id ?? u.userId;
  if (raw === undefined || raw === null || raw === '') return NaN;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : NaN;
}

function enrichGoodJson(j) {
  if (!j || typeof j !== 'object') return j;
  const out = { ...j };
  if (out.main_image != null && out.main_image !== '' && out.image == null) out.image = out.main_image;
  return out;
}

function enrichShopJson(j) {
  if (!j || typeof j !== 'object') return j;
  const out = { ...j };
  if (out.cover_url != null && out.cover_url !== '' && out.cover == null) out.cover = out.cover_url;
  if (out.logo_url != null && out.logo_url !== '' && out.logo == null) out.logo = out.logo_url;
  return out;
}

/**
 * GET /api/v1/market/favorites
 * 分页收藏列表；可选 shop_id 筛选某店
 */
exports.listFavorites = async (req, res) => {
  try {
    const userId = reqUserId(req);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ code: 401, msg: '未识别用户', data: null });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const rawSize = parseInt(req.query.page_size, 10) || 20;
    const pageSize = Math.min(Math.max(rawSize, 1), 100);
    const offset = (page - 1) * pageSize;
    const shopId = req.query.shop_id != null && req.query.shop_id !== '' ? parseInt(req.query.shop_id, 10) : null;

    const where = { user_id: userId };
    if (shopId) where.shop_id = shopId;

    const { rows, count } = await MarketFavoriteItem.findAndCountAll({
      where,
      include: [
        {
          model: MarketGood,
          as: 'good',
          required: true
        },
        {
          model: MarketShop,
          as: 'shop',
          required: true,
          attributes: ['id', 'name', 'logo_url', 'cover_url', 'is_active', 'category']
        }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: pageSize
    });

    const list = rows.map((row) => {
      const j = row.toJSON();
      return {
        id: j.id,
        goods_id: j.goods_id,
        shop_id: j.shop_id,
        created_at: j.created_at,
        updated_at: j.updated_at,
        good: enrichGoodJson(j.good),
        shop: enrichShopJson(j.shop)
      };
    });

    res.json(ok({ list, page, page_size: pageSize, total: count }));
  } catch (e) {
    console.error('listFavorites error:', e);
    res.status(500).json({ code: 500, msg: '获取收藏列表失败', data: null });
  }
};

/**
 * POST /api/v1/market/favorites
 * body: { goods_id } 必填；可选 shop_id 与商品归属校验（不一致则 400）
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = reqUserId(req);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ code: 401, msg: '未识别用户', data: null });
    }
    const goodsId = parseInt(req.body.goods_id, 10);
    const shopIdBody = req.body.shop_id != null && req.body.shop_id !== '' ? parseInt(req.body.shop_id, 10) : null;

    if (!goodsId) {
      return res.status(400).json({ code: 400, msg: '缺少 goods_id', data: null });
    }

    const goods = await MarketGood.findByPk(goodsId);
    if (!goods) {
      return res.status(404).json({ code: 20011, msg: '商品不存在', data: null });
    }
    if (shopIdBody != null && goods.shop_id !== shopIdBody) {
      return res.status(400).json({ code: 400, msg: 'shop_id 与商品所属店铺不一致', data: null });
    }

    const [row, created] = await MarketFavoriteItem.findOrCreate({
      where: { user_id: userId, goods_id: goodsId },
      defaults: { shop_id: goods.shop_id }
    });

    if (!created && row.shop_id !== goods.shop_id) {
      row.shop_id = goods.shop_id;
      await row.save();
    }

    const j = row.toJSON();
    res.json(
      ok({
        id: j.id,
        goods_id: j.goods_id,
        shop_id: j.shop_id,
        created: !!created,
        created_at: j.created_at,
        updated_at: j.updated_at
      })
    );
  } catch (e) {
    console.error('addFavorite error:', e);
    res.status(500).json({ code: 500, msg: '添加收藏失败', data: null });
  }
};

/**
 * DELETE /api/v1/market/favorites/:goodsId
 * 按商品主键删除收藏（与列表/店铺商品中的 id 一致）
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = reqUserId(req);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ code: 401, msg: '未识别用户', data: null });
    }
    const goodsId = parseInt(req.params.goodsId, 10);
    if (!goodsId) {
      return res.status(400).json({ code: 400, msg: '无效的 goodsId', data: null });
    }

    const n = await MarketFavoriteItem.destroy({ where: { user_id: userId, goods_id: goodsId } });
    if (!n) {
      return res.status(404).json({ code: 404, msg: '未收藏该商品', data: null });
    }
    res.json(ok(null));
  } catch (e) {
    console.error('removeFavorite error:', e);
    res.status(500).json({ code: 500, msg: '取消收藏失败', data: null });
  }
};

/**
 * GET /api/v1/market/favorites/status?goods_ids=1,2,3
 * 批量查询当前用户是否已收藏（便于列表页点亮星标）
 */
exports.status = async (req, res) => {
  try {
    const userId = reqUserId(req);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ code: 401, msg: '未识别用户', data: null });
    }
    const raw = req.query.goods_ids || req.query.goodsIds || '';
    const ids = String(raw)
      .split(/[,，\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (!ids.length) {
      return res.status(400).json({ code: 400, msg: '缺少 goods_ids', data: null });
    }
    const unique = [...new Set(ids)].slice(0, 200);

    const rows = await MarketFavoriteItem.findAll({
      where: { user_id: userId, goods_id: { [Op.in]: unique } },
      attributes: ['goods_id']
    });
    const set = new Set(rows.map((r) => r.goods_id));
    const favorited = {};
    for (const id of unique) {
      favorited[String(id)] = set.has(id);
    }
    res.json(ok({ favorited }));
  } catch (e) {
    console.error('favorites status error:', e);
    res.status(500).json({ code: 500, msg: '查询收藏状态失败', data: null });
  }
};
