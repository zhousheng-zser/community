const express = require('express');
const router = express.Router();
const merchantPortalAuth = require('../middlewares/merchantPortalAuthMiddleware');
const ctrl = require('../controllers/merchantPortalController');

router.use(merchantPortalAuth);
router.get('/dashboard', ctrl.getDashboard);
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
router.get('/payments', ctrl.listPayments);

module.exports = router;
