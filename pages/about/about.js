// pages/about/about.js
Page({
  data: {
    features: [
      { name: '社区服务预约', desc: '家政、维修、保洁一键上门', emoji: '🔧', bg: 'linear-gradient(135deg,#dff0ff,#c8e4ff)' },
      { name: '邻里生活圈', desc: '发帖互动、参与活动、共建社区', emoji: '💬', bg: 'linear-gradient(135deg,#ffe5ea,#ffd3dc)' },
      { name: '家集市商城', desc: '周边优质商家，好货近在身边', emoji: '🛒', bg: 'linear-gradient(135deg,#fff0d7,#ffe2bd)' },
      { name: '技工入驻', desc: '发挥一技之长，灵活接单赚钱', emoji: '👷', bg: 'linear-gradient(135deg,#dff7ef,#c9f0e0)' },
      { name: '推客系统', desc: '分享好物好服务，轻松获得收益', emoji: '🤝', bg: 'linear-gradient(135deg,#f3e7ff,#e6d5ff)' }
    ],
    contacts: [
      { label: '客服热线', value: '400-000-0000', type: 'phone' },
      { label: '商务合作', value: 'business@jiashi.com', type: 'email' },
      { label: '官方公众号', value: '家事速配服务号', type: 'text' },
      { label: '总部地址', value: '中国·杭州', type: 'text' }
    ]
  },

  handleContact(e) {
    const { type, value } = e.currentTarget.dataset;
    if (type === 'phone') {
      wx.makePhoneCall({ phoneNumber: value });
    } else if (type === 'email') {
      wx.setClipboardData({
        data: value,
        success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' })
      });
    }
  },

  goPrivacy() {
    wx.showToast({ title: '隐私政策完善中', icon: 'none' });
  },

  goTerms() {
    wx.showToast({ title: '服务协议完善中', icon: 'none' });
  },

  goLicense() {
    wx.showToast({ title: '第三方SDK说明完善中', icon: 'none' });
  }
});
