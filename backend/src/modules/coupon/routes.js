const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const couponController = require('./controllers/coupon.controller');

router.use(authMiddleware);

router.get('/home', couponController.getHomeCoupons);
router.get('/list', couponController.getCouponList);
router.post('/receive', couponController.receiveCoupon);
router.get('/my', couponController.getMyCoupons);
router.get('/available-for-order', couponController.getAvailableCouponsForOrder);
router.get('/:couponId', couponController.getCouponDetail);

module.exports = router;
