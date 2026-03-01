// pages/user-edit/uesr-edit.js
const app = getApp();
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      user: app.globalData.user,
      tempAvatarUrl: ''
    })
    this.getAudit();
  },
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    console.log('微信头像选择成功，临时路径为:', avatarUrl);

    if (avatarUrl) {
      // 确保界面刷新
      this.setData({
        "user.userPhoto": avatarUrl,
        tempAvatarUrl: avatarUrl
      });
    }
  },
  onAvatarError(e) {
    console.error('头像图片加载失败:', e.detail.errMsg);
  },
  getAudit() {
    if (!app.globalData.user) return;
    const { id } = app.globalData.user;
    util.get('api/user_certi/info/' + id).then((data) => {
      console.log('获取审核信息:', data);
      this.setData({
        audit: data
      })
    })
  },
  formSubmit: function (e) {
    const { userName: nickname, userMobile: phone, userAddress, userBankNum, userWxId } = e.detail.value;
    const { tempAvatarUrl } = this.data;

    if (!nickname) {
      return wx.showToast({ title: '请填写昵称', icon: 'none' });
    }

    wx.showLoading({ title: '正在保存', mask: true });

    // 统一调用更新接口
    let promise;
    if (tempAvatarUrl) {
      // 如果有新头像，走文件上传
      promise = util.uploadFile("user/profile", tempAvatarUrl, 'avatar', {
        nickname,
        phone,
        address: userAddress,
        bank_num: userBankNum,
        wx_id: userWxId
      });
    } else {
      // 否则走普通 POST
      promise = util.post("user/profile", {
        nickname,
        phone,
        address: userAddress,
        bank_num: userBankNum,
        wx_id: userWxId
      });
    }

    promise.then((res) => {
      console.log('资料同步成功:', res);
      // 资料同步成功后，直接重新加载用户信息并返回
      app.save("", () => {
        wx.hideLoading();
        wx.showToast({ title: '保存成功' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('保存失败:', err);
      // 如果是后端返回的错误信息，弹出来
      const msg = err.errmsg || err.error || '保存失败';
      wx.showToast({ title: msg, icon: 'none' });
    });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
