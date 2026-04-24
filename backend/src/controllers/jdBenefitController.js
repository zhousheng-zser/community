const { JdBenefitGood } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

/**
 * GET /jd/benefit/goods?scene=benefit_card
 */
exports.listGoods = async (req, res) => {
  try {
    const scene = req.query.scene || 'benefit_card';
    const rows = await JdBenefitGood.findAll({
      where: { scene, status: 1 },
      order: [['sort_order', 'DESC'], ['id', 'DESC']]
    });
    const list = rows.map((r) => ({
      id: r.id,
      skuId: r.sku_id,
      title: r.title,
      image: r.image_url,
      price: r.price || '',
      rebateAmount: r.rebate_amount || '',
      spreadUrl: r.spread_url
    }));
    return ok(res, { list });
  } catch (e) {
    console.error('[jd benefit goods]', e);
    return fail(res, 500, '服务异常', 500);
  }
};
