const { ServiceOrder, NeighborAssistOrder, Service, User, WorkerApplication, WorkerProfile } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, http = 200) => res.status(http).json({ errno, errmsg });

function parseCommunityId(q) {
  if (q === undefined || q === null || q === '') return null;
  const c = parseInt(String(q), 10);
  return Number.isFinite(c) ? c : null;
}

async function workerAssignable(workerId) {
  const app = await WorkerApplication.findOne({ where: { user_id: workerId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: workerId, status: 'active' } });
  return !!(app && prof);
}

/** 到家派单：订单有小区时，技工须绑定且同属该小区 */
async function workerAssignableForServiceOrderWorker(workerId, orderCommunityId) {
  const app = await WorkerApplication.findOne({ where: { user_id: workerId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: workerId, status: 'active' } });
  if (!app || !prof) return { ok: false, reason: '技工不可派单' };
  if (orderCommunityId != null) {
    if (prof.community_id == null) {
      return { ok: false, reason: '技工未绑定服务小区' };
    }
    if (Number(prof.community_id) !== Number(orderCommunityId)) {
      return { ok: false, reason: '仅能派单给订单所在小区的技工' };
    }
  }
  return { ok: true };
}

function adminOperatorId(req) {
  const sub = req.admin && req.admin.sub;
  if (sub != null && String(sub).match(/^\d+$/)) return parseInt(sub, 10);
  return 0;
}

/** 中台派单台：扁平化订单行（含九宫格新建 group_key 的到家单） */
function serializeDispatchOrder(row) {
  const j = row.get ? row.get({ plain: true }) : row;
  const buyer = j.buyer || {};
  const svc = j.service || {};
  const snap =
    j.address_snapshot && typeof j.address_snapshot === 'object' ? j.address_snapshot : {};
  let groupKey = j.group_key ? String(j.group_key).trim() : '';
  if (!groupKey && j.remark) {
    const m = String(j.remark).match(/\[类目:([^\]]+)\]/);
    if (m) groupKey = m[1].trim();
  }
  const meta =
    j.fulfillment_meta && typeof j.fulfillment_meta === 'object' ? j.fulfillment_meta : {};
  return {
    id: j.id,
    order_no: j.order_no || null,
    user_id: j.user_id != null ? j.user_id : buyer.id,
    group_key: groupKey,
    service_title: (svc && svc.title) || j.goods_name || '',
    contact_name: j.contact_name || snap.contact_name || buyer.nickname || '',
    contact_phone: j.contact_phone || snap.contact_phone || buyer.phone || '',
    pay_amount: j.amount != null ? String(j.amount) : '',
    address: snap.detail || snap.address || '',
    community_id: j.community_id != null ? j.community_id : null,
    dispatch_mode: meta.dispatch_mode || (j.provider_user_id ? 'provider' : 'admin_dispatch'),
    created_at: j.created_at,
    status: j.status
  };
}

exports.dispatchQueue = async (req, res) => {
  try {
    const [serviceRows, neighborRows] = await Promise.all([
      ServiceOrder.findAll({
        where: {
          status: 'paid_pending_dispatch',
          pay_status: 'paid',
          assigned_worker_id: null
        },
        order: [['created_at', 'ASC']],
        limit: 80,
        include: [
          { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image'] },
          { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] }
        ]
      }),
      NeighborAssistOrder.findAll({
        where: { status: 'paid_pending_dispatch', assigned_worker_id: null },
        order: [['created_at', 'ASC']],
        limit: 80,
        include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] }]
      })
    ]);
    const service_orders = serviceRows.map(serializeDispatchOrder);
    const neighbor_assist_orders = neighborRows.map((r) => r.get({ plain: true }));
    return ok(res, { service_orders, neighbor_assist_orders });
  } catch (e) {
    console.error('dispatchQueue', e);
    return fail(res, 500, '查询失败');
  }
};

exports.listServiceOrders = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const cid = parseCommunityId(req.query.community_id);
    if (cid != null) where.community_id = cid;
    const rows = await ServiceOrder.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(req.query.limit, 10) || 200, 500),
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] },
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url'], required: false }
      ]
    });
    return ok(res, rows);
  } catch (e) {
    console.error('listServiceOrders', e);
    return fail(res, 500, '查询失败');
  }
};

exports.assignServiceOrder = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const worker_id =
      req.body.worker_id != null && req.body.worker_id !== ''
        ? parseInt(req.body.worker_id, 10)
        : parseInt(req.body.worker_user_id, 10);
    if (!id || !worker_id) return fail(res, 400, '缺少 id 或 worker_id');
    const order = await ServiceOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在');
    const wchk = await workerAssignableForServiceOrderWorker(worker_id, order.community_id);
    if (!wchk.ok) return fail(res, 400, wchk.reason || '技工不可派单');
    if (order.status !== 'paid_pending_dispatch' || order.assigned_worker_id) {
      return fail(res, 400, '仅「待派单且未指派」的订单可派单');
    }
    order.assigned_worker_id = worker_id;
    order.dispatch_at = new Date();
    order.dispatch_by = adminOperatorId(req);
    order.status = 'dispatched';
    await order.save();
    await order.reload({
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price'] },
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url'], required: false }
      ]
    });
    return ok(res, order.get({ plain: true }));
  } catch (e) {
    console.error('assignServiceOrder', e);
    return fail(res, 500, '派单失败');
  }
};

exports.listNeighborAssistOrders = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const ncid = parseCommunityId(req.query.community_id);
    if (ncid != null) where.community_id = ncid;
    if (req.query.assist_type) where.assist_type = req.query.assist_type;
    const rows = await NeighborAssistOrder.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(req.query.limit, 10) || 200, 500),
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url'], required: false }
      ]
    });
    return ok(res, rows);
  } catch (e) {
    console.error('listNeighborAssistOrders', e);
    return fail(res, 500, '查询失败');
  }
};

exports.assignNeighborAssistOrder = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const worker_id =
      req.body.worker_id != null && req.body.worker_id !== ''
        ? parseInt(req.body.worker_id, 10)
        : parseInt(req.body.worker_user_id, 10);
    if (!id || !worker_id) return fail(res, 400, '缺少 id 或 worker_id');
    if (!(await workerAssignable(worker_id))) return fail(res, 400, '技工不可派单');
    const order = await NeighborAssistOrder.findByPk(id);
    if (!order) return fail(res, 404, '订单不存在');
    if (order.status !== 'paid_pending_dispatch' || order.assigned_worker_id) {
      return fail(res, 400, '仅「待派单且未指派」的订单可派单');
    }
    order.assigned_worker_id = worker_id;
    order.dispatch_at = new Date();
    order.dispatch_by = adminOperatorId(req);
    order.status = 'dispatched';
    await order.save();
    await order.reload({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url'], required: false }
      ]
    });
    return ok(res, order.get({ plain: true }));
  } catch (e) {
    console.error('assignNeighborAssistOrder', e);
    return fail(res, 500, '派单失败');
  }
};
