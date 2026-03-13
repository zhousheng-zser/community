const app = getApp();
Page({
  data: { maskedPhone: '' },
  onShow() {
    const user = app.globalData.user || {};
    const mobile = user.userMobile || '';
    const maskedPhone = mobile.length >= 11 ? mobile.slice(0,3) + '****' + mobile.slice(7) : '';
    this.setData({ maskedPhone });
  },
  comingSoon() { wx.showToast({ title: '敬请期待', icon: 'none' }); },
  changePwd() { wx.showToast({ title: '请通过微信安全中心修改密码', icon: 'none', duration: 2000 }); },
  changePhone() { wx.showToast({ title: '如需修改手机号请联系客服', icon: 'none', duration: 2000 }); },
  aboutUs() { wx.showToast({ title: '家事速配 v2.0.1', icon: 'none' }); },
  cancelAccount() {
    wx.showModal({ title: '注销账号', content: '账号注销后数据无法恢复，确认注销？', confirmText: '联系客服', success(res) {
      if (res.confirm) wx.showToast({ title: '请联系平台客服处理', icon: 'none', duration: 2000 });
    }});
  },
  logout() {
    wx.showModal({ title: '退出登录', content: '确定要退出登录吗？', success(res) {
      if (res.confirm) {
        wx.clearStorageSync();
        app.globalData.user = null;
        wx.reLaunch({ url: '/pages/index/index' });
      }
    }});
  }
});
