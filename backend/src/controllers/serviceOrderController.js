const { ServiceOrder, Service, User, UserAddress } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      service_id,
      community_id,
      address_id,
      address_snapshot,
      appointment_time,
      remark,
      group_key
    } = req.body;
    if (!service_id) return fail(res, 400, '缺少 service_id');
    const service = await Service.findByPk(service_id);
    if (!service) return fail(res, 404, '服务不存在');
    const sj = service.toJSON();
    const pub = sj.is_published;
    if (pub === 0 || pub === false) return fail(res, 400, '服务未上架');

    let snap = address_snapshot || null;
    if (!snap && address_id) {
      const addr = await UserAddress.findOne({ where: { id: address_id, user_id: userId } });
      if (addr) snap = addr.toJSON();
    }

    let commId = community_id != null ? parseInt(community_id, 10) : null;
    if (!commId) {
      const u = await User.findByPk(userId, { attributes: ['community_id'] });
      commId = u && u.community_id != null ? Number(u.community_id) : null;
    }

    const row = await ServiceOrder.create({
      user_id: userId,
      community_id: commId,
      service_id: Number(service_id),
      group_key: group_key || null,
      amount: service.price,
      address_id: address_id ? parseInt(address_id, 10) : null,
      address_snapshot: snap,
      appointment_time: appointment_time || null,
      remark: remark || null,
      status: 'pending_pay',
      pay_status: 'unpaid'
    });
    return ok(res, { id: row.id, order_id: row.id, status: row.status, pay_status: row.pay_status });
  } catch (e) {
    console.error('serviceOrder create', e);
    return fail(res, 500, '创建失败');
  }
};

exports.myList = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const { rows, count } = await ServiceOrder.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [{ model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] }]
    });
    return ok(res, { list: rows, total: count, page, limit });
  } catch (e) {
    console.error('serviceOrder myList', e);
    return fail(res, 500, '查询失败');
  }
};

exports.mockPay = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await ServiceOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在');
    if (order.pay_status === 'paid') return fail(res, 400, '已支付');
    order.pay_status = 'paid';
    order.status = 'paid_pending_dispatch';
    await order.save();
    try {
      await Service.increment('sales_count', { by: 1, where: { id: order.service_id } });
      await Service.increment('order_count', { by: 1, where: { id: order.service_id } });
    } catch (err) { /* ignore */ }
    await order.reload({ include: [{ model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] }] });
    return ok(res, order.get({ plain: true }));
  } catch (e) {
    console.error('serviceOrder mockPay', e);
    return fail(res, 500, '支付失败');
  }
};
