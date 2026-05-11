const api = require('../../../api/index.js');

const TYPE_LABEL = {
  market: '集市订单佣金',
  service: '服务订单佣金',
  neighbor_assist: '邻里互助佣金'
};

const STATUS_LABEL = {
  pending: '待结算',
  available: '已到账',
  withdrawn: '已提现',
  refunded: '已回退'
};

Page({
  data: {
    list: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onShow() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadList();
  },

  async loadList() {
    if (this.data.loading) return;
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ list: [] });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.commission.getMyRecords({ page: this.data.page, page_size: 30 });
      const data = res && res.data ? res.data : res;
      const records = (data.list || []).map(item => ({
        id: item.id,
        title: (TYPE_LABEL[item.order_type] || '佣金收入') + ' - ' + (STATUS_LABEL[item.status] || ''),
        timeLabel: item.distributed_at ? new Date(item.distributed_at).toLocaleString('zh-CN') : '',
        amount: '+' + Number(item.commission_amount).toFixed(2),
        orderNo: item.order_id,
        status: item.status
      }));

      this.setData({
        list: this.data.page === 1 ? records : [...this.data.list, ...records],
        hasMore: records.length >= 30,
        loading: false
      });
    } catch (e) {
      console.error('获取交易明细失败:', e);
      this.setData({ loading: false });
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList();
    }
  }
});
