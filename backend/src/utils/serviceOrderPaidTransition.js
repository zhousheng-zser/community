/**
 * 到家 service_orders 支付完成后的状态迁移（与 serviceOrderController.mockPay 一致）
 * 避免微信回调、虚拟支付、mock-success 与主路径逻辑分叉
 */
function applyServiceOrderStatusAfterPayment(order) {
  if (order.status !== 'pending_pay' && order.status !== 'pending_worker_accept') {
    return;
  }
  if (order.provider_user_id) {
    order.status = 'pending_accept';
  } else if (order.assigned_worker_id) {
    const meta = order.fulfillment_meta || {};
    // 用户直约：创单起即为 pending_worker_accept，支付后仍待技工接单
    if (meta.direct_worker) {
      order.status = 'pending_worker_accept';
    } else {
      order.status = 'dispatched';
    }
  } else {
    order.status = 'paid_pending_dispatch';
  }
}

module.exports = { applyServiceOrderStatusAfterPayment };
