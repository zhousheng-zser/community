const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/serviceOrderController');
const paymentCtrl = require('../controllers/servicePaymentController');

router.use(authMiddleware);
router.post('/', ctrl.create);
router.post('/bundle', ctrl.createBundle);
router.get('/my', ctrl.myList);
router.get('/detail', ctrl.getByOrderNo);
router.get('/:id', ctrl.getDetail);
router.post('/:id/pay', ctrl.mockPay);
router.post('/:id/complaint', ctrl.complaint);
router.post('/:id/confirm-complete', ctrl.confirmComplete);
router.post('/:id/confirm', ctrl.confirmComplete); // 兼容 E2E 脚本

// 服务订单支付（复用微信支付V3）
router.post('/payments/create', paymentCtrl.createPayment);
router.get('/payments/status', paymentCtrl.getPaymentStatus);
router.post('/payments/mock-success', paymentCtrl.mockSuccess);

module.exports = router;
