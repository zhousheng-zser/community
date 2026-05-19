const { Op } = require('sequelize');
const { NeighborAssistOrder, User, WorkerApplication, WorkerProfile } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

const ASSIST_TYPES = new Set(['take', 'child', 'escort', 'trash', 'pet', 'read', 'errand', 'other', '代取', '接送小孩', '陪诊', '陪读', '代扔垃圾', '宠物喂养', '跑腿', '其他']);

const ASSIST_TYPE_LABELS = {
  take: '代取快递',
  child: '接送小孩',
  escort: '陪诊陪护',
  trash: '代扔垃圾',
  pet: '宠物喂养',
  read: '陪读',
  errand: '跑腿',
  other: '其他',
  '代取': '代取快递',
  '接送小孩': '接送小孩',
  '陪诊': '陪诊陪护',
  '陪读': '陪读',
  '代扔垃圾': '代扔垃圾',
  '宠物喂养': '宠物喂养',
  '跑腿': '跑腿',
  '其他': '其他'
};

const NEIGHBOR_ORDER_STATUS_TEXT = {
  pending_pay: '待支付',
  paid_pending_dispatch: '待接单',
  dispatched: '已接单',
  in_service: '服务中',
  pending_confirm: '待确认',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

async function assertWorker(userId) {
  const app = await WorkerApplication.findOne({ where: { user_id: userId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: userId, status: 'active' } });
  return !!(app && prof);
}

async function assertWorkerCanTakeOrder(workerUserId, order) {
  if (!(await assertWorker(workerUserId))) return { ok: false, reason: '非已入驻技工' };
  if (order.user_id === workerUserId) return { ok: false, reason: '不能接自己发布的订单' };
  const prof = await WorkerProfile.findOne({ where: { user_id: workerUserId, status: 'active' } });
  const oc = order.community_id != null ? Number(order.community_id) : null;
  const wc = prof && prof.community_id != null ? Number(prof.community_id) : null;
  if (oc != null && wc != null && oc !== wc) return { ok: false, reason: '非本小区订单' };
  return { ok: true };
}

// Create order with amount
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
      amount,
      reward_amount
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
    // 支持前端传 reward_amount 或 amount
    const orderAmount = (reward_amount != null ? reward_amount : amount) != null
      ? String(reward_amount != null ? reward_amount : amount) : null;
    const row = await NeighborAssistOrder.create({
      assist_type: String(assist_type),
      user_id: userId,
      community_id: commId,
      origin_address_snapshot,
      destination_address_snapshot,
      amount: orderAmount,
      appointment_time: appointment_time || null,
      content: req.body.content || remark || null,
      remark: remark || null,
      status: 'pending_pay',
      pay_status: 'unpaid'
    });
    return ok(res, { id: row.id, order_id: row.id, status: row.status, assist_type: row.assist_type, assist_type_label: ASSIST_TYPE_LABELS[row.assist_type] || row.assist_type, amount: orderAmount });
  } catch (e) {
    console.error('neighborAssist create', e);
    return fail(res, 500, '创建失败');
  }
};

// My orders (publisher or helper role)
exports.myList = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.query.role || 'publisher';
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit != null && req.query.limit !== '' ? req.query.limit : req.query.page_size || '10', 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;

    const where = {};
    if (role === 'publisher') {
      where.user_id = userId;
    } else if (role === 'helper') {
      where.assigned_worker_id = userId;
    } else {
      where[Op.or] = [{ user_id: userId }, { assigned_worker_id: userId }];
    }

    const { rows, count } = await NeighborAssistOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone', 'avatar_url'], required: false },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'phone', 'avatar_url'], required: false }
      ]
    });
    const list = rows.map((row) => {
      const plain = row.get({ plain: true });
      const pub = plain.buyer;
      const worker = plain.assignedWorker;
      const amt = plain.amount != null ? String(plain.amount) : '';
      return {
        id: plain.id,
        assist_type: plain.assist_type,
        assist_type_label: ASSIST_TYPE_LABELS[plain.assist_type] || plain.assist_type,
        status: plain.status,
        status_text: NEIGHBOR_ORDER_STATUS_TEXT[plain.status] || plain.status,
        pay_status: plain.pay_status,
        amount: amt,
        reward_amount: amt,
        created_at: plain.created_at,
        appointment_time: plain.appointment_time,
        community_id: plain.community_id,
        origin_address_snapshot: plain.origin_address_snapshot,
        destination_address_snapshot: plain.destination_address_snapshot,
        content: plain.content || plain.remark,
        remark: plain.remark,
        publisher: pub ? { id: pub.id, nickname: pub.nickname, phone: pub.phone, avatar_url: pub.avatar_url } : null,
        helper: worker ? { id: worker.id, nickname: worker.nickname, phone: worker.phone, avatar_url: worker.avatar_url } : null,
        assigned_worker: worker
          ? { id: worker.id, nickname: worker.nickname, name: worker.nickname || '', avatar_url: worker.avatar_url || '' }
          : null,
        my_role: role
      };
    });
    return ok(res, { list, total: count, page, limit });
  } catch (e) {
    console.error('neighborAssist myList', e);
    return fail(res, 500, '查询失败');
  }
};

// Mock pay (publisher pays for their order)
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

// Worker pool (技工抢单大厅 - existing, requires worker)
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
        content: plain.content || plain.remark,
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

// Community pool - 同社区未接单的待支付订单（面向社区普通成员，非技工）
exports.communityPool = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, { attributes: ['id', 'nickname', 'avatar_url', 'phone', 'community_id'] });
    if (!user) return fail(res, 404, '用户不存在');

    const myComm = user.community_id != null ? Number(user.community_id) : null;
    const where = {
      status: 'paid_pending_dispatch',
      pay_status: 'paid',
      user_id: { [Op.ne]: userId },
      assigned_worker_id: null
    };
    if (myComm != null) where.community_id = myComm;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;

    const { rows, count } = await NeighborAssistOrder.findAndCountAll({
      where,
      order: [['created_at', 'ASC']],
      limit,
      offset,
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'avatar_url'] }]
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
        reward_amount: plain.amount != null ? String(plain.amount) : '',
        community_id: plain.community_id,
        created_at: plain.created_at,
        appointment_time: plain.appointment_time,
        origin_address_snapshot: plain.origin_address_snapshot,
        destination_address_snapshot: plain.destination_address_snapshot,
        content: plain.content || plain.remark,
        remark: plain.remark,
        publisher: b ? { id: b.id, nickname: b.nickname || '', avatar_url: b.avatar_url || '' } : null
      };
    });
    return ok(res, { list, total: count, page, limit });
  } catch (e) {
    console.error('neighborAssist communityPool', e);
    return fail(res, 500, '查询失败');
  }
};

// Worker grab (技工抢单 - existing, requires worker)
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
      { assigned_worker_id: workerId, dispatch_at: new Date(), dispatch_by: null, status: 'dispatched' },
      { where: { id, status: 'paid_pending_dispatch', assigned_worker_id: null, pay_status: 'paid' } }
    );
    if (!n) return fail(res, 400, '抢单失败：订单已被其他人抢走');

    const fresh = await NeighborAssistOrder.findByPk(id, {
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] }]
    });
    return ok(res, { id: fresh.id, status: fresh.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[fresh.status] || fresh.status, assigned_worker_id: fresh.assigned_worker_id, grab: true });
  } catch (e) {
    console.error('neighborAssist grab', e);
    return fail(res, 500, '操作失败', 500);
  }
};

// Community grab - 社区普通成员接单（非技工，面向邻里互助）
exports.communityGrab = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');

    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.user_id === userId) return fail(res, 400, '不能接自己发布的订单');

    // 同社区检查
    const user = await User.findByPk(userId, { attributes: ['community_id'] });
    const oc = order.community_id != null ? Number(order.community_id) : null;
    const uc = user && user.community_id != null ? Number(user.community_id) : null;
    if (oc != null && uc != null && oc !== uc) return fail(res, 400, '非本小区订单');

    const [n] = await NeighborAssistOrder.update(
      { assigned_worker_id: userId, dispatch_at: new Date(), dispatch_by: null, status: 'dispatched' },
      { where: { id, status: 'paid_pending_dispatch', assigned_worker_id: null, pay_status: 'paid' } }
    );
    if (!n) return fail(res, 400, '接单失败：订单已被其他人接走');

    const fresh = await NeighborAssistOrder.findByPk(id, {
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] }]
    });
    return ok(res, { id: fresh.id, status: fresh.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[fresh.status] || fresh.status, assigned_worker_id: fresh.assigned_worker_id, grab: true });
  } catch (e) {
    console.error('neighborAssist communityGrab', e);
    return fail(res, 500, '操作失败', 500);
  }
};

// Accept (接单方确认开始服务)
exports.accept = async (req, res) => {
  try {
    const workerId = req.user.id;
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

// Complete - 接单方完成服务，资金到账（escrow release）
exports.complete = async (req, res) => {
  try {
    const workerId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.assigned_worker_id !== workerId) return fail(res, 403, '无权限操作该订单', 403);
    if (order.status !== 'in_service' && order.status !== 'dispatched') return fail(res, 400, '当前状态不可完成');

    const t = await NeighborAssistOrder.sequelize.transaction();
    try {
      // 资金划转：发布人扣减 balance，接单人获得 balance
      const amountNum = Number(order.amount || 0);
      if (amountNum > 0) {
        const publisher = await User.findByPk(order.user_id, { transaction: t });
        if (publisher && publisher.balance != null) {
          await publisher.decrement('balance', { by: amountNum, transaction: t });
        }
        const helper = await User.findByPk(order.assigned_worker_id, { transaction: t });
        if (helper && helper.balance != null) {
          await helper.increment('balance', { by: amountNum, transaction: t });
        }
      }

      order.status = 'completed';
      order.completed_at = new Date();
      await order.save({ transaction: t });
      await t.commit();

      return ok(res, {
        id: order.id, status: order.status,
        status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status,
        amount_transferred: amountNum,
        completed_at: order.completed_at
      });
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (e) {
    console.error('neighborAssist complete', e);
    return fail(res, 500, '操作失败');
  }
};

// Publisher cancel (unpaid orders)
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
    return fail(res, 500, '操作失败');
  }
};

// Reject (接单方拒单，订单回到待接单池)
exports.reject = async (req, res) => {
  try {
    const workerId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在', 404);
    if (order.assigned_worker_id !== workerId) return fail(res, 403, '无权限操作该订单', 403);
    if (order.status !== 'dispatched' && order.status !== 'in_service') return fail(res, 400, '当前状态不可拒单');
    order.status = 'paid_pending_dispatch';
    order.assigned_worker_id = null;
    order.dispatch_at = null;
    order.dispatch_by = null;
    await order.save();
    return ok(res, { id: order.id, status: order.status, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist reject', e);
    return fail(res, 500, '操作失败');
  }
};

// Detail
exports.detail = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    if (!Number.isFinite(orderId)) return fail(res, 400, '无效订单ID');

    const order = await NeighborAssistOrder.findOne({
      where: { id: orderId },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone', 'avatar_url'], required: false },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'phone', 'avatar_url'], required: false }
      ]
    });
    if (!order) return fail(res, 404, '订单不存在');

    // 权限：发布人、接单人可看完整详情；其他人仅在池子中有查看摘要的权限
    const plain = order.get({ plain: true });
    const pub = plain.buyer;
    const worker = plain.assignedWorker;
    const isPublisher = order.user_id === userId;
    const isHelper = order.assigned_worker_id === userId;

    const myRole = isPublisher ? 'publisher' : isHelper ? 'helper' : '';

    const resp = {
      ...plain,
      assist_type_label: ASSIST_TYPE_LABELS[plain.assist_type] || plain.assist_type,
      status_text: NEIGHBOR_ORDER_STATUS_TEXT[plain.status] || plain.status,
      amount: plain.amount != null ? String(plain.amount) : '',
      reward_amount: plain.amount != null ? String(plain.amount) : '',
      publisher: pub ? { id: pub.id, nickname: pub.nickname, phone: pub.phone, avatar_url: pub.avatar_url } : null,
      helper: worker ? { id: worker.id, nickname: worker.nickname, phone: worker.phone, avatar_url: worker.avatar_url } : null,
      my_role: myRole
    };

    // 手机脱敏
    if (myRole === 'publisher' && worker) {
      const isAccepted = ['dispatched', 'in_service', 'pending_confirm', 'completed'].includes(order.status);
      resp.helper = { ...resp.helper, phone: isAccepted ? worker.phone : (worker.phone ? worker.phone.substring(0, 3) + '****' + worker.phone.substring(7) : '') };
    }

    return ok(res, { order: resp });
  } catch (e) {
    console.error('neighborAssist detail', e);
    return fail(res, 500, '查询失败');
  }
};

// Confirm (发布人确认订单完成)
exports.confirm = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效订单 id');
    const order = await NeighborAssistOrder.findOne({ where: { id, user_id: userId } });
    if (!order) return fail(res, 404, '订单不存在');
    if (order.status !== 'completed') return fail(res, 400, '订单未完成，无法确认');
    return ok(res, { id: order.id, status: order.status, confirmed: true, status_text: NEIGHBOR_ORDER_STATUS_TEXT[order.status] || order.status });
  } catch (e) {
    console.error('neighborAssist confirm', e);
    return fail(res, 500, '操作失败');
  }
};
