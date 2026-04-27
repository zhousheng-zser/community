// pages/commission-records/commission-records.js
const app = getApp();
const api = require('../../api/index.js');

const ROLE_LABEL = {
  headquarters: '总部',
  promoter: '推广者',
  district_partner: '区县合伙人',
  market_partner: '市场合伙人'
};

const STATUS_LABEL = {
  pending: '待结算',
  available: '可提现',
  withdrawn: '已提现',
  refunded: '已回退'
};

const STATUS_COLOR = {
  pending: '#ff7a00',
  available: '#52c41a',
  withdrawn: '#999',
  refunded: '#ff4d4f'
};

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待结算' },
      { key: 'available', label: '可提现' }
    ],
    activeTab: 'all',
    list: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onShow() {
    this.setData({ activeTab: 'all', list: [], page: 1, hasMore: true });
    this.loadRecords();
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key, list: [], page: 1, hasMore: true });
    this.loadRecords();
  },

  async loadRecords() {
    if (this.data.loading) return;

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const params = {
        page: this.data.page,
        page_size: 20
      };
      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab;
      }

      const res = await api.commission.getMyRecords(params);
      const data = res && res.data ? res.data : res;
      const list = (data.list || []).map(item => ({
        ...item,
        role_label: ROLE_LABEL[item.beneficiary_role] || item.beneficiary_role,
        status_label: STATUS_LABEL[item.status] || item.status,
        status_color: STATUS_COLOR[item.status] || '#999'
      }));

      this.setData({
        list: this.data.page === 1 ? list : [...this.data.list, ...list],
        hasMore: list.length >= 20,
        loading: false
      });
    } catch (e) {
      console.error('获取佣金明细失败:', e);
      this.setData({ loading: false });
      wx.showToast({ title: '获取明细失败', icon: 'none' });
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadRecords();
    }
  },

  onPullDownRefresh() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadRecords().then(() => wx.stopPullDownRefresh());
  }
});
