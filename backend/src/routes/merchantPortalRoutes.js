const express = require('express');
const router = express.Router();
const merchantPortalAuth = require('../middlewares/merchantPortalAuthMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/merchantPortalController');
const debugSkipMerchantToken = process.env.DEBUG_SKIP_MERCHANT_TOKEN === '1';
const optionalAuthMiddleware = (req, _res, next) => {
  req.user = req.user || {};
  next();
};

// 用户 token -> merchant token 兑换接口（必须在 merchantPortalAuth 之前）
router.post(
  '/token/exchange',
  debugSkipMerchantToken ? optionalAuthMiddleware : authMiddleware,
  ctrl.exchangeToken
);

router.use(merchantPortalAuth);
router.get('/dashboard', ctrl.getDashboard);
router.get('/application', ctrl.getApplication);
router.get('/shop', ctrl.getShop);
router.patch('/shop', ctrl.patchShop);
router.get('/goods', ctrl.listGoods);
router.post('/goods', ctrl.createGood);
router.get('/goods/:id', ctrl.getGood);
router.patch('/goods/:id', ctrl.patchGood);
router.post('/goods/:id/restock', ctrl.restock);
router.post('/goods/:id/shelf', ctrl.shelf);
router.get('/orders', ctrl.listOrders);
router.get('/orders/:orderNo', ctrl.getOrderDetail);
router.post('/orders/:orderNo/action', ctrl.applyOrderAction);
// 兼容前端历史调用：统一映射到 /action
router.post('/orders/:orderNo/accept', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'accept' };
  return ctrl.applyOrderAction(req, res, next);
});
router.post('/orders/:orderNo/cancel', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'reject' };
  return ctrl.applyOrderAction(req, res, next);
});
router.post('/orders/:orderNo/ship', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'dispatch' };
  return ctrl.applyOrderAction(req, res, next);
});
router.post('/orders/:orderNo/delivered', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'delivered' };
  return ctrl.applyOrderAction(req, res, next);
});
router.post('/orders/:orderNo/complete-delivery', (req, res, next) => {
  req.body = { ...(req.body || {}), action: 'delivered' };
  return ctrl.applyOrderAction(req, res, next);
});
router.get('/payments', ctrl.listPayments);

module.exports = router;
