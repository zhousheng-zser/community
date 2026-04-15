const { NeighborAssistOrder, User } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

const ASSIST_TYPES = new Set(['take', 'child', 'escort', 'trash', 'pet']);

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      assist_type,
      origin_address_snapshot,
      destination_address_snapshot,
      community_id,
      appointment_time,
      remark,
      amount
    } = req.body;
    if (!assist_type || !ASSIST_TYPES.has(String(assist_type))) {
      return fail(res, 400, '无效 assist_type');
    }
    if (!origin_address_snapshot || typeof origin_address_snapshot !== 'object') {
      return fail(res, 400, '缺少 origin_address_snapshot');
    }
    if (!destination_address_snapshot || typeof destination_address_snapshot !== 'object') {
      return fail(res, 400, '缺少 destination_address_snapshot');
    }
    let commId = community_id != null ? parseInt(community_id, 10) : null;
    if (!commId) {
      const u = await User.findByPk(userId, { attributes: ['community_id'] });
      commId = u && u.community_id != null ? Number(u.community_id) : null;
    }
    const row = await NeighborAssistOrder.create({
      assist_type: String(assist_type),
      user_id: userId,
      community_id: commId,
      origin_address_snapshot,
      destination_address_snapshot,
      amount: amount != null ? amount : null,
      appointment_time: appointment_time || null,
      remark: remark || null,
      status: 'pending_pay',
      pay_status: 'unpaid'
    });
    return ok(res, { id: row.id, order_id: row.id, status: row.status });
  } catch (e) {
    console.error('neighborAssist create', e);
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
    const { rows, count } = await NeighborAssistOrder.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return ok(res, { list: rows, total: count, page, limit });
  } catch (e) {
    console.error('neighborAssist myList', e);
    return fail(res, 500, '查询失败');
  }
};

exports.mockPay = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在');
    if (order.pay_status === 'paid') return fail(res, 400, '已支付');
    order.pay_status = 'paid';
    order.status = 'paid_pending_dispatch';
    await order.save();
    return ok(res, order.get({ plain: true }));
  } catch (e) {
    console.error('neighborAssist mockPay', e);
    return fail(res, 500, '支付失败');
  }
};
