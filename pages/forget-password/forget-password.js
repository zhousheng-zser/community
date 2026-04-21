const util = require('../../utils/util.js');

Page({
  data: {
    phone: '',
    code: '',
    password: '',
    confirmPassword: '',
    smsCount: 0
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  sendSms() {
    const { phone } = this.data;
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发送中' });
    util.post('api/auth/sms/send', { phone, type: 'forget_password' }).then(() => {
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

  doReset() {
    const { phone, code, password, confirmPassword } = this.data;
    if (!phone || !code || !password || !confirmPassword) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中' });
    util.post('api/auth/password_reset', {
      phone,
      code,
      new_password: password
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '密码修改成功' });
      setTimeout(() => {
        wx.navigateBack(); // 返回登录页
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.errmsg || '修改失败', icon: 'none' });
    });
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  }
});
