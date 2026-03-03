// pages/user/user.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    vipFlagMap: ["普通用户","VIP用户","零工","工长","金牌师傅","派单员"],
    stateList: ['空闲', '忙碌', '下班'],
    currentState: 0,
    points: 0,
    couponCount: 0,
    account: { totalAcount: 0 },
    orderMenus: [
      { name: "服务产品订单", icon: "/img/user/user-1-1.png", iconBg: "linear-gradient(180deg,#ffe5ea,#ffd3dc)", url: "../book-my/book-my" },
      { name: "一键发布订单", icon: "/img/user/user-1-2.png", iconBg: "linear-gradient(180deg,#ffeccd,#ffe0b2)" },
      { name: "家集市订单", icon: "/img/user/user-2-2.png", iconBg: "linear-gradient(180deg,#dff0ff,#c8e4ff)" },
      { name: "福卡订单", icon: "/img/user/user-2-2.png", iconBg: "linear-gradient(180deg,#f3e7ff,#e6d5ff)" },
      { name: "推客订单", icon: "/img/user/user-2-2.png", iconBg: "linear-gradient(180deg,#dff7ef,#c9f0e0)" },
      { name: "组合订单套餐", icon: "/img/user/user-book.png", iconBg: "linear-gradient(180deg,#fff4d9,#ffe7b8)" }
    ],
    communityMenus: [
      { name: "我的帖子", icon: "/img/user/user-1-1.png", iconBg: "linear-gradient(180deg,#ffe5ea,#ffd3dc)" },
      { name: "我的关注", icon: "/img/user/user-2-3.png", iconBg: "linear-gradient(180deg,#fff0d7,#ffe2bd)" },
      { name: "我的点赞", icon: "/img/user/user-2-2.png", iconBg: "linear-gradient(180deg,#dff0ff,#c8e4ff)" },
      { name: "参与话题", icon: "/img/user/user-2-1.png", iconBg: "linear-gradient(180deg,#fff7d8,#ffedb8)" },
      { name: "参与活动", icon: "/img/user/user-3-1.png", iconBg: "linear-gradient(180deg,#e7ecff,#d9e1ff)" },
      { name: "活动管理", icon: "/img/user/user-3-1.png", iconBg: "linear-gradient(180deg,#e2f8ee,#cbf0e0)" },
      { name: "诉求列表", icon: "/img/user/user-1-3.png", iconBg: "linear-gradient(180deg,#fff0dc,#ffe2c5)" }
    ],
    joinMenus: [
      { name: "技工入驻", sub: "用技能闲置赚钱", icon: "/img/user/user-2-2.png", iconBg: "linear-gradient(180deg,#dff0ff,#c8e4ff)" },
      { name: "家集市商家入驻", sub: "附近商家入驻申请", icon: "/img/user/user-cart.png", iconBg: "linear-gradient(180deg,#fff0d7,#ffe2bd)" },
      { name: "服务商入驻", sub: "提供专业到家服务", icon: "/img/user/user-2-2.png", iconBg: "linear-gradient(180deg,#e7ecff,#d9e1ff)" }
    ],
    serviceMenus: [
      { name: "帮助反馈", icon: "/img/user/user-1-3.png", iconBg: "linear-gradient(180deg,#dff0ff,#c8e4ff)" },
      { name: "在线小区管家", icon: "/img/user/user-2-3.png", iconBg: "linear-gradient(180deg,#fff0dc,#ffe2c5)" },
      { name: "关于我们", icon: "/img/user/user-1-2.png", iconBg: "linear-gradient(180deg,#ffe5ea,#ffd3dc)" },
      { name: "地址管理", icon: "/img/user/user-2-1.png", iconBg: "linear-gradient(180deg,#e7ecff,#d9e1ff)" },
      { name: "平台客服", icon: "/img/user/user-3-1.png", iconBg: "linear-gradient(180deg,#fff7d8,#ffedb8)" },
      { name: "设置", icon: "/img/user/user-1-1.png", iconBg: "linear-gradient(180deg,#e2f8ee,#cbf0e0)" }
    ]
  },
  onLoad: function (options) {

  },
  onShow() {
    let user = app.globalData.user || {},
      auditTip = "";
    const { remark2: auditStatus } = user;
    if (auditStatus == 1) {
      auditTip = "审核中";
    } else if (auditStatus == 2) {
      auditTip = "审核通过";
    } else if (auditStatus == 3) {
      auditTip = "审核被拒绝";
    }
    const mobile = user.userMobile || "";
    if (mobile.length >= 11) {
      user.tel = mobile.slice(0, 3) + "******" + mobile.slice(7, 11);
    } else {
      user.tel = "";
    }
    this.setData({
      user,
      auditTip,
      currentState: user.userState || 0,
      points: user.points || 0
    })
    this.getMyCoupon();
    this.getAccount();    
  },
  getAccount() {
    const userId = (app.globalData.user || {}).id;
    if (!userId) return;
    util.get("api/acount/info", {
      userId
    }).then((data) => {
      console.log(data);
      this.setData({
        account: data
      })
    })
  },
  getMyCoupon(){
    const userId = (this.data.user || {}).id;
    if (!userId) return;
    util.get(`api/wx/user/coupon/${userId}`).then((data)=>{
      console.log(typeof data);
      this.setData({
        couponCount:data.length
      })
    })
  },
  onShareAppMessage: function (res) {
    const openid = app.globalData.user.opId;
    return app.onShare(openid, res);
  },
  goAddress() {
    wx.navigateTo({
      url: '../address/address',
    })
  },
  goAccount() {
    wx.navigateTo({
      url: '../account/account',
    })
  },
  goRecomm() {
    wx.navigateTo({
      url: '../recomm/recomm',
    })
  },
  goAudit() {
    const { remark2: auditStatus } = app.globalData.user;
    console.log(auditStatus)
    if (auditStatus == 1 || auditStatus == 2) { return; }
    wx.navigateTo({
      url: '../audit/audit',
    })
  },
  goDispatch() {
    wx.navigateTo({
      url: '../dispatch/dispatch',
    })
  },
  showActionSheet() {
    const that = this,
      itemList = that.data.stateList;
    wx.showActionSheet({
      itemList,
      success: function (res) {
        const index = res.tapIndex;
        if (index == that.data.currentState) {
          return;
        }
        that.changeState(index);
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })
  },
  share(){
    wx.showShareMenu();
  },
  changeState(userState) {
    util.post("api/user_info/update", {
      id: this.data.user.id,
      userState
    }).then((data) => {
      this.setData({
        currentState: userState
      })
      app.save();
    })
  }

})
