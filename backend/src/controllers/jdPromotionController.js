const { JdBenefitGood } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

/**
 * GET /jd/promotion/spread-url?sku_id=&scene=
 */
exports.getSpreadUrl = async (req, res) => {
  try {
    const skuId = req.query.sku_id;
    const scene = req.query.scene || 'benefit_card';
    if (!skuId) {
      return fail(res, 400, '缺少 sku_id');
    }
    const row = await JdBenefitGood.findOne({
      where: { sku_id: String(skuId), scene, status: 1 }
    });
    if (!row) {
      return fail(res, 404, '未找到该 SKU 的推广信息');
    }
    return ok(res, { spreadUrl: row.spread_url });
  } catch (e) {
    console.error('[jd promotion spread-url]', e);
    return fail(res, 500, '服务异常', 500);
  }
};
