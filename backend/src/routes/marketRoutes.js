const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const marketShopController = require('../controllers/marketShopController');
const marketCartController = require('../controllers/marketCartController');
const marketOrderController = require('../controllers/marketOrderController');
const marketPaymentController = require('../controllers/marketPaymentController');

// 商家入驻申请（历史接口，保留）
router.post('/apply', authMiddleware, applicationController.marketApply);

// 本地集市店铺与商品读接口（公共）
router.get('/shops', marketShopController.listShops);
router.get('/shops/:shopId/reviews', marketShopController.listShopReviews);
router.get('/shops/:shopId', marketShopController.getShopDetail);
router.get('/shops/:shopId/categories', marketShopController.getShopCategories);
router.get('/shops/:shopId/goods', marketShopController.getShopGoods);
router.get('/goods/:goodsId', marketShopController.getGoodsDetail);

// 购物车接口（登录态）
router.get('/cart', authMiddleware, marketCartController.getCart);
router.post('/cart/items', authMiddleware, marketCartController.addItem);
router.put('/cart/items/:itemId', authMiddleware, marketCartController.updateItem);
router.delete('/cart/items/:itemId', authMiddleware, marketCartController.deleteItem);
router.delete('/cart', authMiddleware, marketCartController.clearCart);

// 订单接口（登录态）
router.post('/orders/preview', authMiddleware, marketOrderController.preview);
router.post('/orders', authMiddleware, marketOrderController.create);
router.get('/orders/my', authMiddleware, marketOrderController.myOrders);
router.get('/orders/:orderNo', authMiddleware, marketOrderController.detail);
router.post('/orders/:orderNo/cancel', authMiddleware, marketOrderController.cancel);

// 支付接口（登录态 + 回调）\n
router.post('/payments/create', authMiddleware, marketPaymentController.createPayment);
router.get('/payments/create', marketPaymentController.createPaymentGetNotAllowed);
router.get('/payments/status', authMiddleware, marketPaymentController.getPaymentStatus);
// 开发联调专用：手动把订单置为已支付（生产环境禁用）
router.post('/payments/mock-success', authMiddleware, marketPaymentController.mockSuccess);
// 支付回调（不走 JWT，必须验签 + 幂等 + 落库）
router.post('/pay/callback', marketPaymentController.payCallback);

module.exports = router;
