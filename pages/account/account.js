// pages/account/account.js
const app=getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');
const lp = require('../../utils/localPrefs.js');

Page({
  data: {
    account:{
      totalAcount: 0.00,
      availAcount: 0.00,
      unPointAcount:0.00
    },
    loading: false
  },

  onLoad: function (options) {
    this.getInfo()
  }, 

  onShow: function() {
    this.getInfo();
  },

  onPullDownRefresh: function() {
    this.getInfo();
  },

  onShareAppMessage: function (res) {
    const openid = app.globalData.user.opId;
    return app.onShare(openid, res);
  },

  async extract(){
    const that=this;
    const availAcount = that.data.account.availAcount;
    
    if (parseFloat(availAcount)<=0){
      wx.showToast({
        icon: "none",
        title: '无可提现金额',
        duration: 2500
      })
      return;
    }

    wx.showModal({
      title: '提现确认',
      content: `确定要提现 ¥${availAcount} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.promoter.withdraw({ amount: availAcount });
            lp.pushWalletTransaction({
              title: '提现申请',
              amount: '-' + String(availAcount),
              type: 'withdraw'
            });
            wx.showToast({ title: '提现申请已提交', icon: 'success' });
            that.getInfo();
          } catch (e) {
            wx.showToast({ title: e.errmsg || '提现失败', icon: 'none' });
          }
        }
      }
    })
  },

  extracting(){
    wx.showToast({
      icon:"none",
      title: '您有一单提现申请正在处理中,3-5个工作日内会以微信红包形式发放',
      duration:2500
    })
  },

  async getInfo(){
    this.setData({ loading: true });
    try {
      const res = await api.promoter.getCommission();
      const account = res.data || res;
      const total = Number(account.total_amount || account.totalAcount || 0).toFixed(2);
      const avail = Number(account.available_amount || account.availAcount || 0).toFixed(2);
      const pending = Number(account.pending_amount || account.unPointAcount || 0).toFixed(2);
      this.setData({
        account: {
          totalAcount: total,
          availAcount: avail,
          unPointAcount: pending
        },
        loading: false
      });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('获取佣金信息失败', e);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  goRecords() {
    wx.navigateTo({ url: '/package-account/pages/wallet-transactions/wallet-transactions' });
  },

  goCommission() {
    wx.navigateTo({ url: '/package-commission/pages/commission-overview/commission-overview' });
  },

  goCommissionRecords() {
    wx.navigateTo({ url: '/package-commission/pages/commission-records/commission-records' });
  }
})