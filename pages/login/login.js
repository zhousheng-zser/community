const app = getApp();
const util = require('../../utils/util.js');
const rolePortals = require('../../utils/rolePortals.js');
const userSession = require('../../utils/userSession.js');
const browseFootprint = require('../../utils/browseFootprint.js');
const api = require('../../api/index.js');
const sessionReset = require('../../utils/sessionReset.js');
const communityBind = require('../../utils/communityBind.js');

Page({
  data: {
    phone: '',
    password: '',
    code: '',
    loginType: 'password', // 'password' or 'sms'
    smsCount: 0
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },
  switchTab(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ loginType: type, password: '', code: '' });
  },
  sendSms() {
    const { phone } = this.data;
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发送中' });
    api.auth.sendSmsCode({ phone, type: 'login' }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '发送成功' });
      this.setData({ smsCount: 60 });
      this.timer = setInterval(() => {
        if (this.data.smsCount <= 1) {
          clearInterval(this.timer);
          this.setData({ smsCount: 0 });
        } else {
          this.setData({ smsCount: this.data.smsCount - 1 });
        }
      }, 1000);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: this.getErrorMessage(err, '发送失败'), icon: 'none' });
    });
  },
  doLogin() {
    const { phone, password, code, loginType } = this.data;
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (loginType === 'password' && !password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (loginType === 'sms' && !code) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中' });
    
    const loginPromise = loginType === 'sms' 
      ? api.auth.smsLogin({ phone, code }) 
      : api.auth.accountLogin({ phone, password });

    loginPromise.then(data => {
      wx.hideLoading();
      this.handleLoginSuccess(data, loginType);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: this.getErrorMessage(err, '登录失败'), icon: 'none' });
    });
  },
  doWechatLogin(extraPayload = {}, failFallbackMsg = '一键登录失败') {
    wx.login({
      success: res => {
        if (!res.code) {
          wx.hideLoading();
          wx.showToast({ title: '微信登录凭证获取失败', icon: 'none' });
          return;
        }
        api.auth.wechatLogin(Object.assign({ code: res.code }, extraPayload)).then(data => {
          wx.hideLoading();
          this.handleLoginSuccess(data, 'wechat');
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: this.getErrorMessage(err, failFallbackMsg), icon: 'none' });
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },
  getErrorMessage(err, fallback = '请求失败') {
    if (!err) return fallback;
    return err.errmsg || err.msg || err.message || err.error || fallback;
  },
  quickLogin(e) {
    console.log('快捷登录触发:', e && e.detail ? e.detail : {});
    // 当前测试模式：统一走 wx.login + /auth/login
    // 若未来恢复手机号快捷授权，再根据 e.detail.errMsg 分支处理即可。
    wx.showLoading({ title: '快捷登录中' });
    this.doWechatLogin({}, '微信快捷登录失败');
  },
  handleLoginSuccess(data, channel) {
    sessionReset.clearAllUserSession();
    wx.removeStorageSync('manual_logged_out');
    const loginChannel = channel === 'sms' || channel === 'password' || channel === 'wechat' ? channel : 'wechat';
    wx.setStorageSync('login_channel', loginChannel);
    if (loginChannel === 'sms' || loginChannel === 'password') {
      wx.setStorageSync('login_via_phone', '1');
    } else {
      wx.removeStorageSync('login_via_phone');
    }
    wx.setStorageSync('token', data.token);
    const u = data.user || {};
    if (u.id != null) userSession.rememberUserId(u.id);
    app.globalData.user = rolePortals.mergePortalFlags({
      id: u.id,
      opId: u.openid,
      userName: u.nickname || '微信用户',
      userPhoto: u.avatar_url || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      realName: u.real_name || u.realName || '',
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
      steward_status: u.steward_status != null ? u.steward_status : u.stewardStatus,
      service_provider_status: u.service_provider_status != null ? u.service_provider_status : u.serviceProviderStatus,
      communityId: u.community_id != null ? u.community_id : u.communityId,
      points: u.points,
      userState: 0,
      remark2: 2,
      vipFlag: 0
    }, u);
    const cid = u.community_id != null ? u.community_id : u.communityId;
    if (cid != null) communityBind.applyBoundCommunityToApp(app, cid, u.community_name || '');
    browseFootprint.syncLocalToServer();
    const isNewUser = !!(data && (data.is_new_user || data.isNewUser));
    wx.showToast({ title: isNewUser ? '注册成功' : '登录成功' });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    }, 1500);
  },
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
