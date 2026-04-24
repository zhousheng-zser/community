const express = require('express');
const router = express.Router();
const auth = require('../middlewares/serviceProviderPortalAuthMiddleware');
const ctrl = require('../controllers/serviceProviderPortalController');

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

module.exports = router;
