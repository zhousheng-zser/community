const express = require('express');
const router = express.Router();
const auth = require('../middlewares/serviceProviderPortalAuthMiddleware');
const { WorkerProfile, User, ServiceOrder, sequelize } = require('../models');
const { Op } = require('sequelize');

router.use(auth);

router.get('/list', async (req, res) => {
  try {
    const spId = req.user.id;
    const { page = 1, limit = 20, keyword, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { service_provider_id: spId };

    if (keyword) {
      where[Op.or] = [
        { '$User.nickname$': { [Op.like]: `%${keyword}%` } },
        { '$User.phone$': { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) where.status = status;

    const { count, rows } = await WorkerProfile.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'phone', 'avatar_url'] }],
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
    const spId = req.user.id;
    const worker = await WorkerProfile.findOne({
      where: { id: req.params.id, service_provider_id: spId },
      include: [{ model: User, as: 'user' }]
    });
    if (!worker) return res.status(404).json({ code: -1, message: '技工不存在' });
    res.json({ code: 0, data: worker });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const spId = req.user.id;
    const { status } = req.body;
    const worker = await WorkerProfile.findOne({
      where: { id: req.params.id, service_provider_id: spId }
    });
    if (!worker) return res.status(404).json({ code: -1, message: '技工不存在' });
    await worker.update({ status });
    res.json({ code: 0, message: '状态更新成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const spId = req.user.id;
    const workerId = req.params.id;
    
    const totalOrders = await ServiceOrder.count({
      where: { worker_id: workerId, service_provider_id: spId }
    });
    const completedOrders = await ServiceOrder.count({
      where: { worker_id: workerId, service_provider_id: spId, status: 'completed' }
    });
    const totalIncome = await ServiceOrder.sum('total_amount', {
      where: { worker_id: workerId, service_provider_id: spId, status: 'completed' }
    }) || 0;

    res.json({
      code: 0,
      data: { totalOrders, completedOrders, totalIncome }
    });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
