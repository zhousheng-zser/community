const express = require('express');
const router = express.Router();
const auth = require('../middlewares/serviceProviderPortalAuthMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const applicationController = require('../controllers/applicationController');
const ctrl = require('../controllers/serviceProviderPortalController');

// 用户 JWT 换取服务商门户 token（必须在 auth 中间件之前）
router.post('/token/exchange', authMiddleware, ctrl.exchangeToken);
// C 端入驻（用户 JWT，非服务商门户 token）
router.post('/apply', authMiddleware, applicationController.serviceProviderApply);
router.get('/application/me', authMiddleware, applicationController.getServiceProviderApplicationMe);

router.get('/me', auth, ctrl.getMe);
router.patch('/profile', auth, ctrl.patchProfile);
router.get('/dashboard', auth, ctrl.getDashboard);
router.get('/categories', auth, ctrl.listCategories);
router.get('/services', auth, ctrl.listServices);
router.post('/services', auth, ctrl.createService);
router.get('/services/:id', auth, ctrl.getService);
router.patch('/services/:id', auth, ctrl.patchService);
router.get('/orders', auth, ctrl.listOrders);
router.get('/orders/:id', auth, ctrl.getOrder);
router.post('/orders/:id/accept', auth, ctrl.orderAccept);
router.post('/orders/:id/check-in', auth, ctrl.orderCheckIn);
router.post('/orders/:id/evidence', auth, ctrl.orderEvidence);
router.post('/orders/:id/complete', auth, ctrl.orderComplete);

router.post('/services/:id/shelf', auth, ctrl.shelfService);
router.post('/orders/:id/action', auth, ctrl.orderAction);

// 支付记录
router.get('/payments', auth, ctrl.listPayments);

// 客户管理
router.get('/customers', auth, ctrl.getCustomers);
router.get('/customers/:id/orders', auth, ctrl.getCustomerOrders);
router.get('/customers/:id/stats', auth, ctrl.getCustomerStats);

// 营销管理（优惠券）
router.get('/marketing/coupons', auth, ctrl.getMarketingCoupons);
router.post('/marketing/coupons', auth, ctrl.createMarketingCoupon);
router.get('/marketing/stats', auth, ctrl.getMarketingStats);

// 退款管理
router.get('/refunds', auth, ctrl.getRefunds);
router.post('/refunds/:id/approve', auth, ctrl.approveRefund);
router.post('/refunds/:id/reject', auth, ctrl.rejectRefund);

module.exports = router;
