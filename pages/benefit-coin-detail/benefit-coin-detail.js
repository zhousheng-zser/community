const app = getApp();
const api = require('../../api/index.js');

Page({
  data: {
    goodsId: '',
    goods: {},
    balance: 0,
    loading: false
  },

  onLoad(options) {
    if (options.goodsId) {
      this.setData({ goodsId: options.goodsId });
      this.loadGoodsDetail();
      this.loadBalance();
    }
  },

  async loadBalance() {
    try {
      const res = await api.benefitCoin.getBalance();
      const balance = res.balance || (res.data && res.data.balance) || 0;
      this.setData({ balance });
    } catch (e) {
      console.log('获取家事币余额失败', e);
    }
  },

  async loadGoodsDetail() {
    this.setData({ loading: true });
    try {
      const res = await api.benefitCoin.getExchangeGoodsDetail(this.data.goodsId);
      const goods = res.data || res;
      this.setData({ goods, loading: false });
    } catch (e) {
      console.log('获取商品详情失败', e);
      this.setData({ loading: false });
      this.mockLoadDetail();
    }
  },

  mockLoadDetail() {
    this.setData({
      goods: {
        id: this.data.goodsId,
        name: '家事币定制保温杯',
        coins: 500,
        image: '/img/placeholders/home_cleaning.png',
        stock: 100,
        description: '高品质保温杯，容量500ml，保温时长12小时',
        images: ['/img/placeholders/home_cleaning.png', '/img/placeholders/home_cleaning.png']
      }
    });
  },

  async handleExchange() {
    const { goods, balance } = this.data;
    
    if (balance < goods.coins) {
      wx.showToast({ title: '家事币余额不足', icon: 'none' });
      return;
    }

    if (goods.stock <= 0) {
      wx.showToast({ title: '商品已兑完', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认兑换',
      content: `确定使用 ${goods.coins} 家事币兑换该商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.benefitCoin.exchangeGoods({
              goods_id: goods.id,
              quantity: 1
            });
            wx.showToast({ title: '兑换成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (e) {
            console.log('兑换失败', e);
            wx.showToast({ title: e.errmsg || '兑换失败', icon: 'none' });
          }
        }
      }
    });
  }
});
