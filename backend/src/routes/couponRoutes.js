const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const couponController = require('../controllers/couponController');

router.use(authMiddleware);

router.get('/list', couponController.getCouponList);
router.post('/receive', couponController.receiveCoupon);
router.get('/my', couponController.getMyCoupons);
router.get('/available-for-order', couponController.getAvailableCouponsForOrder);
router.get('/:couponId', couponController.getCouponDetail);

module.exports = router;
