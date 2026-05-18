/**
 * 纯内存单测：支付成功后 ServiceOrder 状态迁移（无 DB）
 * 运行：cd backend && node scripts/test-service-order-paid-transition.js
 */
const { applyServiceOrderStatusAfterPayment } = require('../src/utils/serviceOrderPaidTransition');

let failed = 0;
function assert(name, cond, detail) {
  if (cond) console.log('PASS', name);
  else {
    failed++;
    console.error('FAIL', name, detail || '');
  }
}

function mockOrder(partial) {
  return { status: 'pending_pay', pay_status: 'unpaid', fulfillment_meta: null, ...partial };
}

function run() {
  let o;

  o = mockOrder({ provider_user_id: 99 });
  applyServiceOrderStatusAfterPayment(o);
  assert('服务商单 → pending_accept', o.status === 'pending_accept');

  o = mockOrder({
    status: 'pending_worker_accept',
    assigned_worker_id: 5,
    fulfillment_meta: { direct_worker: true, await_user_confirm: true }
  });
  applyServiceOrderStatusAfterPayment(o);
  assert('直约单支付后仍 pending_worker_accept', o.status === 'pending_worker_accept');

  o = mockOrder({
    assigned_worker_id: 5,
    fulfillment_meta: { await_user_confirm: true } // 无 direct_worker：视为运营侧已指派等
  });
  applyServiceOrderStatusAfterPayment(o);
  assert('非直约但已指派 → dispatched', o.status === 'dispatched');

  o = mockOrder({});
  applyServiceOrderStatusAfterPayment(o);
  assert('无服务商无技工 → paid_pending_dispatch', o.status === 'paid_pending_dispatch');

  o = mockOrder({ status: 'completed' });
  applyServiceOrderStatusAfterPayment(o);
  assert('已完成单不改写状态', o.status === 'completed');
}

run();
process.exit(failed ? 1 : 0);
