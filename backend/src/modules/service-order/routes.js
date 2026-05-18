const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/serviceOrder.controller');

router.use(authMiddleware);

router.post('/', ctrl.create);
router.get('/my', ctrl.getMyList);
router.get('/detail', ctrl.getDetailByNo);
router.get('/:id', ctrl.getDetail);
router.post('/:id/mock-pay', ctrl.mockPay);
router.post('/:id/pay', ctrl.mockPay); // 兼容前端 /pay
router.post('/:id/confirm', ctrl.confirm);
router.post('/:id/confirm-complete', ctrl.confirm); // 兼容前端 /confirm-complete

module.exports = router;
