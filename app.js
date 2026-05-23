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
    communityTargetTab: '',
    cartRevision: 0
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
      userMobile: u.phone || '',
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

    wx.login({
      success: (res) => {
        if (!res.code) {
          if (callback) callback();
          return;
        }

        const token = wx.getStorageSync('token');
        if (token) {
          util.post('auth/verify-wechat', { code: res.code }).then(() => {
            wx.removeStorageSync('manual_logged_out');
            wx.removeStorageSync('login_via_phone');
            this._fetchAndApplyProfile(callback);
          }).catch((err) => {
            const msg = (err && (err.errmsg || err.msg || err.message)) || '';
            const viaPhone = !!wx.getStorageSync('login_via_phone');
            // 手机号/密码登录不要求与本机微信 openid 一致，勿被静默微信登录覆盖成另一账号
            if (viaPhone || /微信与登录账号不一致/.test(msg)) {
              console.warn('[save] verify-wechat 跳过，按 token 拉 profile', msg);
              wx.removeStorageSync('login_via_phone');
              this._fetchAndApplyProfile(callback);
              return;
            }
            console.warn('[save] verify-wechat 失败，尝试微信静默登录', err);
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
