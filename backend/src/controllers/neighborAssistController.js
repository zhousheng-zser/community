const { Op } = require('sequelize');
const { NeighborAssistOrder, User, WorkerApplication, WorkerProfile } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

const ASSIST_TYPES = new Set(['take', 'child', 'escort', 'trash', 'pet']);

const ASSIST_TYPE_LABELS = {
  take: '代取快递',
  child: '接送孩子',
  escort: '陪诊陪护',
  trash: '代扔垃圾',
  pet: '宠物代办'
};

const NEIGHBOR_ORDER_STATUS_TEXT = {
  pending_pay: '待支付',
  paid_pending_dispatch: '待派单',
  dispatched: '已派单',
  in_service: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

async function assertWorker(userId) {
  const app = await WorkerApplication.findOne({ where: { user_id: userId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: userId, status: 'active' } });
  return !!(app && prof);
}

/** 技工接邻里单：同小区（订单与档案均有 community_id 时须一致）；不可接自己发布的单 */
async function assertWorkerCanTakeOrder(workerUserId, order) {
  if (!(await assertWorker(workerUserId))) return { ok: false, reason: '非已入驻技工' };
  if (order.user_id === workerUserId) return { ok: false, reason: '不能接自己发布的订单' };
  const prof = await WorkerProfile.findOne({ where: { user_id: workerUserId, status: 'active' } });
  const oc = order.community_id != null ? Number(order.community_id) : null;
  const wc = prof && prof.community_id != null ? Number(prof.community_id) : null;
  if (oc != null && wc != null && oc !== wc) return { ok: false, reason: '非本小区订单' };
  return { ok: true };
}

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
    const limitRaw = req.query.limit != null && req.query.limit !== '' ? req.query.limit : req.query.page_size;
    let limit = parseInt(limitRaw, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const { rows, count } = await NeighborAssistOrder.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url'], required: false }
      ]
    });
    const list = rows.map((row) => {
      const plain = row.get({ plain: true });
      const w = plain.assignedWorker;
      const amt = plain.amount != null ? String(plain.amount) : '';
      return {
        id: plain.id,
        assist_type: plain.assist_type,
        assist_type_label: ASSIST_TYPE_LABELS[plain.assist_type] || plain.assist_type,
        status: plain.status,
        status_text: NEIGHBOR_ORDER_STATUS_TEXT[plain.status] || plain.status,
        pay_status: plain.pay_status,
        amount: amt,
        created_at: plain.created_at,
        appointment_time: plain.appointment_time,
        community_id: plain.community_id,
        origin_address_snapshot: plain.origin_address_snapshot,
        destination_address_snapshot: plain.destination_address_snapshot,
        remark: plain.remark,
        assigned_worker: w
          ? { id: w.id, nickname: w.nickname, name: w.nickname || '', avatar_url: w.avatar_url || '' }
          : null
      };
    });
    return ok(res, { list, total: count, page, limit });
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

/**
 * 待派单池：已支付、未指派技工的本小区订单（技工端抢单大厅）
 * query community_id 可覆盖（须与本人档案小区一致）
 */
exports.pool = async (req, res) => {
  try {
    const workerId = req.user.id;
    if (!(await assertWorker(workerId))) return fail(res, 403, '非已入驻技工', 403);
    const prof = await WorkerProfile.findOne({ where: { user_id: workerId, status: 'active' } });
    let filterComm = prof && prof.community_id != null ? Number(prof.community_id) : null;
    if (req.query.community_id != null && req.query.community_id !== '') {
      const q = parseInt(req.query.community_id, 10);
      if (Number.isFinite(q)) {
        if (filterComm != null && q !== filterComm) return fail(res, 400, 'community_id 与本人接单小区不一致');
        filterComm = q;
      }
    }
    const where = {
      status: 'paid_pending_dispatch',
      pay_status: 'paid',
      assigned_worker_id: null,
      user_id: { [Op.ne]: workerId }
    };
    if (filterComm != null) where.community_id = filterComm;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;

    const { rows, count } = await NeighborAssistOrder.findAndCountAll({
      where,
      order: [['created_at', 'ASC']],
      limit,
      offset,
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'avatar_url', 'phone'] }]
    });
    const list = rows.map((row) => {
      const plain = row.get({ plain: true });
      const b = plain.buyer;
      return {
        id: plain.id,
        assist_type: plain.assist_type,
        assist_type_label: ASSIST_TYPE_LABELS[plain.assist_type] || plain.assist_type,
        status: plain.status,
        amount: plain.amount != null ? String(plain.amount) : '',
        community_id: plain.community_id,
        created_at: plain.created_at,
        appointment_time: plain.appointment_time,
        origin_address_snapshot: plain.origin_address_snapshot,
        destination_address_snapshot: plain.destination_address_snapshot,
        remark: plain.remark,
        buyer: b ? { id: b.id, nickname: b.nickname || '', avatar_url: b.avatar_url || '' } : null
      };
    });
    return ok(res, { list, total: count, page, limit });
  } catch (e) {
    console.error('neighborAssist pool', e);
    return fail(res, 500, '查询失败');
  }
};

/** 技工抢单：待派单且未指派时，将订单指派给本人（等同运营派单，dispatch_by 为空表示自助抢单） */
exports.grab = async (req, res) => {
  try {
    const workerId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    const chk = await assertWorkerCanTakeOrder(workerId, order);
    if (!chk.ok) return fail(res, 400, chk.reason);
    if (order.status !== 'paid_pending_dispatch' || order.assigned_worker_id != null) {
      return fail(res, 400, '当前订单不可抢，可能已被指派或状态已变');
    }
    if (order.pay_status !== 'paid') return fail(res, 400, '订单未支付');

    const [n] = await NeighborAssistOrder.update(
      {
        assigned_worker_id: workerId,
        dispatch_at: new Date(),
        dispatch_by: null,
        status: 'dispatched'
      },
      {
        where: {
          id,
          status: 'paid_pending_dispatch',
          assigned_worker_id: null,
          pay_status: 'paid'
        }
      }
    );
    if (!n) return fail(res, 400, '抢单失败：订单已被其他技工抢走');

    const fresh = await NeighborAssistOrder.findByPk(id, {
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] }]
    });
    return ok(res, {
      id: fresh.id,
      status: fresh.status,
      status_text: NEIGHBOR_ORDER_STATUS_TEXT[fresh.status] || fresh.status,
      assigned_worker_id: fresh.assigned_worker_id,
      grab: true
    });
  } catch (e) {
    console.error('neighborAssist grab', e);
    return fail(res, 500, '操作失败', 500);
  }
};

exports.accept = async (req, res) => {
  try {
    const workerId = req.user.id;
    if (!(await assertWorker(workerId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.assigned_worker_id !== workerId) return fail(res, 403, '无权限操作该订单', 403);
    if (order.pay_status !== 'paid') return fail(res, 400, '订单未支付');
    if (order.status !== 'dispatched') return fail(res, 400, '当前状态不可接单');
    order.status = 'in_service';
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist accept', e);
    return fail(res, 500, '操作失败', 500);
  }
};

exports.complete = async (req, res) => {
  try {
    const workerId = req.user.id;
    if (!(await assertWorker(workerId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.assigned_worker_id !== workerId) return fail(res, 403, '无权限操作该订单', 403);
    if (order.status !== 'in_service') return fail(res, 400, '当前状态不可完成');
    order.status = 'completed';
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist complete', e);
    return fail(res, 500, '操作失败', 500);
  }
};

/** 发布方取消：仅未支付可取消 */
exports.cancel = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.pay_status !== 'unpaid' || order.status !== 'pending_pay') {
      return fail(res, 400, '当前状态不可取消');
    }
    order.status = 'cancelled';
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist cancel', e);
    return fail(res, 500, '操作失败', 500);
  }
};

/** 接单方拒单：已派单至本人且未开始服务 */
exports.reject = async (req, res) => {
  try {
    const workerId = req.user.id;
    if (!(await assertWorker(workerId))) return fail(res, 403, '非已入驻技工', 403);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.assigned_worker_id !== workerId) return fail(res, 403, '无权限操作该订单', 403);
    if (order.status !== 'dispatched') return fail(res, 400, '当前状态不可拒单');
    order.status = 'paid_pending_dispatch';
    order.assigned_worker_id = null;
    order.dispatch_at = null;
    order.dispatch_by = null;
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist reject', e);
    return fail(res, 500, '操作失败', 500);
  }
};
