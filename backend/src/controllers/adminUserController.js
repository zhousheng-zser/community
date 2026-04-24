const { Op } = require('sequelize');
const { User } = require('../models');

/**
 * GET /api/v1/admin/users?page=&limit=&keyword=
 * 小程序用户列表（检索昵称、手机、用户ID）
 */
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const kw = req.query.keyword != null ? String(req.query.keyword).trim() : '';

    const where = {};
    if (kw) {
      const or = [
        { nickname: { [Op.like]: `%${kw}%` } },
        { phone: { [Op.like]: `%${kw}%` } },
        { openid: { [Op.like]: `%${kw}%` } }
      ];
      if (/^\d+$/.test(kw)) {
        const idNum = parseInt(kw, 10);
        if (idNum > 0) or.push({ id: idNum });
      }
      where[Op.or] = or;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      attributes: ['id', 'openid', 'nickname', 'phone', 'avatar_url', 'role', 'community_id', 'balance', 'createdAt', 'updatedAt']
    });

    res.json({
      message: 'ok',
      total: count,
      page,
      limit,
      data: rows.map((r) => r.get({ plain: true }))
    });
  } catch (e) {
    console.error('admin listUsers:', e);
    res.status(500).json({ error: '查询失败' });
  }
};

/**
 * GET /api/v1/admin/users/:id
 */
exports.getUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: '无效用户ID' });
    const u = await User.findByPk(id);
    if (!u) return res.status(404).json({ error: '用户不存在' });
    res.json({ message: 'ok', data: u.get({ plain: true }) });
  } catch (e) {
    console.error('admin getUser:', e);
    res.status(500).json({ error: '查询失败' });
  }
};
