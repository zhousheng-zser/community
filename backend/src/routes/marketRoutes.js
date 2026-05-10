const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const marketShopController = require('../controllers/marketShopController');
const marketSearchController = require('../controllers/marketSearchController');
const marketCartController = require('../controllers/marketCartController');
const marketFavoriteController = require('../controllers/marketFavoriteController');
const marketOrderController = require('../controllers/marketOrderController');
const marketPaymentController = require('../controllers/marketPaymentController');
const genRefundNo = () => `MR${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

// 商家入驻申请
router.post('/apply', authMiddleware, applicationController.marketApply);
router.post('/merchant/apply', authMiddleware, applicationController.marketApply);

router.get('/search', marketSearchController.search);

// 本地集市店铺与商品读接口（公共）
router.get('/shops', marketShopController.listShops);
router.get('/shops/:shopId/reviews', marketShopController.listShopReviews);
router.get('/shops/:shopId', marketShopController.getShopDetail);
router.get('/shops/:shopId/categories', marketShopController.getShopCategories);
router.get('/shops/:shopId/goods', marketShopController.getShopGoods);
router.get('/goods/detail', marketShopController.getGoodsDetailByQuery);
router.get('/goods/:goodsId', marketShopController.getGoodsDetail);

// 购物车接口（登录态）
router.get('/cart', authMiddleware, marketCartController.getCart);
router.post('/cart/items', authMiddleware, marketCartController.addItem);
router.put('/cart/items/:itemId', authMiddleware, marketCartController.updateItem);
router.delete('/cart/items/:itemId', authMiddleware, marketCartController.deleteItem);
router.delete('/cart', authMiddleware, marketCartController.clearCart);

// 商品收藏（登录态）：每用户一个逻辑收藏夹，以 goods_id（market_goods.id）为唯一键
router.get('/favorites/status', authMiddleware, marketFavoriteController.status);
router.get('/favorites', authMiddleware, marketFavoriteController.listFavorites);
router.post('/favorites', authMiddleware, marketFavoriteController.addFavorite);
router.delete('/favorites/:goodsId', authMiddleware, marketFavoriteController.removeFavorite);

// 订单接口（登录态）；注意 /orders/my 须在 /orders/:orderNo 之前注册
router.post('/orders/preview', authMiddleware, marketOrderController.preview);
router.get('/order/detail', authMiddleware, marketOrderController.detailByQuery);
router.post('/order/create', authMiddleware, marketOrderController.create);
router.post('/orders', authMiddleware, marketOrderController.create);
router.get('/orders/my', authMiddleware, marketOrderController.myOrders);
router.get('/orders', authMiddleware, marketOrderController.myOrders);
router.get('/orders/:orderNo', authMiddleware, marketOrderController.detail);
router.post('/orders/:orderNo/cancel', authMiddleware, marketOrderController.cancel);

// 支付接口（登录态 + 回调）
router.post('/payments/create', authMiddleware, marketPaymentController.createPayment);
router.get('/payments/create', marketPaymentController.createPaymentGetNotAllowed);
router.get('/payments/status', authMiddleware, marketPaymentController.getPaymentStatus);
router.post('/payments/mock-success', authMiddleware, marketPaymentController.mockSuccess);
router.post('/pay/callback', marketPaymentController.payCallback);


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
    const { MarketOrder, MarketRefundOrder, Conversation, UserConversation, Message, sequelize } = require('../models');
    const order = await MarketOrder.findOne({ where: { order_no: req.params.orderNo, user_id: userId } });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    if (!['pending_accept', 'completed', 'pending_receipt', 'pending_service'].includes(order.order_status)) {
      return res.json({ code: 400, msg: '订单状态不允许退款', data: null });
    }
    // 待接单阶段：直接退款并归档到已取消
    if (order.order_status === 'pending_accept') {
      const refund = await MarketRefundOrder.create({
        refund_no: genRefundNo(),
        order_id: order.id,
        order_no: order.order_no,
        user_id: userId,
        shop_id: order.shop_id,
        refund_amount: order.payable_amount,
        reason: (req.body && req.body.reason) || '用户申请退款',
        status: 'success'
      });
      order.pay_status = 'refunded';
      order.order_status = 'cancelled';
      order.cancel_reason = 'user_refund_before_accept';
      order.cancelled_at = new Date();
      await order.save();
      // 推送一条消息节点到消息会话
      try {
        const t = await sequelize.transaction();
        let mapping = await UserConversation.findOne({
          where: { user_id: userId, peer_id: userId, bot_type: 'logistics' },
          transaction: t
        });
        let conversationId = mapping && mapping.conversation_id;
        if (!conversationId) {
          const conv = await Conversation.create({ type: 'system', last_message_preview: '订单已退款' }, { transaction: t });
          conversationId = conv.id;
          if (mapping) {
            mapping.conversation_id = conversationId;
            await mapping.save({ transaction: t });
          } else {
            await UserConversation.create({
              user_id: userId,
              conversation_id: conversationId,
              peer_id: userId,
              bot_type: 'logistics',
              unread_count: 0,
              is_deleted: false
            }, { transaction: t });
          }
        }
        const content = `订单${order.order_no}已退款并取消`;
        await Message.create({ conversation_id: conversationId, sender_id: userId, msg_type: 'logistics', content }, { transaction: t });
        await Conversation.update({ last_message_preview: content, updated_at: new Date() }, { where: { id: conversationId }, transaction: t });
        await UserConversation.update({ is_deleted: false }, { where: { user_id: userId, conversation_id: conversationId }, transaction: t });
        await UserConversation.increment('unread_count', { by: 1, where: { user_id: userId, conversation_id: conversationId }, transaction: t });
        await t.commit();
      } catch (notifyErr) {
        console.error('refund notify error:', notifyErr);
      }
      return res.json({ code: 0, msg: '退款成功', data: { refund_id: refund.id, order_status: order.order_status, pay_status: order.pay_status } });
    }
    const refund = await MarketRefundOrder.create({
      refund_no: genRefundNo(),
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
