const { PddBenefitGood } = require('../jd');

function ok(res, data) {
  return res.json({ errno: 0, errmsg: 'ok', data });
}

function missingTableMsg() {
  return '缺少数据表 pdd_benefit_goods：请执行 backend/sql/pdd_benefit_goods.sql，或在 .env 设置 DB_SYNC_PDD=1 后重启 backend';
}

function toListItem(row) {
  return {
    id: row.id,
    goodsId: row.goods_id || '',
    title: row.title,
    image: row.image_url,
    price: row.price != null ? String(row.price) : '',
    couponPrice: row.coupon_price != null ? String(row.coupon_price) : '',
    rebateAmount: row.rebate_amount != null ? String(row.rebate_amount) : '',
    spreadUrl: row.spread_url,
    miniPath: row.mini_path || ''
  };
}

/**
 * GET /api/v1/pdd/benefit/goods?scene=benefit_card
 */
async function listGoods(req, res) {
  try {
    const scene = (req.query.scene || 'benefit_card').trim();
    const rows = await PddBenefitGood.findAll({
      where: { scene, status: 1 },
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC']
      ]
    });
    const list = rows.map(toListItem);
    return ok(res, { list });
  } catch (e) {
    const msg = (e && e.message) || '';
    if (/doesn't exist|ER_NO_SUCH_TABLE|no such table/i.test(msg)) {
      return res.status(500).json({ errno: 500, errmsg: missingTableMsg() });
    }
    console.error('[pdd/benefit/goods]', e);
    return res.status(500).json({ errno: 500, errmsg: e.message || '服务器错误' });
  }
}

/**
 * GET /api/v1/pdd/promotion/spread-url?goods_id=&scene=benefit_card
 */
async function getSpreadUrl(req, res) {
  try {
    const scene = (req.query.scene || 'benefit_card').trim();
    const goodsId = req.query.goods_id != null ? String(req.query.goods_id).trim() : '';
    if (!goodsId) {
      return ok(res, { spreadUrl: '', miniPath: '' });
    }
    const row = await PddBenefitGood.findOne({
      where: { scene, goods_id: goodsId, status: 1 }
    });
    if (!row) {
      return ok(res, { spreadUrl: '', miniPath: '' });
    }
    return ok(res, {
      spreadUrl: row.spread_url || '',
      miniPath: row.mini_path || ''
    });
  } catch (e) {
    console.error('[pdd/promotion/spread-url]', e);
    return res.status(500).json({ errno: 500, errmsg: e.message || '服务器错误' });
  }
}

module.exports = {
  listGoods,
  getSpreadUrl
};
