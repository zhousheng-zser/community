const store = require('../merchantGoodsStore');

function ok(res, data) {
  res.json({ errno: 0, errmsg: 'ok', data });
}

function listGoods(req, res) {
  let list = store.listGoods();
  const qShop = req.query.shop_id != null ? req.query.shop_id : req.query.shopId;
  if (qShop != null && qShop !== '') {
    const sid = Number(qShop);
    if (Number.isFinite(sid)) {
      list = list.filter((g) => g.shop_id == null || Number(g.shop_id) === sid);
    }
  }
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
  ok(res, {
    list,
    total: list.length,
    page,
    page_size: limit
  });
}

function postRestock(req, res) {
  const add =
    req.body &&
    (req.body.quantity != null
      ? Number(req.body.quantity)
      : req.body.qty != null
        ? Number(req.body.qty)
        : NaN);
  if (!Number.isFinite(add) || add <= 0) {
    return res.status(200).json({ errno: 400, errmsg: '请输入正整数数量' });
  }
  const row = store.restock(req.params.id, add);
  if (!row) {
    return res.status(404).json({ errno: 404, errmsg: '商品不存在' });
  }
  ok(res, { goods: row });
}

function postShelf(req, res) {
  const b = req.body || {};
  let published =
    b.published === true ||
    b.published === 1 ||
    b.is_published === 1 ||
    b.is_published === true;
  if (b.published === false || b.published === 0 || b.is_published === 0) {
    published = false;
  }
  const row = store.setShelf(req.params.id, !!published);
  if (!row) {
    return res.status(404).json({ errno: 404, errmsg: '商品不存在' });
  }
  ok(res, { goods: row });
}

function getGoods(req, res) {
  const row = store.getGoods(req.params.id);
  if (!row) {
    return res.status(404).json({ errno: 404, errmsg: '商品不存在' });
  }
  ok(res, { goods: row });
}

function patchGoods(req, res) {
  const b = req.body || {};
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(b, 'main_image')) {
    patch.main_image = String(b.main_image == null ? '' : b.main_image).trim();
  } else if (Object.prototype.hasOwnProperty.call(b, 'image')) {
    patch.main_image = String(b.image == null ? '' : b.image).trim();
  }
  if (b.description != null) {
    patch.description = String(b.description);
  } else if (b.desc != null) {
    patch.description = String(b.desc);
  }
  if (b.title != null && String(b.title).trim() !== '') {
    patch.title = String(b.title).trim();
  }
  if (b.price != null && b.price !== '') {
    const p = Number(b.price);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ errno: 400, errmsg: '价格无效' });
    }
    patch.price = Math.round(p * 100) / 100;
  }
  if (b.stock != null || b.inventory != null) {
    const s = Number(b.stock != null ? b.stock : b.inventory);
    if (!Number.isFinite(s) || s < 0 || Math.floor(s) !== s) {
      return res.status(400).json({ errno: 400, errmsg: '库存须为非负整数' });
    }
    patch.stock = s;
    patch.inventory = s;
  }
  if (b.safe_stock != null || b.low_stock_threshold != null) {
    const s = Number(b.safe_stock != null ? b.safe_stock : b.low_stock_threshold);
    if (!Number.isFinite(s) || s < 0 || Math.floor(s) !== s) {
      return res.status(400).json({ errno: 400, errmsg: '安全库存须为非负整数' });
    }
    patch.safe_stock = s;
    patch.low_stock_threshold = s;
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ errno: 400, errmsg: '无有效字段' });
  }
  const row = store.updateGoods(req.params.id, patch);
  if (!row) {
    return res.status(404).json({ errno: 404, errmsg: '商品不存在' });
  }
  ok(res, { goods: row });
}

module.exports = {
  listGoods,
  getGoods,
  patchGoods,
  postRestock,
  postShelf
};
