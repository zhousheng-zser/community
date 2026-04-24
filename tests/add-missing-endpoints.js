#!/usr/bin/env node
/**
 * Script to add missing backend endpoints
 * Run via SSH on the server
 */
const { execSync } = require('child_process');
const SSH = 'ssh cw@192.168.110.50';

// 1. Add missing market routes (confirm-receipt, refund, buy-again, logistics, shop-contact)
const marketRoutesAppend = `
// ---- Additional endpoints ----

// POST /api/v1/market/orders/:orderNo/confirm-receipt
router.post('/orders/:orderNo/confirm-receipt', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { MarketOrder } = require('../models');
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    if (order.order_status !== 'pending_receipt') return res.json({ code: 400, msg: '订单状态不允许确认收货', data: null });
    order.order_status = 'completed';
    await order.save();
    res.json({ code: 0, msg: '确认收货成功', data: { order_no: order.order_no, order_status: order.order_status } });
  } catch (e) {
    console.error('confirm-receipt error:', e);
    res.status(500).json({ code: 500, msg: '确认收货失败', data: null });
  }
});

// POST /api/v1/market/orders/:orderNo/refund
router.post('/orders/:orderNo/refund', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { MarketOrder, MarketRefundOrder } = require('../models');
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    if (!['completed', 'pending_receipt', 'pending_service'].includes(order.order_status)) {
      return res.json({ code: 400, msg: '订单状态不允许退款', data: null });
    }
    const refund = await MarketRefundOrder.create({
      order_id: order.id,
      order_no: order.order_no,
      user_id: userId,
      shop_id: order.shop_id,
      refund_amount: order.payable_amount,
      reason: (req.body && req.body.reason) || '用户申请退款',
      status: 'pending'
    });
    order.pay_status = 'refund_pending';
    await order.save();
    res.json({ code: 0, msg: '退款申请成功', data: { refund_id: refund.id, refund_no: refund.refund_no || refund.id } });
  } catch (e) {
    console.error('refund error:', e);
    res.status(500).json({ code: 500, msg: '退款申请失败', data: null });
  }
});

// GET /api/v1/market/orders/:orderNo/refund
router.get('/orders/:orderNo/refund', authMiddleware, async (req, res) => {
  try {
    const { MarketRefundOrder } = require('../models');
    const refunds = await MarketRefundOrder.findAll({ where: { order_no: req.params.orderNo }, order: [['created_at', 'DESC']] });
    res.json({ code: 0, msg: 'ok', data: { list: refunds } });
  } catch (e) {
    console.error('refund detail error:', e);
    res.status(500).json({ code: 500, msg: '获取退款详情失败', data: null });
  }
});

// POST /api/v1/market/orders/:orderNo/refund/cancel
router.post('/orders/:orderNo/refund/cancel', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { MarketRefundOrder, MarketOrder } = require('../models');
    const refund = await MarketRefundOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId, status: 'pending' }, order: [['created_at', 'DESC']] });
    if (!refund) return res.json({ code: 404, msg: '未找到待处理的退款申请', data: null });
    refund.status = 'cancelled';
    await refund.save();
    const order = await MarketOrder.findByPk(refund.order_id);
    if (order) {
      order.pay_status = 'paid';
      await order.save();
    }
    res.json({ code: 0, msg: '已取消退款申请', data: null });
  } catch (e) {
    console.error('cancel refund error:', e);
    res.status(500).json({ code: 500, msg: '取消退款失败', data: null });
  }
});

// POST /api/v1/market/orders/:orderNo/buy-again
router.post('/orders/:orderNo/buy-again', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { MarketOrder, MarketOrderItem } = require('../models');
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    const items = await MarketOrderItem.findAll({ where: { order_no: order.order_no } });
    const goodsItems = items.map(it => ({ goods_id: it.goods_id, quantity: it.quantity, sku_id: it.market_sku_id }));
    res.json({ code: 0, msg: 'ok', data: { goods_items: goodsItems, shop_id: order.shop_id } });
  } catch (e) {
    console.error('buy-again error:', e);
    res.status(500).json({ code: 500, msg: '再次购买失败', data: null });
  }
});

// GET /api/v1/market/orders/:orderNo/logistics
router.get('/orders/:orderNo/logistics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { MarketOrder } = require('../models');
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    res.json({ code: 0, msg: 'ok', data: { tracking_no: null, courier: '', logistics: [], delivery_status: order.order_status === 'pending_receipt' ? 'shipping' : 'none' } });
  } catch (e) {
    console.error('logistics error:', e);
    res.status(500).json({ code: 500, msg: '获取物流失败', data: null });
  }
});

// GET /api/v1/market/shops/:shopId/contact
router.get('/shops/:shopId/contact', authMiddleware, async (req, res) => {
  try {
    const { MarketShop } = require('../models');
    const shop = await MarketShop.findByPk(req.params.shopId, { attributes: ['id', 'name', 'contact_phone', 'contact_name'] });
    if (!shop) return res.status(404).json({ code: 404, msg: '店铺不存在', data: null });
    res.json({ code: 0, msg: 'ok', data: { shop_id: shop.id, shop_name: shop.name, contact_phone: shop.contact_phone || '', contact_name: shop.contact_name || '' } });
  } catch (e) {
    console.error('shop contact error:', e);
    res.status(500).json({ code: 500, msg: '获取联系方式失败', data: null });
  }
});

module.exports = router;
`;

// 2. Add neighbor assist confirm endpoint
const neighborAssistConfirm = `
/** 发布方确认完成: 订单已完成时，发布方确认 */
exports.confirm = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在');
    if (order.status !== 'completed') return fail(res, 400, '订单未完成，无法确认');
    // 确认后即保持 completed 状态（可扩展评价等逻辑）
    return ok(res, { id: order.id, status: order.status, confirmed: true, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist confirm', e);
    return fail(res, 500, '操作失败');
  }
};
`;

console.log('Script ready to deploy missing endpoints to backend server.');
console.log('Use SSH to deploy these changes manually or via the deploy script.');
