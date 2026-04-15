const { MarketCartItem, MarketGood } = require('../models');

function ok(data) {
  return { code: 0, msg: 'ok', data };
}

// GET /api/v1/market/cart?shop_id=xxx
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const shopId = parseInt(req.query.shop_id, 10);
    if (!shopId) return res.status(400).json({ code: 400, msg: '缺少 shop_id', data: null });
    const items = await MarketCartItem.findAll({ where: { user_id: userId, shop_id: shopId } });
    res.json(ok({ list: items }));
  } catch (e) {
    console.error('getCart error:', e);
    res.status(500).json({ code: 500, msg: '获取购物车失败', data: null });
  }
};

// POST /api/v1/market/cart/items  { shop_id, goods_id, quantity }
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shop_id, goods_id, quantity = 1 } = req.body;
    if (!shop_id || !goods_id) {
      return res.status(400).json({ code: 400, msg: '缺少 shop_id 或 goods_id', data: null });
    }
    const goods = await MarketGood.findByPk(goods_id);
    if (!goods || goods.shop_id !== Number(shop_id) || goods.status !== 'on_sale') {
      return res.status(404).json({ code: 20011, msg: '商品不存在或已下架', data: null });
    }
    const [item, created] = await MarketCartItem.findOrCreate({
      where: { user_id: userId, shop_id, goods_id },
      defaults: { quantity, checked: 1 }
    });
    if (!created) {
      item.quantity += Number(quantity);
      await item.save();
    }
    res.json(ok(item));
  } catch (e) {
    console.error('addItem error:', e);
    res.status(500).json({ code: 500, msg: '加入购物车失败', data: null });
  }
};

// PUT /api/v1/market/cart/items/:itemId { quantity }
exports.updateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    if (quantity == null || quantity < 0) {
      return res.status(400).json({ code: 400, msg: 'quantity 非法', data: null });
    }
    const item = await MarketCartItem.findByPk(req.params.itemId);
    if (!item || item.user_id !== userId) {
      return res.status(404).json({ code: 404, msg: '购物车项不存在', data: null });
    }
    if (quantity === 0) {
      await item.destroy();
      return res.json(ok(null));
    }
    item.quantity = quantity;
    await item.save();
    res.json(ok(item));
  } catch (e) {
    console.error('updateItem error:', e);
    res.status(500).json({ code: 500, msg: '更新购物车失败', data: null });
  }
};

// DELETE /api/v1/market/cart/items/:itemId
exports.deleteItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const item = await MarketCartItem.findByPk(req.params.itemId);
    if (!item || item.user_id !== userId) {
      return res.status(404).json({ code: 404, msg: '购物车项不存在', data: null });
    }
    await item.destroy();
    res.json(ok(null));
  } catch (e) {
    console.error('deleteItem error:', e);
    res.status(500).json({ code: 500, msg: '删除购物车失败', data: null });
  }
};

// DELETE /api/v1/market/cart?shop_id=xxx
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const shopId = parseInt(req.query.shop_id, 10);
    if (!shopId) return res.status(400).json({ code: 400, msg: '缺少 shop_id', data: null });
    await MarketCartItem.destroy({ where: { user_id: userId, shop_id: shopId } });
    res.json(ok(null));
  } catch (e) {
    console.error('clearCart error:', e);
    res.status(500).json({ code: 500, msg: '清空购物车失败', data: null });
  }
};
