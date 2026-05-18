const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { BenefitAllianceGoods } = require('../../../models');
const { Op } = Sequelize;

/** 惠民卡「肯德基 / 星巴克 / 百果园」等连锁：默认读 backend/data/benefit-chain-brands.json，可被 benefit_alliance_goods.platform=chain_* 覆盖 */
function readChainBrandSeeds() {
  const fp = path.join(__dirname, '../../../../data/benefit-chain-brands.json');
  try {
    const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
    return Array.isArray(raw.brands) ? raw.brands : [];
  } catch (e) {
    console.warn('[benefitAlliance] benefit-chain-brands.json 未读或无效', e.message);
    return [];
  }
}

async function buildChainBrandsForDisplay(scene) {
  const seeds = readChainBrandSeeds();
  const out = [];
  for (const seed of seeds) {
    if (!seed || !seed.key) continue;
    const platform = seed.db_platform || `chain_${seed.key}`;
    let title = seed.title || '';
    let subtitle = seed.subtitle || '';
    let keyword = seed.keyword || '';
    let miniAppId = seed.mini_app_id || '';
    let miniPath = seed.mini_path || '';
    let imageUrl = seed.image_url || '';
    try {
      const row = await BenefitAllianceGoods.findOne({
        where: { platform, scene, status: 'active' },
        order: [['sort_order', 'ASC'], ['id', 'DESC']]
      });
      if (row) {
        title = row.title || title;
        subtitle = row.subtitle != null ? String(row.subtitle) : subtitle;
        keyword = row.keyword != null ? String(row.keyword) : keyword;
        miniAppId = (row.sku_id && String(row.sku_id).trim()) || miniAppId;
        miniPath = (row.mini_path && String(row.mini_path).trim()) || miniPath;
        if (row.image_url && String(row.image_url).trim()) {
          imageUrl = String(row.image_url).trim();
        }
      }
    } catch (e) {
      console.warn('[buildChainBrandsForDisplay]', platform, e.message);
    }
    out.push({
      key: String(seed.key),
      title,
      subtitle,
      keyword,
      miniAppId,
      miniPath,
      imageUrl
    });
  }
  return out;
}

/** 小程序不可用的推广链（笔误域名、纯淘口令、空链） */
function isInvalidSpreadUrl(platform, spreadUrl) {
  const u = spreadUrl != null ? String(spreadUrl).trim() : '';
  if (!u) return true;
  if (/example\.com|127\.0\.0\.1|localhost/i.test(u)) return true;
  if (/kzurllG\.cn/i.test(u)) return true;
  if (platform === 'taobao' && !/^https?:\/\//i.test(u) && /^￥.+￥/.test(u)) return true;
  if ((platform === 'jd' || platform === 'pdd') && !/^https?:\/\//i.test(u)) return true;
  return false;
}

function filterAllianceRows(rows) {
  return rows.filter((r) => {
    const p = r.platform || '';
    if (r.status && String(r.status) !== 'active') return false;
    if (isInvalidSpreadUrl(p, r.spread_url)) return false;
    return true;
  });
}

// 辅助：统一成功响应
function ok(res, data, msg = 'ok') {
  res.json({ code: 0, msg, data });
}

// 辅助：统一失败响应
function fail(res, msg, statusCode = 400) {
  res.status(statusCode).json({ code: 1, msg });
}

// ── 公开接口（小程序调用）──────────────────────────────────────────────────

// GET /benefit-alliance/goods?platform=jd&scene=benefit_card&limit=8
exports.getGoods = async (req, res) => {
  try {
    const platform = req.query.platform || 'jd';
    const scene = req.query.scene || 'benefit_card';
    const limit = parseInt(req.query.limit || '8', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const { rows, count } = await BenefitAllianceGoods.findAndCountAll({
      where: {
        platform,
        scene,
        status: 'active',
      },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
      limit: Math.min(limit + 20, 100),
      offset,
    });

    const filtered = filterAllianceRows(rows).slice(0, limit);

    ok(res, {
      list: filtered.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        image: r.image_url,
        price: r.price != null ? String(Number(r.price).toFixed(2)) : '',
        couponPrice: r.coupon_price != null ? String(Number(r.coupon_price).toFixed(2)) : '',
        rebateAmount: r.rebate_amount != null ? String(Number(r.rebate_amount).toFixed(2)) : '',
        skuId: r.sku_id,
        goodsId: r.goods_id,
        spreadUrl: r.spread_url,
        miniPath: r.mini_path,
        keyword: r.keyword,
      })),
      total: filtered.length,
    });
  } catch (err) {
    console.error('[getGoods]', err);
    fail(res, '获取商品列表失败');
  }
};

// GET /benefit-alliance/display?scene=benefit_card
// 取各平台第一条 active 商品作为 banner 展示用
exports.getDisplay = async (req, res) => {
  try {
    const scene = req.query.scene || 'benefit_card';
    const platforms = ['jd', 'pdd', 'taobao', 'meituan', 'brand'];

    const result = {};
    for (const p of platforms) {
      const first = await BenefitAllianceGoods.findOne({
        where: { platform: p, scene, status: 'active' },
        order: [['sort_order', 'ASC'], ['id', 'DESC']],
      });
      if (first) {
        result[p] = {
          title: first.title,
          subtitle: first.subtitle,
          image: first.image_url,
          spreadUrl: first.spread_url,
          miniPath: first.mini_path,
          keyword: first.keyword,
          skuId: first.sku_id,
          goodsId: first.goods_id,
        };
      }
    }

    result.chainBrands = await buildChainBrandsForDisplay(scene);

    ok(res, result);
  } catch (err) {
    console.error('[getDisplay]', err);
    fail(res, '获取展示配置失败');
  }
};

// GET /benefit-alliance/jd/benefit/goods （兼容旧路径）
exports.getJdGoods = async (req, res) => {
  req.query.platform = 'jd';
  return exports.getGoods(req, res);
};

// GET /benefit-alliance/pdd/benefit/goods （兼容旧路径）
exports.getPddGoods = async (req, res) => {
  req.query.platform = 'pdd';
  return exports.getGoods(req, res);
};

// ── 管理后台接口（admin）───────────────────────────────────────────────────

// GET /admin/benefit-alliance-goods
exports.adminList = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const platform = req.query.platform;
    const status = req.query.status;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';

    const where = {};
    if (platform) where.platform = platform;
    if (status) where.status = status;
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { subtitle: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await BenefitAllianceGoods.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    ok(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    console.error('[adminList]', err);
    fail(res, '查询失败');
  }
};

// POST /admin/benefit-alliance-goods
exports.adminCreate = async (req, res) => {
  try {
    const { BenefitAllianceGoods } = req.app.locals.db;
    const body = req.body || {};

    const fields = {
      platform: body.platform || 'jd',
      title: body.title || '',
      subtitle: body.subtitle || '',
      image_url: body.image_url || body.imageUrl || '',
      price: body.price != null ? body.price : null,
      coupon_price: body.coupon_price != null ? body.coupon_price : body.couponPrice != null ? body.couponPrice : null,
      rebate_amount: body.rebate_amount != null ? body.rebate_amount : body.rebateAmount != null ? body.rebateAmount : null,
      sku_id: body.sku_id || body.skuId || '',
      goods_id: body.goods_id || body.goodsId || '',
      spread_url: body.spread_url || body.spreadUrl || '',
      mini_path: body.mini_path || body.miniPath || '',
      keyword: body.keyword || '',
      sort_order: body.sort_order != null ? body.sort_order : body.sortOrder != null ? body.sortOrder : 0,
      status: body.status || 'active',
      scene: body.scene || 'benefit_card',
    };

    if (!fields.title) {
      return fail(res, '标题不能为空');
    }

    const item = await BenefitAllianceGoods.create(fields);
    ok(res, item, '创建成功');
  } catch (err) {
    console.error('[adminCreate]', err);
    fail(res, '创建失败');
  }
};

// PUT /admin/benefit-alliance-goods/:id
exports.adminUpdate = async (req, res) => {
  try {
    const { BenefitAllianceGoods } = req.app.locals.db;
    const id = req.params.id;
    const body = req.body || {};

    const item = await BenefitAllianceGoods.findByPk(id);
    if (!item) return fail(res, '记录不存在', 404);

    const update = {};
    if (body.platform != null) update.platform = body.platform;
    if (body.title != null) update.title = body.title;
    if (body.subtitle != null) update.subtitle = body.subtitle;
    if (body.image_url != null || body.imageUrl != null) update.image_url = body.image_url || body.imageUrl;
    if (body.price != null) update.price = body.price;
    if (body.coupon_price != null || body.couponPrice != null) update.coupon_price = body.coupon_price != null ? body.coupon_price : body.couponPrice;
    if (body.rebate_amount != null || body.rebateAmount != null) update.rebate_amount = body.rebate_amount != null ? body.rebate_amount : body.rebateAmount;
    if (body.sku_id != null || body.skuId != null) update.sku_id = body.sku_id || body.skuId;
    if (body.goods_id != null || body.goodsId != null) update.goods_id = body.goods_id || body.goodsId;
    if (body.spread_url != null || body.spreadUrl != null) update.spread_url = body.spread_url || body.spreadUrl;
    if (body.mini_path != null || body.miniPath != null) update.mini_path = body.mini_path || body.miniPath;
    if (body.keyword != null) update.keyword = body.keyword;
    if (body.sort_order != null || body.sortOrder != null) update.sort_order = body.sort_order != null ? body.sort_order : body.sortOrder;
    if (body.status != null) update.status = body.status;
    if (body.scene != null) update.scene = body.scene;

    await item.update(update);
    ok(res, item, '更新成功');
  } catch (err) {
    console.error('[adminUpdate]', err);
    fail(res, '更新失败');
  }
};

// DELETE /admin/benefit-alliance-goods/:id
exports.adminDelete = async (req, res) => {
  try {
    const { BenefitAllianceGoods } = req.app.locals.db;
    const id = req.params.id;

    const item = await BenefitAllianceGoods.findByPk(id);
    if (!item) return fail(res, '记录不存在', 404);

    await item.destroy();
    ok(res, null, '删除成功');
  } catch (err) {
    console.error('[adminDelete]', err);
    fail(res, '删除失败');
  }
};
