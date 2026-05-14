//app.js
const util = require('utils/util.js');
const rolePortals = require('utils/rolePortals.js');
const env = require('utils/env.js');
App({
  onLaunch: function (query) {
    env.init();
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
    } catch (e) { }
  },
  globalData: {
    userInfo: null,
    user: null,
    communityTargetTab: ''
  },
  // 核心登录保存函数
  save(parentOpenid, callback) {
    if (wx.getStorageSync('manual_logged_out')) {
      if (callback) { callback(); }
      return;
    }

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
            const u = data.user;
            this.globalData.user = rolePortals.mergePortalFlags({
              id: u.id,
              opId: u.openid,
              userName: u.nickname || '微信用户',
              userPhoto: u.avatar_url || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
              userMobile: u.phone || '13800000000',
              userAddress: u.address || '',
              userBankNum: u.bank_num || '',
              userWxId: u.wx_id || '',
              role: u.role || 'user',
              roles: u.roles,
              worker_status: u.worker_status != null ? u.worker_status : u.workerStatus,
              merchant_status: u.merchant_status != null ? u.merchant_status : u.merchantStatus,
              shop_id: u.shop_id != null ? u.shop_id : u.shopId,
              shop_status: u.shop_status != null ? u.shop_status : u.shopStatus,
              communityId: u.community_id != null ? u.community_id : u.communityId,
              points: u.points,
              userState: 0,
              remark2: 2,
              vipFlag: 0
            }, u);

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
      imageUrl: 'https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png',
      path: '/pages/index/index?openid=' + openid
    }
  }
})
