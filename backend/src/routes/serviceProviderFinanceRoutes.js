const express = require('express');
const router = express.Router();
const auth = require('../middlewares/serviceProviderPortalAuthMiddleware');
const { ServiceOrder, ServiceProviderProfile, sequelize } = require('../models');
const { Op } = require('sequelize');

router.use(auth);

router.get('/income/summary', async (req, res) => {
  try {
    const spId = req.user.id;
    const { start_date, end_date } = req.query;
    const where = { service_provider_id: spId, status: 'completed' };

    if (start_date && end_date) {
      where.completed_at = { [Op.between]: [start_date, end_date + ' 23:59:59'] };
    }

    const totalIncome = await ServiceOrder.sum('total_amount', { where }) || 0;
    const orderCount = await ServiceOrder.count({ where });

    const todayStart = new Date().toISOString().split('T')[0];
    const todayIncome = await ServiceOrder.sum('total_amount', {
      where: { ...where, completed_at: { [Op.gte]: todayStart } }
    }) || 0;

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthIncome = await ServiceOrder.sum('total_amount', {
      where: { ...where, completed_at: { [Op.gte]: monthStart } }
    }) || 0;

    res.json({
      code: 0,
      data: { totalIncome, orderCount, todayIncome, monthIncome }
    });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/income/list', async (req, res) => {
  try {
    const spId = req.user.id;
    const { page = 1, limit = 20, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    const where = { service_provider_id: spId, status: 'completed' };

    if (start_date && end_date) {
      where.completed_at = { [Op.between]: [start_date, end_date + ' 23:59:59'] };
    }

    const { count, rows } = await ServiceOrder.findAndCountAll({
      where,
      attributes: ['id', 'order_no', 'total_amount', 'completed_at', 'service_name'],
      limit: parseInt(limit),
      offset,
      order: [['completed_at', 'DESC']]
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/income/daily', async (req, res) => {
  try {
    const spId = req.user.id;
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const results = await sequelize.query(`
      SELECT DATE(completed_at) as date, 
             COUNT(*) as order_count, 
             SUM(total_amount) as total_amount
      FROM service_orders
      WHERE service_provider_id = ? 
        AND status = 'completed'
        AND DATE(completed_at) BETWEEN ? AND ?
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `, {
      replacements: [spId, startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ code: 0, data: results });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const spId = req.user.id;
    const profile = await ServiceProviderProfile.findOne({
      where: { user_id: spId },
      attributes: ['balance', 'frozen_balance']
    });
    if (!profile) return res.status(404).json({ code: -1, message: '服务商不存在' });
    res.json({ code: 0, data: profile });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
