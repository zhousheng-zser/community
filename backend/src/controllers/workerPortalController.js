const store = require('../workerPortalStore');

function ok(res, data) {
  res.json({ errno: 0, errmsg: 'ok', data });
}

function fail(res, errno, errmsg, status) {
  res.status(status || 200).json({ errno, errmsg });
}

/** GET /service-orders 与 GET /orders（别名） */
function listServiceOrders(req, res) {
  const list = store.listOrders();
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
  const total = list.length;
  ok(res, {
    list,
    total,
    page,
    page_size: limit
  });
}

/** GET /service-orders/:id */
function getServiceOrder(req, res) {
  const row = store.findById(req.params.id);
  if (!row) {
    return fail(res, 404, '订单不存在', 404);
  }
  ok(res, row);
}

function postAccept(req, res) {
  const row = store.updateOrder(req.params.id, {
    status_text: '待上门',
    status: 'dispatched'
  });
  if (!row) return fail(res, 404, '订单不存在', 404);
  ok(res, { order: row });
}

function postReject(req, res) {
  const reason = (req.body && req.body.reason) || '';
  const row = store.updateOrder(req.params.id, {
    status_text: '已拒单',
    status: 'rejected',
    reject_reason: reason
  });
  if (!row) return fail(res, 404, '订单不存在', 404);
  ok(res, { order: row });
}

function postCheckIn(req, res) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const row = store.updateOrder(req.params.id, {
    check_in_at: now
  });
  if (!row) return fail(res, 404, '订单不存在', 404);
  ok(res, { order: row, check_in_at: now });
}

function postEvidence(req, res) {
  const { kind, urls } = req.body || {};
  const o = store.findById(req.params.id);
  if (!o) return fail(res, 404, '订单不存在', 404);
  const key = kind === 'after' ? 'after_photos' : 'before_photos';
  const prev = Array.isArray(o[key]) ? o[key] : [];
  const next = prev.concat(Array.isArray(urls) ? urls : []);
  const row = store.updateOrder(req.params.id, { [key]: next });
  ok(res, { order: row });
}

function postAddonRequest(req, res) {
  const o = store.findById(req.params.id);
  if (!o) return fail(res, 404, '订单不存在', 404);
  ok(res, { received: true });
}

function postComplete(req, res) {
  const row = store.updateOrder(req.params.id, {
    status_text: '已完成',
    status: 'completed'
  });
  if (!row) return fail(res, 404, '订单不存在', 404);
  ok(res, { order: row });
}

module.exports = {
  listServiceOrders,
  getServiceOrder,
  postAccept,
  postReject,
  postCheckIn,
  postEvidence,
  postAddonRequest,
  postComplete
};
