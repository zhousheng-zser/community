//app.js
const util = require('utils/util.js');
App({
  onLaunch: function (query) {

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
              userState: 0,
              remark2: 2, // 默认审核通过，方便测试
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
