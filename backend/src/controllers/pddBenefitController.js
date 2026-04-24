const { PddBenefitGood } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

/**
 * GET /pdd/benefit/goods?scene=benefit_card
 */
exports.listGoods = async (req, res) => {
  try {
    const scene = req.query.scene || 'benefit_card';
    const rows = await PddBenefitGood.findAll({
      where: { scene, status: 1 },
      order: [['sort_order', 'DESC'], ['id', 'DESC']]
    });
    const list = rows.map((r) => ({
      id: r.id,
      goodsId: r.goods_id || r.link_key,
      title: r.title,
      image: r.image_url,
      price: r.price || '',
      couponPrice: r.coupon_price || '',
      rebateAmount: r.rebate_amount || '',
      spreadUrl: r.spread_url,
      miniPath: r.mini_path || ''
    }));
    return ok(res, { list });
  } catch (e) {
    console.error('[pdd benefit goods]', e);
    return fail(res, 500, '服务异常', 500);
  }
};
