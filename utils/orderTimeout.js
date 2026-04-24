/**
 * 订单超时自动处理机制
 * 用于：自动确认收货、自动退款、超时取消等
 */

const DEFAULT_TIMEOUTS = {
  AUTO_CONFIRM_RECEIPT_DAYS: 10,
  AUTO_REFUND_HOURS: 48,
  AUTO_CANCEL_UNPAID_MINUTES: 30,
  AUTO_CONFIRM_SERVICE_HOURS: 24
};

function getTimeoutConfig() {
  try {
    const config = wx.getStorageSync('order_timeout_config');
    if (config) {
      return Object.assign({}, DEFAULT_TIMEOUTS, config);
    }
  } catch (e) {}
  return DEFAULT_TIMEOUTS;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(/-/g, '/'));
  return isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

function formatCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { expired: true, text: '已超时', days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  let text = '';
  if (days > 0) text += `${days}天`;
  if (hours > 0) text += `${hours}小时`;
  text += `${minutes}分${seconds}秒`;
  return { expired: false, text, days, hours, minutes, seconds };
}

function calcAutoConfirmDeadline(deliveryTime) {
  const { AUTO_CONFIRM_RECEIPT_DAYS } = getTimeoutConfig();
  const delivery = parseDate(deliveryTime);
  if (!delivery) return null;
  return addDays(delivery, AUTO_CONFIRM_RECEIPT_DAYS);
}

function calcAutoRefundDeadline(refundApplyTime) {
  const { AUTO_REFUND_HOURS } = getTimeoutConfig();
  const applyTime = parseDate(refundApplyTime);
  if (!applyTime) return null;
  return addHours(applyTime, AUTO_REFUND_HOURS);
}

function calcAutoCancelUnpaidDeadline(createdAt) {
  const { AUTO_CANCEL_UNPAID_MINUTES } = getTimeoutConfig();
  const orderTime = parseDate(createdAt);
  if (!orderTime) return null;
  return addMinutes(orderTime, AUTO_CANCEL_UNPAID_MINUTES);
}

function calcAutoConfirmServiceDeadline(completeTime) {
  const { AUTO_CONFIRM_SERVICE_HOURS } = getTimeoutConfig();
  const complete = parseDate(completeTime);
  if (!complete) return null;
  return addHours(complete, AUTO_CONFIRM_SERVICE_HOURS);
}

function startCountdownTimer(page, deadlineKey, displayKey, intervalMs) {
  const interval = intervalMs || 1000;
  const timerId = setInterval(() => {
    const deadline = page.data[deadlineKey];
    if (!deadline) {
      clearInterval(timerId);
      return;
    }
    const countdown = formatCountdown(deadline);
    page.setData({ [displayKey]: countdown });
    if (countdown.expired) {
      clearInterval(timerId);
      page.onCountdownExpired && page.onCountdownExpired(deadlineKey);
    }
  }, interval);
  return timerId;
}

function clearCountdownTimer(timerId) {
  if (timerId) clearInterval(timerId);
}

module.exports = {
  DEFAULT_TIMEOUTS,
  getTimeoutConfig,
  parseDate,
  formatCountdown,
  calcAutoConfirmDeadline,
  calcAutoRefundDeadline,
  calcAutoCancelUnpaidDeadline,
  calcAutoConfirmServiceDeadline,
  startCountdownTimer,
  clearCountdownTimer
};
