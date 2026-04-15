const { sequelize, MarketShop, MarketGood, MarketOrder, MarketOrderItem } = require('../models');
const { Op } = require('sequelize');

function ok(data) {
  return { code: 0, msg: 'ok', data };
}

function bizError(res, code, msg) {
  return res.status(200).json({ code, msg, data: null });
}

function genOrderNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `MK${y}${m}${day}${hh}${mm}${ss}${rnd}`;
}

function calcAmounts(goodsList, qtyMap, deliveryFee, discountAmount) {
  let goodsAmount = 0;
  for (const g of goodsList) {
    const q = qtyMap.get(String(g.id)) || 0;
    goodsAmount += Number(g.price) * q;
  }
  goodsAmount = Number(goodsAmount.toFixed(2));
  deliveryFee = Number(Number(deliveryFee || 0).toFixed(2));
  discountAmount = Number(Number(discountAmount || 0).toFixed(2));
  const payableAmount = Number((goodsAmount + deliveryFee - discountAmount).toFixed(2));
  return { goods_amount: goodsAmount, delivery_fee: deliveryFee, discount_amount: discountAmount, payable_amount: payableAmount };
}

async function loadShopOrErr(shopId) {
  const shop = await MarketShop.findByPk(shopId);
  if (!shop || !shop.is_active) return { err: { code: 20001, msg: '店铺不存在或已下线' } };
  if (!shop.is_open) return { err: { code: 20002, msg: '店铺休息中' } };
  return { shop };
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const map = new Map();
  for (const it of items) {
    if (!it || !it.goods_id) continue;
    const gid = String(it.goods_id);
    const q = Math.max(0, parseInt(it.quantity, 10) || 0);
    if (!q) continue;
    map.set(gid, (map.get(gid) || 0) + q);
  }
  return [...map.entries()].map(([goods_id, quantity]) => ({ goods_id: Number(goods_id), quantity }));
}

// POST /api/v1/market/orders/preview
exports.preview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shop_id, items } = req.body;
    if (!shop_id) return res.status(400).json({ code: 400, msg: '缺少 shop_id', data: null });

    const normItems = normalizeItems(items);
    if (normItems.length === 0) return res.status(400).json({ code: 400, msg: 'items 不能为空', data: null });

    const { shop, err } = await loadShopOrErr(shop_id);
    if (err) return bizError(res, err.code, err.msg);

    const goodsIds = normItems.map(i => i.goods_id);
    const goodsList = await MarketGood.findAll({ where: { id: goodsIds, shop_id, status: 'on_sale' } });
    if (goodsList.length !== goodsIds.length) return bizError(res, 20011, '商品不存在或已下架');

    const qtyMap = new Map(normItems.map(i => [String(i.goods_id), i.quantity]));
    for (const g of goodsList) {
      const q = qtyMap.get(String(g.id)) || 0;
      if (g.stock < q) return bizError(res, 20012, `库存不足：${g.name}`);
    }

    const amounts = calcAmounts(goodsList, qtyMap, shop.delivery_fee, 0);
    if (amounts.goods_amount < Number(shop.min_order_amount)) {
      return bizError(res, 20021, '未达到起送价');
    }

    res.json(ok({
      user_id: userId,
      shop_id,
      ...amounts
    }));
  } catch (e) {
    console.error('orders/preview error:', e);
    res.status(500).json({ code: 500, msg: '预结算失败', data: null });
  }
};

// POST /api/v1/market/orders
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { shop_id, items, receiver_name, receiver_phone, receiver_address, remark } = req.body;
    if (!shop_id) {
      await t.rollback();
      return res.status(400).json({ code: 400, msg: '缺少 shop_id', data: null });
    }

    const normItems = normalizeItems(items);
    if (normItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ code: 400, msg: 'items 不能为空', data: null });
    }

    const { shop, err } = await loadShopOrErr(shop_id);
    if (err) {
      await t.rollback();
      return bizError(res, err.code, err.msg);
    }

    const goodsIds = normItems.map(i => i.goods_id);
    const goodsList = await MarketGood.findAll({
      where: { id: goodsIds, shop_id, status: 'on_sale' },
      // 这里不再强制对商品行加 FOR UPDATE 锁：
      // 库存扣减使用了 UPDATE ... WHERE stock >= q 的原子条件，能够保证不超卖，
      // 继续叠加行锁会显著放大并发下的锁等待时间，导致客户端超时。
      transaction: t
    });
    if (goodsList.length !== goodsIds.length) {
      await t.rollback();
      return bizError(res, 20011, '商品不存在或已下架');
    }

    const qtyMap = new Map(normItems.map(i => [String(i.goods_id), i.quantity]));

    // 扣库存（原子+事务）
    for (const g of goodsList) {
      const q = qtyMap.get(String(g.id)) || 0;
      if (q <= 0) continue;
      const [affected] = await MarketGood.update(
        { stock: sequelize.literal(`stock - ${q}`) },
        { where: { id: g.id, stock: { [Op.gte]: q }, status: 'on_sale' }, transaction: t }
      );
      if (!affected) {
        await t.rollback();
        return bizError(res, 20012, `库存不足：${g.name}`);
      }
    }

    const amounts = calcAmounts(goodsList, qtyMap, shop.delivery_fee, 0);
    if (amounts.goods_amount < Number(shop.min_order_amount)) {
      await t.rollback();
      return bizError(res, 20021, '未达到起送价');
    }

    const orderNo = genOrderNo();
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    const order = await MarketOrder.create({
      order_no: orderNo,
      user_id: userId,
      shop_id,
      order_status: 'pending_payment',
      pay_status: 'unpaid',
      ...amounts,
      receiver_name: receiver_name || null,
      receiver_phone: receiver_phone || null,
      receiver_address: receiver_address || null,
      remark: remark || null,
      expired_at: expiredAt
    }, { transaction: t });

    const itemsToCreate = goodsList.map(g => {
      const q = qtyMap.get(String(g.id)) || 0;
      const unit = Number(g.price);
      const amt = Number((unit * q).toFixed(2));
      return {
        order_id: order.id,
        order_no: orderNo,
        shop_id,
        goods_id: g.id,
        goods_name_snapshot: g.name,
        goods_image_snapshot: g.main_image || null,
        unit_price_snapshot: unit,
        quantity: q,
        amount: amt
      };
    }).filter(x => x.quantity > 0);

    await MarketOrderItem.bulkCreate(itemsToCreate, { transaction: t });

    await t.commit();
    res.json({
      code: 0,
      msg: '订单创建成功',
      data: {
        order_no: orderNo,
        order_status: order.order_status,
        pay_status: order.pay_status,
        payable_amount: String(order.payable_amount),
        expired_at: order.expired_at
      }
    });
  } catch (e) {
    await t.rollback();
    console.error('orders/create error:', e);
    res.status(500).json({ code: 500, msg: '创建订单失败', data: null });
  }
};

// GET /api/v1/market/orders/my
exports.myOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 10;
    const offset = (page - 1) * pageSize;
    const where = { user_id: userId };
    if (req.query.status) where.order_status = req.query.status;
    const { rows, count } = await MarketOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: pageSize
    });
    res.json(ok({ list: rows, page, page_size: pageSize, total: count }));
  } catch (e) {
    console.error('orders/my error:', e);
    res.status(500).json({ code: 500, msg: '获取订单列表失败', data: null });
  }
};

// GET /api/v1/market/orders/:orderNo
exports.detail = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    const items = await MarketOrderItem.findAll({ where: { order_no: order.order_no } });
    res.json(ok({ order, items }));
  } catch (e) {
    console.error('orders/detail error:', e);
    res.status(500).json({ code: 500, msg: '获取订单详情失败', data: null });
  }
};

// POST /api/v1/market/orders/:orderNo/cancel
exports.cancel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    }
    if (order.order_status !== 'pending_payment') {
      await t.rollback();
      return bizError(res, 20031, '订单状态不允许取消');
    }

    const items = await MarketOrderItem.findAll({ where: { order_no: order.order_no }, transaction: t });

    // 回补库存
    for (const it of items) {
      await MarketGood.update(
        { stock: sequelize.literal(`stock + ${it.quantity}`) },
        { where: { id: it.goods_id }, transaction: t }
      );
    }

    order.order_status = 'cancelled';
    order.cancelled_at = new Date();
    order.cancel_reason = (req.body && req.body.reason) || 'user_cancel';
    await order.save({ transaction: t });

    await t.commit();
    res.json(ok({ order_no: order.order_no, order_status: order.order_status }));
  } catch (e) {
    await t.rollback();
    console.error('orders/cancel error:', e);
    res.status(500).json({ code: 500, msg: '取消订单失败', data: null });
  }
};
