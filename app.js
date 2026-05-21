//app.js
const util = require('utils/util.js');
const rolePortals = require('utils/rolePortals.js');
const userSession = require('utils/userSession.js');
const sessionReset = require('utils/sessionReset.js');
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
  _applyProfileFromApi(u, callback) {
    if (!u) {
      if (callback) callback();
      return;
    }
    if (u.id != null) userSession.rememberUserId(u.id);
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
    const cid = u.community_id != null ? u.community_id : u.communityId;
    if (cid != null && cid !== '') {
      try { wx.setStorageSync('user_community_id', String(cid)); } catch (e) { /* ignore */ }
    }
    if (callback) callback();
  },
  _fetchAndApplyProfile(callback) {
    util.get('/user/profile').then((data) => {
      this._applyProfileFromApi(data, callback);
    }).catch(() => {
      sessionReset.clearAllUserSession();
      this.globalData.user = null;
      if (callback) callback();
    });
  },
  _silentWechatLogin(code, parentOpenid, callback, showLoading) {
    if (showLoading) {
      wx.showLoading({ title: '正在登录' });
    }
    const payload = { code };
    if (parentOpenid) payload.inviter_openid = String(parentOpenid).trim();
    util.post('auth/login', payload).then((data) => {
      if (showLoading) wx.hideLoading();
      wx.removeStorageSync('manual_logged_out');
      wx.setStorageSync('login_channel', 'wechat');
      wx.setStorageSync('token', data.token);
      this._applyProfileFromApi(data.user, callback);
    }).catch((err) => {
      if (showLoading) wx.hideLoading();
      console.error('登录对接失败:', err);
      if (showLoading) {
        wx.showToast({ title: '登录失败', icon: 'none' });
      }
      if (callback) callback();
    });
  },
  // 核心登录保存函数
  save(parentOpenid, callback) {
    if (wx.getStorageSync('manual_logged_out')) {
      if (callback) { callback(); }
      return;
    }

    const token = wx.getStorageSync('token');
    const channel = wx.getStorageSync('login_channel');
    // 手机号/密码登录不要求与当前微信 openid 一致，避免 verify 失败后静默切回微信账号
    if (token && (channel === 'sms' || channel === 'password')) {
      this._fetchAndApplyProfile(callback);
      return;
    }

    wx.login({
      success: (res) => {
        if (!res.code) {
          if (callback) callback();
          return;
        }

        if (token) {
          util.post('auth/verify-wechat', { code: res.code }).then(() => {
            wx.removeStorageSync('manual_logged_out');
            this._fetchAndApplyProfile(callback);
          }).catch((err) => {
            console.warn('[save] 当前微信与登录 token 不一致，清除旧会话', err);
            sessionReset.clearAllUserSession();
            this.globalData.user = null;
            this._silentWechatLogin(res.code, parentOpenid, callback, false);
          });
          return;
        }

        this._silentWechatLogin(res.code, parentOpenid, callback, true);
      },
      fail: () => {
        if (callback) callback();
      }
    });
  },
  onShare(openid, res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: '家政服务小程序',
      imageUrl: 'https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png',
      path: '/pages/index/index?openid=' + openid
    }
  }
})
