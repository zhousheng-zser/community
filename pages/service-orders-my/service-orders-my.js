const app = getApp();
const util = require('../../utils/util.js');
const { unwrapList } = util;
const api = require('../../api/index.js');

Page({
  data: {
    list: [],
    loading: false,
    emptyTip: '暂无服务订单，去分类服务下单吧'
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  /**
   * 加载服务订单
   * 支持类型过滤和重试机制
   */
  async load() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ list: [], emptyTip: '登录后查看订单' });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true, list: [], failed: false });

    try {
      // 使用 serviceOrder 专用接口获取服务订单
      // TODO: 后端实现 /order/all 统一订单接口后可切换为 api.order.getAll()
      const res = await api.serviceOrder.getMyList({ page: 1, limit: 50 });

      const raw = unwrapList(res);

      // 过滤超过 15 天的订单（1296000000 ms = 15 天）
      const now = Date.now();
      const filteredData = raw.filter(item => {
        const createTime = item.create_time || item.created_at || item.createdAt;
        if (createTime) {
          const time = new Date(createTime).getTime();
          return now - time < 1296000000;
        }
        return true;
      });

      const list = filteredData.map((o) => {
        // 优先使用 worker_user_id，其次尝试从 worker 对象获取
        let workerUserId = o.worker_user_id;
        if (!workerUserId && o.worker && o.worker.user_id) {
          workerUserId = o.worker.user_id;
        }

        // 获取状态文本
        let statusText = o.status_text || o.status_label || o.status_text || '待处理';
        if (!statusText && o.status) {
          statusText = this.getStatusText(o.status, '服务订单');
        }

        // 获取订单标题
        let title = o.service_title || o.title || (o.service && o.service.title);
        if (!title) {
          title = '到家服务订单';
        }

        // 获取订单金额
        let amount = o.amount || o.pay_amount || 0;

        // 格式化时间和状态
        const time = this.formatTime(o.create_time || o.created_at || o.createdAt);
        const statusStr = this.getStateStr(statusText);

        return {
          id: o.id || o.order_id,
          orderNo: o.order_no || o.orderNo || '',
          workerUserId: workerUserId || '',
          statusText: statusText || '待处理',
          title: title || '到家服务订单',
          time: time || '',
          amount: amount != null ? Number(amount).toFixed(2) : '0.00',
          statusStr: statusStr || ''
        };
      });

      this.setData({
        list,
        loading: false,
        failed: false,
        emptyTip: list.length === 0 ? '暂无服务订单，去分类服务下单吧' : ''
      });
    } catch (e) {
      console.error('service-orders 加载失败:', e);
      this.setData({
        loading: false,
        failed: true,
        list: [],
        emptyTip: '加载失败，下拉刷新重试'
      });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /**
   * 获取状态显示文本（兼容多类型）
   */
  getStatusText(status, type = '服务订单') {
    if (!status) return '待处理';

    const statusMap = {
      // 服务订单状态
      'pending_pay': '待付款',
      'pending_worker_accept': '待技师接单',
      'dispatched': '已派单',
      'in_service': '服务中',
      'pending_user_confirm': '待确认',
      'completed': '已完成',
      'cancelled': '已取消',
      'refunded': '已退款',
      // 备用状态
      'pending': '待处理',
      'accepting': '待接单',
      'conflict_pending': '待解约'
    };

    return statusMap[status] || status || '待处理';
  },

  /**
   * 获取状态简写（用于 WXML 显示）
   */
  getStateStr(statusText) {
    const map = {
      '待付款': '待付款',
      '待技师接单': '待接单',
      '已派单': '已派单',
      '服务中': '服务中',
      '待确认': '待确认',
      '已完成': '已完成',
      '已取消': '已取消',
      '已退款': '已退款'
    };
    return map[statusText] || statusText;
  },

  /**
   * 格式化时间
   */
  formatTime(timeStamp) {
    if (!timeStamp) return '';
    const date = new Date(timeStamp);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  },

  /**
   * 获取订单方式标签
   */
  getOrderType(type, subtitle = '') {
    const typeMap = {
      'btn_1': '快修师傅 / 服务商派单，支持加项',
      'btn_2': '百亿补贴服务',
      'btn_3': '技工自助服务，价格更透明',
      'btn_4': '技工自助服务，价格更透明'
    };
    return typeMap[type] || subtitle || '服务订单';
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const orderNo = e.currentTarget.dataset.orderno || '';
    if (!id) return;
    let url = `/pages/service-order-detail/service-order-detail?id=${id}`;
    if (orderNo) url += `&orderNo=${encodeURIComponent(orderNo)}`;
    wx.navigateTo({ url });
  }
});
