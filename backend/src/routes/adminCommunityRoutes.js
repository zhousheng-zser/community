const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');
const { Community, User, WorkerProfile, ServiceProvider } = require('../models');
const { Op } = require('sequelize');

router.use(adminAuthMiddleware);

router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) where.status = status;

    const { count, rows } = await Community.findAndCountAll({
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

router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id);
    if (!community) return res.status(404).json({ code: -1, message: '社区不存在' });
    res.json({ code: 0, data: community });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, contact_phone, longitude, latitude, service_radius, status } = req.body;
    const community = await Community.create({
      name, address, contact_phone, longitude, latitude, service_radius, status: status || 'active'
    });
    res.json({ code: 0, data: community, message: '创建成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id);
    if (!community) return res.status(404).json({ code: -1, message: '社区不存在' });
    await community.update(req.body);
    res.json({ code: 0, data: community, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const community = await Community.findByPk(req.params.id);
    if (!community) return res.status(404).json({ code: -1, message: '社区不存在' });
    await community.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const communityId = req.params.id;
    const userCount = await User.count({ where: { community_id: communityId } });
    const workerCount = await WorkerProfile.count({ where: { community_id: communityId } });
    const providerCount = await ServiceProvider.count({ where: { community_id: communityId } });
    res.json({ code: 0, data: { userCount, workerCount, providerCount } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
