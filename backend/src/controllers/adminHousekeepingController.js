const { Op } = require('sequelize');
const { Order, Service, Category, User, WorkerProfile, HousekeepingDispatch } = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

function pickLatestDispatch(rows) {
  const map = {};
  rows.forEach((row) => {
    if (!map[row.order_id]) map[row.order_id] = row;
  });
  return map;
}

exports.listOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const where = { service_id: { [Op.ne]: null } };
    if (req.query.status) where.status = req.query.status;

    const { rows, count } = await Order.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'price', 'cover_image'],
          include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
        },
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone', 'avatar_url'], required: false }
      ]
    });

    const orderIds = rows.map((row) => row.id);
    let latestMap = {};
    let profileMap = {};
    let userMap = {};
    if (orderIds.length > 0) {
      const dispatches = await HousekeepingDispatch.findAll({
        where: { order_id: { [Op.in]: orderIds } },
        order: [['created_at', 'DESC'], ['id', 'DESC']]
      });
      latestMap = pickLatestDispatch(dispatches.map((d) => d.get({ plain: true })));
      const workerIds = [...new Set(dispatches.map((d) => d.worker_id).filter(Boolean))];
      if (workerIds.length > 0) {
        const profiles = await WorkerProfile.findAll({ where: { user_id: { [Op.in]: workerIds }, status: 'active' } });
        profiles.forEach((p) => { profileMap[p.user_id] = p.get({ plain: true }); });
        const users = await User.findAll({ where: { id: { [Op.in]: workerIds } }, attributes: ['id', 'nickname', 'avatar_url', 'phone'] });
        users.forEach((u) => { userMap[u.id] = u.get({ plain: true }); });
      }
    }

    const data = rows.map((row) => {
      const plain = row.get({ plain: true });
      const latest = latestMap[row.id] || null;
      const workerProfile = latest ? profileMap[latest.worker_id] : null;
      const workerUser = latest ? userMap[latest.worker_id] : null;
      return {
        ...plain,
        order_no_display: plain.order_no || `SERV-${plain.id}`,
        latest_dispatch: latest
          ? {
              id: latest.id,
              worker_id: latest.worker_id,
              worker_name: (workerProfile && workerProfile.real_name) || (workerUser && workerUser.nickname) || `技工#${latest.worker_id}`,
              worker_avatar: (workerUser && workerUser.avatar_url) || '',
              worker_industry: (workerProfile && workerProfile.industry) || '',
              status: latest.status,
              note: latest.note,
              created_at: latest.created_at,
              updated_at: latest.updated_at
            }
          : null
      };
    });

    res.json({ message: 'ok', total: count, page, limit, data });
  } catch (e) {
    console.error('admin list housekeeping orders:', e);
    res.status(500).json({ error: '加载家政订单失败' });
  }
};

exports.listWorkers = async (_req, res) => {
  try {
    const profiles = await WorkerProfile.findAll({ where: { status: 'active' }, order: [['updated_at', 'DESC']] });
    const userIds = [...new Set(profiles.map((row) => row.user_id).filter(Boolean))];
    const users = userIds.length
      ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'nickname', 'avatar_url', 'phone'] })
      : [];
    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.get({ plain: true }); });
    const data = profiles.map((row) => {
      const user = userMap[row.user_id] || {};
      return {
        id: row.user_id,
        profile_id: row.id,
        name: row.real_name || user.nickname || `技工#${row.user_id}`,
        nickname: user.nickname || '',
        avatar_url: user.avatar_url || '',
        phone: row.phone || user.phone || '',
        industry: row.industry,
        city: row.city || '',
        resume: row.resume || ''
      };
    });
    res.json({ message: 'ok', data });
  } catch (e) {
    console.error('admin list housekeeping workers:', e);
    res.status(500).json({ error: '加载家政技工列表失败' });
  }
};

exports.dispatchOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const workerId = parseInt(req.body.worker_id, 10);
    const note = req.body.note ? String(req.body.note).trim() : '';
    if (!orderId || !workerId) return res.status(400).json({ error: 'order_id 与 worker_id 必填' });
    const order = await Order.findByPk(orderId);
    if (!order || !order.service_id) return res.status(404).json({ error: '订单不存在或非家政单' });
    const workerProfile = await WorkerProfile.findOne({ where: { user_id: workerId, status: 'active' } });
    if (!workerProfile) return res.status(400).json({ error: '所选用户不是在职技工' });
    const row = await HousekeepingDispatch.create({
      order_id: orderId,
      worker_id: workerId,
      status: 'assigned',
      note: note || null,
      dispatcher: (req.admin && req.admin.sub) || 'admin'
    });
    await logAdminAction(req, 'dispatch_housekeeping_order', 'order', orderId, { worker_id: workerId, note });
    res.json({ message: 'ok', data: row });
  } catch (e) {
    console.error('admin dispatch housekeeping order:', e);
    res.status(500).json({ error: '派单失败，请稍后重试' });
  }
};
