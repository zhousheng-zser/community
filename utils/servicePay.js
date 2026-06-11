/**
 * 到家服务订单微信支付（JSAPI）
 */
const marketPay = require('./marketPay.js');

async function startServicePaymentFlow(orderNo, options = {}) {
  return marketPay.startPaymentFlow(
    orderNo,
    'service-orders/payments/create',
    'service-orders/payments/status',
    {
      detailUrl: `../service-order-detail/service-order-detail?orderNo=${encodeURIComponent(orderNo)}`,
      ...options
    }
  );
}

function pollServicePayStatus(orderNo, options) {
  return marketPay.pollPayStatus(orderNo, 'service-orders/payments/status', options);
}

module.exports = {
  startServicePaymentFlow,
  pollServicePayStatus,
  mapWxPayError: marketPay.mapWxPayError,
  isRealWxPayParams: marketPay.isRealWxPayParams,
  extractWxPayParams: marketPay.extractWxPayParams
};
