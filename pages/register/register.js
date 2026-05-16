const app = getApp();
const util = require('../../utils/util.js');
const rolePortals = require('../../utils/rolePortals.js');

Page({
  data: {
    phone: '',
    code: '',
    password: '',
    confirmPassword: '',
    address: '',
    latitude: '',
    longitude: '',
    agreed: false,
    smsCount: 0
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          address: res.address + res.name,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('auth') > -1) {
          wx.showToast({ title: '请授权地理位置', icon: 'none' });
        }
      }
    });
  },

  sendSms() {
    const { phone } = this.data;
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发送中' });
    util.post('auth/sms/send', { phone, type: 'register' }).then(() => {
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
      wx.showToast({ title: err.errmsg || '发送失败', icon: 'none' });
    });
  },

  viewAgreement() {
    // 假设跳转到一个富文本协议展示页或弹窗
    wx.showModal({
      title: '用户注册协议',
      content: '正在通过 api/config/registration_agreement 获取后台协议内容...',
      showCancel: false
    });
  },

  doRegister() {
    const { phone, code, password, confirmPassword, address, latitude, longitude, agreed } = this.data;
    if (!phone || !code || !password || !confirmPassword || !address) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (!agreed) {
      wx.showToast({ title: '请阅读并同意用户协议', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '获取微信授权中' });
    wx.login({
      success: (res) => {
        if (!res.code) {
          wx.hideLoading();
          wx.showToast({ title: '微信授权失败', icon: 'none' });
          return;
        }

        wx.showLoading({ title: '注册中' });
        util.post('auth/register', {
          phone,
          sms_code: code,
          password,
          wx_code: res.code,
          address,
          lat: latitude,
          lng: longitude
        }).then(data => {
          wx.hideLoading();
          wx.showToast({ title: '注册成功' });
          // 注册成功后拿到了 Token 进入登录态
          wx.setStorageSync('token', data.token || data.data?.token);
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1500);
        }).catch(err => {
          wx.hideLoading();
          if (err && err.code === 409) {
            wx.showModal({
              title: '提示',
              content: err.msg || err.errmsg || '该账号或微信已注册',
              showCancel: false
            });
          } else {
            wx.showToast({ title: err.errmsg || err.msg || '注册失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信授权失败', icon: 'none' });
      }
    });
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  }
});
