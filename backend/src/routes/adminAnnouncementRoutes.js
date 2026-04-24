const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');
const { Announcement, Community } = require('../models');
const { Op } = require('sequelize');

router.use(adminAuthMiddleware);

router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, type, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      include: [{ model: Community, as: 'community', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset,
      order: [['priority', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, {
      include: [{ model: Community, as: 'community', attributes: ['id', 'name'] }]
    });
    if (!announcement) return res.status(404).json({ code: -1, message: '公告不存在' });
    res.json({ code: 0, data: announcement });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, type, community_id, priority, status, publish_time, expire_time, created_by } = req.body;
    const announcement = await Announcement.create({
      title, content, type, community_id, priority, status: status || 'draft',
      publish_time, expire_time, created_by
    });
    res.json({ code: 0, data: announcement, message: '创建成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ code: -1, message: '公告不存在' });
    await announcement.update(req.body);
    res.json({ code: 0, data: announcement, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ code: -1, message: '公告不存在' });
    await announcement.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ code: -1, message: '公告不存在' });
    await announcement.update({ status: 'published', publish_time: new Date() });
    res.json({ code: 0, message: '发布成功' });
  } catch (e) {
    res.status(500).json({ code: -1, message: e.message });
  }
});

module.exports = router;
