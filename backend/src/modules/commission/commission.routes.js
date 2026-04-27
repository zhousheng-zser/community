/**
 * Commission Routes
 * GET /commission/config          - Public commission rates
 * GET /commission/my              - User's balance
 * GET /commission/my/records      - Commission records
 * GET /commission/orders          - Commission orders
 * GET /commission/orders/:id/breakdown - Order breakdown
 * GET /commission/partner-chain   - Partner chain
 * POST /commission/withdraw       - Withdraw
 * POST /commission/distribute     - Webhook (from main backend)
 * POST /commission/revert         - Webhook (from main backend)
 * POST /commission/confirm        - Webhook (from main backend)
 */
const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/commission.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Public route
router.get('/config', ctrl.getConfig);

// Webhook routes (called by main backend, use internal auth)
router.post('/distribute', ctrl.distributeWebhook);
router.post('/revert', ctrl.revertWebhook);
router.post('/confirm', ctrl.confirmWebhook);

// Authenticated routes
router.use(authMiddleware);
router.get('/my', ctrl.getMyBalance);
router.get('/my/records', ctrl.getMyRecords);
router.get('/orders', ctrl.getMyCommissionOrders);
router.get('/orders/:orderId/breakdown', ctrl.getOrderBreakdown);
router.get('/partner-chain', ctrl.getPartnerChain);
router.post('/withdraw', ctrl.withdraw);

module.exports = router;
