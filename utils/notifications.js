const app = getApp();

const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_SHIPPED: 'order_shipped',
  REFUND_APPLIED: 'refund_applied',
  REFUND_APPROVED: 'refund_approved',
  REFUND_REJECTED: 'refund_rejected',
  DISPATCH_CREATED: 'dispatch_created',
  DISPATCH_ACCEPTED: 'dispatch_accepted',
  DISPATCH_REJECTED: 'dispatch_rejected',
  CHECK_IN: 'check_in',
  SERVICE_COMPLETED: 'service_completed',
  COMPLAINT_CREATED: 'complaint_created',
  ARBITRATION_RESULT: 'arbitration_result'
};

function sendNotification(type, targetUserId, data) {
  return new Promise((resolve, reject) => {
    try {
      const util = require('./util.js');
      util.post('notifications/send', {
        type,
        target_user_id: targetUserId,
        data: data || {}
      }).then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function getMyNotifications(page, pageSize) {
  return new Promise((resolve, reject) => {
    try {
      const util = require('./util.js');
      util.get('notifications/my', {
        page: page || 1,
        page_size: pageSize || 20
      }).then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function markAsRead(notificationId) {
  return new Promise((resolve, reject) => {
    try {
      const util = require('./util.js');
      util.post(`notifications/read/${notificationId}`, {}).then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function getNotificationText(type, data) {
  const templates = {
    [NOTIFICATION_TYPES.ORDER_CREATED]: `您收到新订单，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.ORDER_ACCEPTED]: `商家已接单，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.ORDER_SHIPPED]: `订单已发货，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.REFUND_APPLIED]: `收到退款申请，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.REFUND_APPROVED]: `退款已同意，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.REFUND_REJECTED]: `退款被拒绝，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.DISPATCH_CREATED]: `您被指派新任务，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.DISPATCH_ACCEPTED]: `技工已接单，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.DISPATCH_REJECTED]: `技工拒单，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.CHECK_IN]: `技工已上门打卡，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.SERVICE_COMPLETED]: `服务已完成，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.COMPLAINT_CREATED]: `收到投诉，订单号：${data.orderNo || ''}`,
    [NOTIFICATION_TYPES.ARBITRATION_RESULT]: `仲裁结果已出，订单号：${data.orderNo || ''}`
  };
  return templates[type] || '您有一条新通知';
}

module.exports = {
  NOTIFICATION_TYPES,
  sendNotification,
  getMyNotifications,
  markAsRead,
  getNotificationText
};
