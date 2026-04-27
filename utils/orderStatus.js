/**
 * 订单状态通用枚举
 * 统一所有订单类型的状态定义
 */

/**
 * 服务订单状态
 */
export const SERVICE_ORDER_STATUS = {
    PENDING_PAY: 'pending_pay',          // 待付款
    PENDING_WORKER_ACCEPT: 'pending_worker_accept', // 待技师接单
    DISPATCHED: 'dispatched',            // 已派单
    IN_SERVICE: 'in_service',            // 服务中
    PENDING_USER_CONFIRM: 'pending_user_confirm', // 待用户确认
    COMPLETED: 'completed',              // 已完成
    CANCELLED: 'cancelled',              // 已取消
    REFUNDED: 'refunded'                 // 已退款
};

/** 服务订单状态显示文本 */
export const SERVICE_ORDER_STATUS_TEXT = {
    [SERVICE_ORDER_STATUS.PENDING_PAY]: '待付款',
    [SERVICE_ORDER_STATUS.PENDING_WORKER_ACCEPT]: '待技师接单',
    [SERVICE_ORDER_STATUS.DISPATCHED]: '已派单',
    [SERVICE_ORDER_STATUS.IN_SERVICE]: '服务中',
    [SERVICE_ORDER_STATUS.PENDING_USER_CONFIRM]: '待确认',
    [SERVICE_ORDER_STATUS.COMPLETED]: '已完成',
    [SERVICE_ORDER_STATUS.CANCELLED]: '已取消',
    [SERVICE_ORDER_STATUS.REFUNDED]: '已退款'
};

/**
 * 邻里帮帮订单状态
 */
export const NEIGHBOR_ASSIST_STATUS = {
    PENDING_PAY: 'pending_pay',          // 待付款
    PAID_PENDING_DISPATCH: 'paid_pending_dispatch', // 已付待派单
    DISPATCHED: 'dispatched',            // 已派单
    IN_SERVICE: 'in_service',            // 服务中
    COMPLETED: 'completed',              // 已完成
    CONFIRMED: 'confirmed',              // 已确认
    CANCELLED: 'cancelled'               // 已取消
};

/** 邻里帮帮订单状态显示文本 */
export const NEIGHBOR_ASSIST_STATUS_TEXT = {
    [NEIGHBOR_ASSIST_STATUS.PENDING_PAY]: '待付款',
    [NEIGHBOR_ASSIST_STATUS.PAID_PENDING_DISPATCH]: '派单中',
    [NEIGHBOR_ASSIST_STATUS.DISPATCHED]: '已派单',
    [NEIGHBOR_ASSIST_STATUS.IN_SERVICE]: '服务中',
    [NEIGHBOR_ASSIST_STATUS.COMPLETED]: '已完成',
    [NEIGHBOR_ASSIST_STATUS.CONFIRMED]: '已确认',
    [NEIGHBOR_ASSIST_STATUS.CANCELLED]: '已取消'
};

/**
 * 集市订单状态
 */
export const MARKET_ORDER_STATUS = {
    PENDING_PAYMENT: 'pending_payment',  // 待付款
    PENDING_ACCEPT: 'pending_accept',    // 待接单
    PENDING_SERVICE: 'pending_service',  // 备货中
    PENDING_RECEIPT: 'pending_receipt',  // 待收货
    COMPLETED: 'completed',              // 已完成
    CANCELLED: 'cancelled',              // 已取消
    REFUNDED: 'refunded'                 // 已退款
};

/** 集市订单状态显示文本 */
export const MARKET_ORDER_STATUS_TEXT = {
    [MARKET_ORDER_STATUS.PENDING_PAYMENT]: '待付款',
    [MARKET_ORDER_STATUS.PENDING_ACCEPT]: '待接单',
    [MARKET_ORDER_STATUS.PENDING_SERVICE]: '备货中',
    [MARKET_ORDER_STATUS.PENDING_RECEIPT]: '待收货',
    [MARKET_ORDER_STATUS.COMPLETED]: '已完成',
    [MARKET_ORDER_STATUS.CANCELLED]: '已取消',
    [MARKET_ORDER_STATUS.REFUNDED]: '已退款'
};

/**
 * 快捷状态映射函数
 */
export const getStatusText = (status, type) => {
    if (!status) return '未知';

    const t = (type || '').toString().trim();
    if (t === 'service' || t === '服务订单') {
        return SERVICE_ORDER_STATUS_TEXT[status] || status || '未知';
    }
    if (t === 'neighbor' || t === '邻里帮帮') {
        return NEIGHBOR_ASSIST_STATUS_TEXT[status] || status || '未知';
    }
    if (t === 'market' || t === '集市订单') {
        return MARKET_ORDER_STATUS_TEXT[status] || status || '未知';
    }

    // 未指定类型时，尝试所有映射
    return SERVICE_ORDER_STATUS_TEXT[status]
        || NEIGHBOR_ASSIST_STATUS_TEXT[status]
        || MARKET_ORDER_STATUS_TEXT[status]
        || status
        || '未知';
};

/**
 * 获取订单状态简写（用于显示）
 */
export const getStatusShort = (statusText) => {
    const map = {
        '待付款': '待付款',
        '待技师接单': '待接单',
        '待接单': '待接单',
        '已派单': '已派单',
        '派单中': '派单中',
        '服务中': '服务中',
        '待确认': '待确认',
        '已完成': '已完成',
        '已确认': '已确认',
        '已取消': '已取消',
        '已退款': '已退款'
    };
    return map[statusText] || statusText;
};

module.exports = {
    SERVICE_ORDER_STATUS,
    SERVICE_ORDER_STATUS_TEXT,
    NEIGHBOR_ASSIST_STATUS,
    NEIGHBOR_ASSIST_STATUS_TEXT,
    MARKET_ORDER_STATUS,
    MARKET_ORDER_STATUS_TEXT,
    getStatusText,
    getStatusShort
};
