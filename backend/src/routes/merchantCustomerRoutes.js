const express = require('express');
const router = express.Router();
const merchantPortalAuth = require('../middlewares/merchantPortalAuthMiddleware');
const { MarketOrder, User, sequelize } = require('../models');
const { Op } = require('sequelize');

router.use(merchantPortalAuth);

router.get('/list', async (req, res) => {
  try {
    const shopId = req.shopId;
    const { page = 1, limit = 20, keyword } = req.query;
    const offset = (page - 1) * limit;

    const orderUsers = await sequelize.query(`
      SELECT DISTINCT u.id, u.nickname, u.phone, u.avatar_url,
             COUNT(o.id) as order_count,
             SUM(o.total_amount) as total_spent,
             MAX(o.created_at) as last_order_time
      FROM users u
      INNER JOIN market_orders o ON u.id = o.user_id
      WHERE o.shop_id = ?
      GROUP BY u.id
      ORDER BY last_order_time DESC
      LIMIT ? OFFSET ?
    `, {
      replacements: [shopId, parseInt(limit), offset],
      type: sequelize.QueryTypes.SELECT
    });

    const countResult = await sequelize.query(`
      SELECT COUNT(DISTINCT user_id) as total
      FROM market_orders
      WHERE shop_id = ?
    `, {
      replacements: [shopId],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      code: 0,
      data: { list: orderUsers, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/:id/orders', async (req, res) => {
  try {
    const shopId = req.shopId;
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await MarketOrder.findAndCountAll({
      where: { shop_id: shopId, user_id: userId },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const shopId = req.shopId;
    const userId = req.params.id;

    const stats = await sequelize.query(`
      SELECT 
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_amount,
        MIN(created_at) as first_order_time,
        MAX(created_at) as last_order_time
      FROM market_orders
      WHERE shop_id = ? AND user_id = ?
    `, {
      replacements: [shopId, userId],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ code: 0, data: stats[0] });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
