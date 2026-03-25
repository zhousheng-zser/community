//app.js
const util = require('utils/util.js');
App({
  onLaunch: function (query) {
    // 冷启动：自动定位仅在本轮打开做一次；未手动选点前清空上次自动坐标，首页 init 会重新 getLocation
    this._resetMarketAutoLocationOnColdStart();
  },
  /** 冷启动清空本地集市定位缓存（含手动选点标记），下次进入首页会重新自动定位一次；同一次使用中手动选点后再不会被 Tab/列表刷新自动改坐标 */
  _resetMarketAutoLocationOnColdStart() {
    try {
      wx.removeStorageSync('market_user_lat');
      wx.removeStorageSync('market_user_lng');
      wx.removeStorageSync('market_user_location_manual');
      wx.removeStorageSync('market_snap_address_id');
      wx.removeStorageSync('market_snap_distance_km');
      wx.removeStorageSync('market_location_label');
    } catch (e) {}
  },
  globalData: {
    userInfo: null,
    user: null
  },
  // 核心登录保存函数
  save(parentOpenid, callback) {
    wx.showLoading({
      title: '正在登录'
    });

    // 1. 调用微信登录获取临时 code
    wx.login({
      success: res => {
        if (res.code) {
          // 2. 将 code 发给后端换取 Token 和用户信息
          util.post("auth/login", {
            code: res.code
          }).then((data) => {
            wx.hideLoading();
            // 保存 Token 到本地，供之后的所有请求鉴权使用
            wx.setStorageSync('token', data.token);

            // 3. 将后端返回的字段映射到小程序全局数据中
            this.globalData.user = {
              id: data.user.id,
              opId: data.user.openid,
              userName: data.user.nickname || '微信用户',
              userPhoto: data.user.avatar_url || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
              userMobile: data.user.phone || '13800000000',
              userAddress: data.user.address || '',
              userBankNum: data.user.bank_num || '',
              userWxId: data.user.wx_id || '',
              role: data.user.role || 'user',
              userState: 0,
              remark2: 2,
              vipFlag: 0
            };

            // 4. 执行回调（比如页面刷新数据）
            if (callback) { callback() }
          }).catch(err => {
            wx.hideLoading();
            console.error('登录对接失败:', err);
            wx.showToast({ title: '登录失败', icon: 'none' });
          });
        }
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },
  onShare(openid, res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: '家政服务小程序',
      imageUrl: '/img/placeholders/home_cleaning.png',
      path: '/pages/index/index?openid=' + openid
    }
  }
})
