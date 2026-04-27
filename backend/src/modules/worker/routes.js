const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/worker.controller');

router.use(authMiddleware);

router.get('/service-orders', ctrl.getOrders);
router.get('/service-orders/:id', ctrl.getOrderDetail);
router.post('/service-orders/:id/accept', ctrl.acceptOrder);
router.post('/service-orders/:id/reject', ctrl.rejectOrder);
router.post('/service-orders/:id/check-in', ctrl.checkIn);
router.post('/service-orders/:id/evidence', ctrl.uploadEvidence);
router.post('/service-orders/:id/complete', ctrl.completeOrder);

module.exports = router;
