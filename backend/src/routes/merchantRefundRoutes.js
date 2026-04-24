const express = require('express');
const router = express.Router();
const merchantPortalAuth = require('../middlewares/merchantPortalAuthMiddleware');
const { Refund, MarketOrder, sequelize } = require('../models');
const { Op } = require('sequelize');

router.use(merchantPortalAuth);

router.get('/list', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { shop_id: shopId };

    if (status) where.status = status;

    const { count, rows } = await Refund.findAndCountAll({
      where,
      include: [{
        model: MarketOrder,
        as: 'order',
        attributes: ['order_no', 'total_amount', 'created_at']
      }],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shopId = req.shopId;
    const refund = await Refund.findOne({
      where: { id: req.params.id, shop_id: shopId },
      include: [{ model: MarketOrder, as: 'order' }]
    });
    if (!refund) return res.status(404).json({ code: -1, message: '退款记录不存在' });
    res.json({ code: 0, data: refund });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { remark } = req.body;
    const refund = await Refund.findOne({
      where: { id: req.params.id, shop_id: shopId }
    });
    if (!refund) return res.status(404).json({ code: -1, message: '退款记录不存在' });
    if (refund.status !== 'pending') {
      return res.status(400).json({ code: -1, message: '当前状态不允许此操作' });
    }
    await refund.update({ status: 'approved', merchant_remark: remark, approved_at: new Date() });
    res.json({ code: 0, message: '已同意退款' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ code: -1, message: '请填写拒绝原因' });

    const refund = await Refund.findOne({
      where: { id: req.params.id, shop_id: shopId }
    });
    if (!refund) return res.status(404).json({ code: -1, message: '退款记录不存在' });
    if (refund.status !== 'pending') {
      return res.status(400).json({ code: -1, message: '当前状态不允许此操作' });
    }
    await refund.update({ status: 'rejected', merchant_remark: reason, rejected_at: new Date() });
    res.json({ code: 0, message: '已拒绝退款' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const shopId = req.shopId;

    const pendingCount = await Refund.count({
      where: { shop_id: shopId, status: 'pending' }
    });
    const approvedCount = await Refund.count({
      where: { shop_id: shopId, status: 'approved' }
    });
    const rejectedCount = await Refund.count({
      where: { shop_id: shopId, status: 'rejected' }
    });
    const totalAmount = await Refund.sum('refund_amount', {
      where: { shop_id: shopId, status: 'approved' }
    }) || 0;

    res.json({
      code: 0,
      data: { pendingCount, approvedCount, rejectedCount, totalAmount }
    });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
