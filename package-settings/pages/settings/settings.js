const app = getApp();
Page({
  data: { maskedPhone: '' },
  onShow() {
    const user = app.globalData.user || {};
    const mobile = user.userMobile || '';
    const maskedPhone = mobile.length >= 11 ? mobile.slice(0,3) + '****' + mobile.slice(7) : '';
    this.setData({ maskedPhone });
  },
  changePwd() { wx.showToast({ title: '请通过微信安全中心修改密码', icon: 'none', duration: 2000 }); },
  changePhone() { wx.showToast({ title: '如需修改手机号请联系客服', icon: 'none', duration: 2000 }); },
  aboutUs() { wx.showToast({ title: '九州社区 v2.0.1', icon: 'none' }); },
  checkUpdate() {
    const um = wx.getUpdateManager ? wx.getUpdateManager() : null;
    if (!um) {
      wx.showToast({ title: '当前基础库较旧', icon: 'none' });
      return;
    }
    um.onCheckForUpdate((res) => {
      if (!res.hasUpdate) wx.showToast({ title: '已是最新版本', icon: 'none' });
    });
    um.onUpdateReady(() => {
      wx.showModal({
        title: '更新就绪',
        content: '新版本已下载，是否重启应用？',
        success: (r) => r.confirm && um.applyUpdate()
      });
    });
  },
  cancelAccount() {
    wx.showModal({ title: '注销账号', content: '账号注销后数据无法恢复，确认注销？', confirmText: '联系客服', success(res) {
      if (res.confirm) wx.showToast({ title: '请联系平台客服处理', icon: 'none', duration: 2000 });
    }});
  },
  logout() {
    wx.showModal({ title: '退出登录', content: '确定要退出登录吗？', success(res) {
      if (res.confirm) {
        wx.clearStorageSync();
        wx.setStorageSync('manual_logged_out', true);
        app.globalData.user = null;
        wx.reLaunch({ url: '/pages/index/index' });
      }
    }});
  }
});
