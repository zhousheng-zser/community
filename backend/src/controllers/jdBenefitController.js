const { JdBenefitGood } = require('../jd');

function ok(res, data) {
  return res.json({ errno: 0, errmsg: 'ok', data });
}

function toListItem(row) {
  return {
    id: row.id,
    skuId: row.sku_id,
    title: row.title,
    image: row.image_url,
    price: row.price != null ? String(row.price) : '',
    rebateAmount: row.rebate_amount != null ? String(row.rebate_amount) : '',
    spreadUrl: row.spread_url
  };
}

/**
 * GET /api/v1/jd/benefit/goods?scene=benefit_card
 */
async function listGoods(req, res) {
  try {
    const scene = (req.query.scene || 'benefit_card').trim();
    const rows = await JdBenefitGood.findAll({
      where: { scene, status: 1 },
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC']
      ]
    });
    const list = rows.map(toListItem);
    return ok(res, { list });
  } catch (e) {
    console.error('[jd/benefit/goods]', e);
    return res.status(500).json({ errno: 500, errmsg: e.message || '服务器错误' });
  }
}

/**
 * GET /api/v1/jd/promotion/spread-url?sku_id=&scene=benefit_card
 * 从同一张表取该 SKU 的推广链接（后续可在此对接京东 API 动态转链）
 */
async function getSpreadUrl(req, res) {
  try {
    const scene = (req.query.scene || 'benefit_card').trim();
    const skuId = req.query.sku_id != null ? String(req.query.sku_id).trim() : '';
    if (!skuId) {
      return ok(res, { spreadUrl: '' });
    }
    const row = await JdBenefitGood.findOne({
      where: { scene, sku_id: skuId, status: 1 }
    });
    const spreadUrl = row && row.spread_url ? row.spread_url : '';
    return ok(res, { spreadUrl });
  } catch (e) {
    console.error('[jd/promotion/spread-url]', e);
    return res.status(500).json({ errno: 500, errmsg: e.message || '服务器错误' });
  }
}

module.exports = {
  listGoods,
  getSpreadUrl
};
