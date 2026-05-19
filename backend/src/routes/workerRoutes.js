const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const workerPortalController = require('../controllers/workerPortalController');

router.post('/apply', authMiddleware, applicationController.workerApply);
router.get('/application/me', authMiddleware, applicationController.getWorkerApplicationMe);

router.get('/service-orders', authMiddleware, workerPortalController.listOrders);
router.get('/service-orders/:id', authMiddleware, workerPortalController.getOrder);
router.post('/service-orders/:id/accept', authMiddleware, workerPortalController.accept);
router.post('/service-orders/:id/reject', authMiddleware, workerPortalController.reject);
router.post('/service-orders/:id/check-in', authMiddleware, workerPortalController.checkIn);
router.post('/service-orders/:id/evidence', authMiddleware, workerPortalController.evidence);
router.post('/service-orders/:id/addon-request', authMiddleware, workerPortalController.addonRequest);
router.post('/service-orders/:id/complete', authMiddleware, workerPortalController.complete);

module.exports = router;
