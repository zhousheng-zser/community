const { BenefitAllianceGoods, JdBenefitGood, PddBenefitGood } = require('../models');

const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data });
const fail = (res, msg, statusCode = 400) => res.status(statusCode).json({ code: 1, msg });

// GET /benefit-alliance/goods?platform=jd
exports.getGoods = async (req, res) => {
  try {
    const platform = req.query.platform || 'jd';
    const scene = req.query.scene || 'benefit_card';
    const limit = parseInt(req.query.limit || '8', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    // 京东走 jd_benefit_goods 表
    if (platform === 'jd') {
      const { rows, count } = await JdBenefitGood.findAndCountAll({
        where: { scene, status: 1 },
        order: [['sort_order', 'DESC'], ['id', 'DESC']],
        limit,
        offset,
      });
      return ok(res, {
        list: rows.map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: '',
          image: r.image_url,
          price: r.price || '',
          couponPrice: '',
          rebateAmount: r.rebate_amount || '',
          skuId: r.sku_id,
          goodsId: '',
          spreadUrl: r.spread_url,
          miniPath: '',
          keyword: '',
        })),
        total: count,
      });
    }

    // 拼多多走 pdd_benefit_goods 表
    if (platform === 'pdd') {
      const { rows, count } = await PddBenefitGood.findAndCountAll({
        where: { scene, status: 1 },
        order: [['sort_order', 'DESC'], ['id', 'DESC']],
        limit,
        offset,
      });
      return ok(res, {
        list: rows.map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: '',
          image: r.image_url,
          price: r.price || '',
          couponPrice: r.coupon_price || '',
          rebateAmount: r.rebate_amount || '',
          skuId: '',
          goodsId: r.goods_id,
          spreadUrl: r.spread_url,
          miniPath: r.mini_path,
          keyword: '',
        })),
        total: count,
      });
    }

    // 其他平台走 benefit_alliance_goods 表
    const { rows, count } = await BenefitAllianceGoods.findAndCountAll({
      where: { platform, scene, status: 'active' },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
      limit,
      offset,
    });

    ok(res, {
      list: rows.map((r) => ({
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
      total: count,
    });
  } catch (err) {
    console.error('[getGoods]', err);
    fail(res, '获取商品列表失败');
  }
};

// GET /benefit-alliance/display?scene=benefit_card
exports.getDisplay = async (req, res) => {
  try {
    const scene = req.query.scene || 'benefit_card';
    const platforms = ['jd', 'pdd', 'taobao', 'meituan', 'shangou', 'shequn', 'tuixiao', 'brand'];

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

    ok(res, result);
  } catch (err) {
    console.error('[getDisplay]', err);
    fail(res, '获取展示配置失败');
  }
};

// GET /benefit-alliance/jd/benefit/goods
exports.getJdGoods = async (req, res) => {
  req.query.platform = 'jd';
  return exports.getGoods(req, res);
};

// GET /benefit-alliance/pdd/benefit/goods
exports.getPddGoods = async (req, res) => {
  req.query.platform = 'pdd';
  return exports.getGoods(req, res);
};
