/**
 * 定位权限检测与引导（首页未登录且无权限时弹窗）
 */

function checkLocationAuthorized() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        const auth = res.authSetting && res.authSetting['scope.userLocation'];
        resolve(!!auth);
      },
      fail: () => resolve(false)
    });
  });
}

function showLocationAuthModal() {
  return new Promise((resolve) => {
    wx.showModal({
      title: '您未开启地理位置授权',
      content: '请在系统设置中打开位置授权，以便我们为您提供更好的服务',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            complete: () => resolve(!!res.confirm)
          });
        } else {
          resolve(false);
        }
      },
      fail: () => resolve(false)
    });
  });
}

module.exports = {
  checkLocationAuthorized,
  showLocationAuthModal
};
