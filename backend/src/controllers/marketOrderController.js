const { sequelize, MarketShop, MarketGood, MarketGoodSku, MarketOrder, MarketOrderItem } = require('../models');
const { Op } = require('sequelize');
const {
  resolveSkuId,
  parseSpecs,
  syncGoodStockFromSkus,
  refreshPriceRangeForGood
} = require('../utils/marketSku');

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

function calcAmountsFromLines(lines, deliveryFee, discountAmount) {
  let goodsAmount = 0;
  for (const ln of lines) {
    goodsAmount += Number(ln.unitPrice) * ln.quantity;
  }
  goodsAmount = Number(goodsAmount.toFixed(2));
  deliveryFee = Number(Number(deliveryFee || 0).toFixed(2));
  discountAmount = Number(Number(discountAmount || 0).toFixed(2));
  const payableAmount = Number((goodsAmount + deliveryFee - discountAmount).toFixed(2));
  return { goods_amount: goodsAmount, delivery_fee: deliveryFee, discount_amount: discountAmount, payable_amount: payableAmount };
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const map = new Map();
  for (const it of items) {
    if (!it || it.goods_id == null) continue;
    const gid = Number(it.goods_id);
    const skuNum = resolveSkuId(it.sku_id);
    const q = Math.max(0, parseInt(it.quantity, 10) || 0);
    if (!q || !Number.isFinite(gid)) continue;
    const key = skuNum != null ? `s:${skuNum}` : `g:${gid}`;
    const prev = map.get(key) || { goods_id: gid, market_sku_id: skuNum, quantity: 0 };
    prev.quantity += q;
    if (skuNum != null) prev.market_sku_id = skuNum;
    map.set(key, prev);
  }
  return [...map.values()];
}

function extractReceiver(reqBody, deliveryMode) {
  const b = reqBody || {};
  let receiver_name;
  let receiver_phone;
  let receiver_address;
  if (b.address && typeof b.address === 'object') {
    const a = b.address;
    receiver_name = a.receiver_name || a.name || a.receiverName;
    receiver_phone = a.receiver_phone || a.phone || a.receiverPhone;
    receiver_address = a.receiver_address || a.address || a.full_address || a.detail;
  }
  if (receiver_name == null) receiver_name = b.receiver_name;
  if (receiver_phone == null) receiver_phone = b.receiver_phone;
  if (receiver_address == null) receiver_address = b.receiver_address;
  const dm = String(deliveryMode || 'express');
  if (dm === 'express') {
    if (!receiver_phone || !receiver_address) {
      return { err: { code: 400, msg: 'express 配送须填写收货电话与地址' } };
    }
  }
  return { receiver_name: receiver_name || null, receiver_phone: receiver_phone || null, receiver_address: receiver_address || null };
}

async function loadShopOrErr(shopId) {
  const shop = await MarketShop.findByPk(shopId);
  if (!shop || !shop.is_active) return { err: { code: 20001, msg: '店铺不存在或已下线' } };
  if (!shop.is_open) return { err: { code: 20002, msg: '店铺休息中' } };
  return { shop };
}

async function resolveLinesForShop(normItems, shopId, transaction) {
  const lines = [];
  for (const it of normItems) {
    let sku = null;
    let good = null;
    if (it.market_sku_id != null) {
      sku = await MarketGoodSku.findOne({
        where: { id: it.market_sku_id, status: 'active' },
        include: [{ model: MarketGood, as: 'good', required: true }],
        transaction
      });
      if (!sku || !sku.good || sku.good.shop_id !== shopId || sku.good.status !== 'on_sale' || sku.good.id !== it.goods_id) {
        return { err: { code: 20011, msg: 'SKU 不存在或已下架' } };
      }
      good = sku.good;
    } else {
      good = await MarketGood.findOne({
        where: { id: it.goods_id, shop_id: shopId, status: 'on_sale' },
        transaction
      });
      if (!good) return { err: { code: 20011, msg: '商品不存在或已下架' } };
      const skus = await MarketGoodSku.findAll({
        where: { goods_id: good.id, status: 'active' },
        transaction
      });
      if (skus.length !== 1) {
        return { err: { code: 20011, msg: '请选择规格 sku_id' } };
      }
      sku = skus[0];
    }
    lines.push({
      goods_id: good.id,
      market_sku_id: sku.id,
      quantity: it.quantity,
      unitPrice: Number(sku.price),
      specs: parseSpecs(sku.specs),
      good,
      sku
    });
  }
  return { lines };
}

async function formatListItem(order, transaction) {
  const shop = await MarketShop.findByPk(order.shop_id, { transaction });
  const items = await MarketOrderItem.findAll({ where: { order_no: order.order_no }, transaction });
  let refundStatus = '';
  if (order.pay_status === 'refund_pending') refundStatus = 'pending';
  if (order.pay_status === 'refunded' || order.order_status === 'refunded') refundStatus = 'success';
  return {
    orderNo: order.order_no,
    shopName: shop ? shop.name : '',
    status: order.order_status,
    amount: order.payable_amount != null ? String(order.payable_amount) : '0',
    refundStatus,
    goods: items.map((it) => ({
      id: it.goods_id,
      name: it.goods_name_snapshot,
      image: it.goods_image_snapshot,
      price: String(it.unit_price_snapshot),
      quantity: it.quantity
    }))
  };
}

// POST /api/v1/market/orders/preview
exports.preview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shop_id, items, delivery_mode } = req.body;
    if (!shop_id) return res.status(400).json({ code: 400, msg: '缺少 shop_id', data: null });

    const dm = delivery_mode === 'pickup' ? 'pickup' : 'express';

    const normItems = normalizeOrderItems(items);
    if (normItems.length === 0) return res.status(400).json({ code: 400, msg: 'items 不能为空', data: null });

    const { shop, err } = await loadShopOrErr(shop_id);
    if (err) return bizError(res, err.code, err.msg);

    const t = await sequelize.transaction();
    try {
      const { lines, err: e2 } = await resolveLinesForShop(normItems, shop_id, t);
      if (e2) {
        await t.rollback();
        return bizError(res, e2.code, e2.msg);
      }
      for (const ln of lines) {
        if (ln.sku.stock < ln.quantity) {
          await t.rollback();
          return bizError(res, 20012, `库存不足：${ln.good.name}`);
        }
      }
      const amounts = calcAmountsFromLines(lines, shop.delivery_fee, 0);
      if (amounts.goods_amount < Number(shop.min_order_amount)) {
        await t.rollback();
        return bizError(res, 20021, '未达到起送价');
      }
      await t.commit();
      res.json(
        ok({
          user_id: userId,
          shop_id,
          delivery_mode: dm,
          ...amounts
        })
      );
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (e) {
    console.error('orders/preview error:', e);
    res.status(500).json({ code: 500, msg: '预结算失败', data: null });
  }
};

// POST /api/v1/market/orders 与 POST /order/create
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { shop_id, items, remark, delivery_mode } = req.body;
    const dm = delivery_mode === 'pickup' ? 'pickup' : 'express';
    const recv = extractReceiver(req.body, dm);
    if (recv.err) {
      await t.rollback();
      return res.status(400).json({ code: recv.err.code, msg: recv.err.msg, data: null });
    }
    const { receiver_name, receiver_phone, receiver_address } = recv;

    if (!shop_id) {
      await t.rollback();
      return res.status(400).json({ code: 400, msg: '缺少 shop_id', data: null });
    }

    const normItems = normalizeOrderItems(items);
    if (normItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ code: 400, msg: 'items 不能为空', data: null });
    }

    const { shop, err } = await loadShopOrErr(shop_id);
    if (err) {
      await t.rollback();
      return bizError(res, err.code, err.msg);
    }

    const { lines, err: e2 } = await resolveLinesForShop(normItems, shop_id, t);
    if (e2) {
      await t.rollback();
      return bizError(res, e2.code, e2.msg);
    }

    for (const ln of lines) {
      const q = ln.quantity;
      const [affected] = await MarketGoodSku.update(
        { stock: sequelize.literal(`stock - ${q}`) },
        { where: { id: ln.sku.id, stock: { [Op.gte]: q }, status: 'active' }, transaction: t }
      );
      if (!affected) {
        await t.rollback();
        return bizError(res, 20012, `库存不足：${ln.good.name}`);
      }
    }

    for (const ln of lines) {
      await syncGoodStockFromSkus(ln.goods_id, t);
      await refreshPriceRangeForGood(ln.goods_id, t);
    }

    const amounts = calcAmountsFromLines(lines, shop.delivery_fee, 0);
    if (amounts.goods_amount < Number(shop.min_order_amount)) {
      await t.rollback();
      return bizError(res, 20021, '未达到起送价');
    }

    const orderNo = genOrderNo();
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    const order = await MarketOrder.create(
      {
        order_no: orderNo,
        user_id: userId,
        shop_id,
        order_status: 'pending_payment',
        pay_status: 'unpaid',
        delivery_mode: dm,
        ...amounts,
        receiver_name,
        receiver_phone,
        receiver_address,
        remark: remark || null,
        expired_at: expiredAt,
        community_id: req.body.community_id != null ? req.body.community_id : null
      },
      { transaction: t }
    );

    const itemsToCreate = lines.map((ln) => {
      const unit = ln.unitPrice;
      const amt = Number((unit * ln.quantity).toFixed(2));
      return {
        order_id: order.id,
        order_no: orderNo,
        shop_id,
        goods_id: ln.goods_id,
        market_sku_id: ln.market_sku_id,
        specs_snapshot: ln.specs.length ? ln.specs : null,
        goods_name_snapshot: ln.good.name,
        goods_image_snapshot: ln.good.main_image || null,
        unit_price_snapshot: unit,
        quantity: ln.quantity,
        amount: amt
      };
    });

    await MarketOrderItem.bulkCreate(itemsToCreate, { transaction: t });

    await t.commit();
    res.json({
      code: 0,
      msg: '订单创建成功',
      data: {
        orderNo: orderNo,
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

// GET /api/v1/market/orders/my 与 GET /orders
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
    const list = [];
    for (const row of rows) {
      list.push(await formatListItem(row, null));
    }
    res.json(ok({ list, page, page_size: pageSize, total: count }));
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
    const shop = await MarketShop.findByPk(order.shop_id);
    res.json(ok({ order, items, shop }));
  } catch (e) {
    console.error('orders/detail error:', e);
    res.status(500).json({ code: 500, msg: '获取订单详情失败', data: null });
  }
};

// GET /api/v1/market/order/detail?order_no=
exports.detailByQuery = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderNo = req.query.order_no;
    if (!orderNo) return res.status(400).json({ code: 400, msg: '缺少 order_no', data: null });
    const order = await MarketOrder.findOne({ where: { order_no: orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    const items = await MarketOrderItem.findAll({ where: { order_no: order.order_no } });
    const shop = await MarketShop.findByPk(order.shop_id);
    const goods = items.map((it) => ({
      id: it.goods_id,
      name: it.goods_name_snapshot,
      image: it.goods_image_snapshot,
      price: String(it.unit_price_snapshot),
      quantity: it.quantity
    }));
    res.json(
      ok({
        orderNo: order.order_no,
        status: order.order_status,
        shopName: shop ? shop.name : '',
        shopPhone: shop ? shop.contact_phone || '' : '',
        goods_amount: order.goods_amount != null ? String(order.goods_amount) : '0',
        delivery_fee: order.delivery_fee != null ? String(order.delivery_fee) : '0',
        discount_amount: order.discount_amount != null ? String(order.discount_amount) : '0',
        payable_amount: order.payable_amount != null ? String(order.payable_amount) : '0',
        created_at: order.created_at,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address,
        delivery_mode: order.delivery_mode,
        goods
      })
    );
  } catch (e) {
    console.error('order/detail error:', e);
    res.status(500).json({ code: 500, msg: '获取订单详情失败', data: null });
  }
};

// POST /api/v1/market/orders/:orderNo/cancel
exports.cancel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const order = await MarketOrder.findOne({
      where: { order_no: req.params.orderNo, user_id: userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    }
    if (order.order_status !== 'pending_payment') {
      await t.rollback();
      return bizError(res, 20031, '订单状态不允许取消');
    }

    const items = await MarketOrderItem.findAll({ where: { order_no: order.order_no }, transaction: t });

    for (const it of items) {
      if (it.market_sku_id) {
        await MarketGoodSku.update(
          { stock: sequelize.literal(`stock + ${it.quantity}`) },
          { where: { id: it.market_sku_id }, transaction: t }
        );
        await syncGoodStockFromSkus(it.goods_id, t);
        await refreshPriceRangeForGood(it.goods_id, t);
      } else {
        await MarketGood.update(
          { stock: sequelize.literal(`stock + ${it.quantity}`) },
          { where: { id: it.goods_id }, transaction: t }
        );
      }
    }

    order.order_status = 'cancelled';
    order.cancelled_at = new Date();
    order.cancel_reason = (req.body && req.body.reason) || 'user_cancel';
    await order.save({ transaction: t });

    await t.commit();
    res.json(ok({ order_no: order.order_no, orderNo: order.order_no, order_status: order.order_status }));
  } catch (e) {
    await t.rollback();
    console.error('orders/cancel error:', e);
    res.status(500).json({ code: 500, msg: '取消订单失败', data: null });
  }
};
