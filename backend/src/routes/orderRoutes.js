const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// 所有订单相关接口都需要登录鉴权
router.use(authMiddleware);

// 直接下单
router.post('/', orderController.createOrder);

// 发布邻里帮帮需求（需登录）
router.post('/publish', orderController.publishOrder);
// 获取近期发布需求列表（需登录）
router.get('/recent', orderController.getRecentPublishOrders);

// 获取我的订单列表
router.get('/my', orderController.getMyOrders);

// 模拟支付订单
router.post('/:id/pay', orderController.mockPayOrder);

module.exports = router;
