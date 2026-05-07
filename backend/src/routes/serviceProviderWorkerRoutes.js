const express = require('express');
const router = express.Router();
const auth = require('../middlewares/serviceProviderPortalAuthMiddleware');
const { WorkerProfile, User, ServiceOrder, ServiceProviderProfile } = require('../models');
const { Op } = require('sequelize');

router.use(auth);

// 获取当前服务商的技工列表
// 注：当前 WorkerProfile 无 service_provider_id 字段，
// 通过社区匹配来查找
router.get('/list', async (req, res) => {
  try {
    const spId = req.spPortal.provider_user_id;
    const { page = 1, limit = 20, keyword, status } = req.query;
    const offset = (page - 1) * limit;

    // 获取服务商档案以确定社区
    const spProf = await ServiceProviderProfile.findOne({
      where: { user_id: spId, status: 'active' }
    });

    const where = {};
    if (spProf && spProf.community_id) {
      where.community_id = spProf.community_id;
    }
    if (status) where.status = status;

    if (keyword) {
      where[Op.or] = [
        { real_name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

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
    const worker = await WorkerProfile.findOne({
      where: { id: req.params.id },
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
    const { status } = req.body;
    const worker = await WorkerProfile.findOne({
      where: { id: req.params.id }
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
    const workerId = req.params.id;
    const worker = await WorkerProfile.findByPk(workerId);
    if (!worker) return res.status(404).json({ code: -1, message: '技工不存在' });

    // ServiceOrder 使用 assigned_worker_id 关联技工
    const totalOrders = await ServiceOrder.count({
      where: { assigned_worker_id: worker.user_id }
    });
    const completedOrders = await ServiceOrder.count({
      where: { assigned_worker_id: worker.user_id, status: 'completed' }
    });
    const totalIncome = await ServiceOrder.sum('amount', {
      where: { assigned_worker_id: worker.user_id, status: 'completed' }
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
