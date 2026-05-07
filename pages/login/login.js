const app = getApp();
const util = require('../../utils/util.js');
const rolePortals = require('../../utils/rolePortals.js');
const api = require('../../api/index.js');

Page({
  data: {
    phone: '',
    password: ''
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  doLogin() {
    const { phone, password } = this.data;
    if (!phone || !password) {
      wx.showToast({ title: '请输入手机号和密码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中' });
    api.auth.accountLogin({ phone, password }).then(data => {
      wx.hideLoading();
      this.handleLoginSuccess(data);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: this.getErrorMessage(err, '登录失败'), icon: 'none' });
    });
  },
  doWechatLogin(extraPayload = {}, failFallbackMsg = '快捷登录失败') {
    wx.login({
      success: res => {
        if (!res.code) {
          wx.hideLoading();
          wx.showToast({ title: '微信登录凭证获取失败', icon: 'none' });
          return;
        }
        api.auth.wechatLogin(Object.assign({ code: res.code }, extraPayload)).then(data => {
          wx.hideLoading();
          this.handleLoginSuccess(data);
        }).catch(err => {
          this.tryTestAccountLogin(this.getErrorMessage(err, failFallbackMsg));
        });
      },
      fail: () => {
        this.tryTestAccountLogin('微信登录失败');
      }
    });
  },
  tryTestAccountLogin(prevMsg = '') {
    // 应急兜底：用于开发联调阶段快速进入系统测试业务功能
    const phone = `199${String(Date.now()).slice(-8)}`;
    const password = '123456';
    const afterFail = () => {
      wx.hideLoading();
      wx.showToast({ title: prevMsg || '请求失败', icon: 'none' });
    };
    api.auth.register({ phone, code: '024680', password }).then(data => {
      wx.hideLoading();
      wx.showToast({ title: '已进入测试账号', icon: 'none' });
      this.handleLoginSuccess(data);
    }).catch(() => {
      api.auth.accountLogin({ phone, password }).then(data => {
        wx.hideLoading();
        wx.showToast({ title: '已进入测试账号', icon: 'none' });
        this.handleLoginSuccess(data);
      }).catch(afterFail);
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
  handleLoginSuccess(data) {
    wx.removeStorageSync('manual_logged_out');
    wx.setStorageSync('token', data.token);
    const u = data.user || {};
    app.globalData.user = rolePortals.mergePortalFlags({
      id: u.id,
      opId: u.openid,
      userName: u.nickname || '微信用户',
      userPhoto: u.avatar_url || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      realName: u.real_name || u.realName || '',
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
    wx.showToast({ title: '登录成功' });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    }, 1500);
  },
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
