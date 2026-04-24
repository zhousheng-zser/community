const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/serviceOrderController');

router.use(authMiddleware);
router.post('/', ctrl.create);
router.post('/bundle', ctrl.createBundle);
router.get('/my', ctrl.myList);
router.get('/detail', ctrl.getByOrderNo);
router.get('/:id', ctrl.getDetail);
router.post('/:id/pay', ctrl.mockPay);
router.post('/:id/complaint', ctrl.complaint);
router.post('/:id/confirm-complete', ctrl.confirmComplete);

module.exports = router;
