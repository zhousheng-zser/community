const express = require('express');
const router = express.Router();
const merchantPortalAuth = require('../middlewares/merchantPortalAuthMiddleware');
const { CouponTemplate, CouponIssue, sequelize } = require('../models');
const { Op } = require('sequelize');

router.use(merchantPortalAuth);

router.get('/coupons', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { shop_id: shopId };

    if (status) where.status = status;

    const { count, rows } = await CouponTemplate.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { name, type, discount_amount, min_amount, total_count, per_user_limit, start_time, end_time, description } = req.body;

    const coupon = await CouponTemplate.create({
      shop_id: shopId,
      name,
      type: type || 'fixed',
      discount_amount,
      min_amount: min_amount || 0,
      total_count,
      used_count: 0,
      per_user_limit: per_user_limit || 1,
      start_time,
      end_time,
      description,
      status: 'active'
    });

    res.json({ code: 0, data: coupon, message: '创建成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const shopId = req.shopId;
    const coupon = await CouponTemplate.findOne({
      where: { id: req.params.id, shop_id: shopId }
    });
    if (!coupon) return res.status(404).json({ code: -1, message: '优惠券不存在' });
    await coupon.update(req.body);
    res.json({ code: 0, data: coupon, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    const shopId = req.shopId;
    const coupon = await CouponTemplate.findOne({
      where: { id: req.params.id, shop_id: shopId }
    });
    if (!coupon) return res.status(404).json({ code: -1, message: '优惠券不存在' });
    await coupon.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/coupons/:id/issues', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await CouponIssue.findAndCountAll({
      where: { coupon_template_id: req.params.id },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const shopId = req.shopId;

    const couponCount = await CouponTemplate.count({ where: { shop_id: shopId } });
    const activeCouponCount = await CouponTemplate.count({
      where: { shop_id: shopId, status: 'active' }
    });

    res.json({
      code: 0,
      data: { couponCount, activeCouponCount }
    });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
