const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const serviceOrderController = require('../controllers/serviceOrderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/apply', authMiddleware, applicationController.serviceProviderApply);
router.get('/orders', authMiddleware, serviceOrderController.providerListOrders);
router.get('/orders/:id', authMiddleware, serviceOrderController.providerGetOrder);
router.post('/orders/:id/accept', authMiddleware, serviceOrderController.providerAccept);
router.post('/orders/:id/check-in', authMiddleware, serviceOrderController.providerCheckIn);
router.post('/orders/:id/evidence', authMiddleware, serviceOrderController.providerEvidence);
router.post('/orders/:id/complete', authMiddleware, serviceOrderController.providerComplete);

module.exports = router;
