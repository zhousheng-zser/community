const app = getApp();
const util = require('../../utils/util.js');
const rolePortals = require('../../utils/rolePortals.js');

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
    util.post("auth/login_password", { phone, password }).then(data => {
      wx.hideLoading();
      this.handleLoginSuccess(data);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.errmsg || '登录失败', icon: 'none' });
    });
  },
  quickLogin(e) {
    console.log('getPhoneNumber 返回结果:', e.detail);
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      let msg = '已取消授权';
      if (e.detail.errMsg.includes('no permission')) {
        msg = '当前小程序无获取手机号权限(必须为企业认证账号)';
      } else if (e.detail.errMsg !== 'getPhoneNumber:fail user deny') {
        msg = '失败: ' + e.detail.errMsg;
      }
      wx.showToast({ title: msg, icon: 'none', duration: 3000 });
      return;
    }
    wx.showLoading({ title: '快捷登录中' });
    // 微信快捷登录
    wx.login({
      success: res => {
        util.post("auth/login_quick", {
          code: res.code, // wx.login 拿到的 code，或者直接传 phone_code
          phone_code: e.detail.code
        }).then(data => {
          wx.hideLoading();
          this.handleLoginSuccess(data);
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: err.errmsg || '快捷登录失败', icon: 'none' });
        });
      }
    });
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
      // 通过跳转或者reLaunch回之前的网页
      // wx.navigateBack(); 或者回首页
      wx.reLaunch({ url: '/pages/index/index' });
    }, 1500);
  },
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
