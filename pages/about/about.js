// pages/about/about.js
Page({
  data: {
    features: [
      { name: '首页生活服务', desc: '家政清洁、家修急事、家电清洗等服务快速触达', emoji: '🏠', bg: 'linear-gradient(135deg,#dff0ff,#c8e4ff)' },
      { name: '本地好物', desc: '每日上新、热销榜单与模块化推荐，支持商品详情查看', emoji: '🛍️', bg: 'linear-gradient(135deg,#ffe5ea,#ffd3dc)' },
      { name: '本地集市', desc: '按定位展示附近店铺与商品，支持距离优先与综合排序', emoji: '📍', bg: 'linear-gradient(135deg,#fff0d7,#ffe2bd)' },
      { name: '惠民卡联盟', desc: '聚合京东、拼多多等联盟商品入口，便于分享与转化', emoji: '🎫', bg: 'linear-gradient(135deg,#dff7ef,#c9f0e0)' },
      { name: '社区互动', desc: '支持帖子、活动与个人中心管理，连接邻里生活场景', emoji: '🤝', bg: 'linear-gradient(135deg,#f3e7ff,#e6d5ff)' }
    ],
    contacts: [
      { label: '客服热线', value: '400-762-4189', type: 'phone' },
      { label: '商务合作', value: 'bd@communityhub.cn', type: 'email' },
      { label: '官方公众号', value: '社区生活服务号', type: 'text' },
      { label: '运营中心', value: '中国·成都高新区', type: 'text' }
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
