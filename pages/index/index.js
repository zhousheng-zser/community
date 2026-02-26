//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: {
    noOrderTip: "您还没有订单",
    showGetTelModal: false,
    userFlag: 0
  },
  onLoad: function (options) {
    console.log(options)
    let parentOpId = "";
    if (options) {
      if (options.openid) {
        parentOpId = options.openid
      } else if (options.scene) {
        parentOpId = decodeURIComponent(options.scene);
      }
      if (options.service) {
        wx.navigateTo({
          url: '../order-detail/order-detail?id=' + options.service,
        })
      } else if (options.book) {
        wx.navigateTo({
          url: '../book-detail/book-detail?id=' + options.book,
        })
      } else if (options.good) {
        wx.navigateTo({
          url: '../gorder-detail/gorder-detail?orderSn=' + options.good,
        })
      }
    }
    const that = this;
    app.save(parentOpId, that.init);
  },
  onShareAppMessage: function (res) {
    const openid = app.globalData.user.opId;
    return app.onShare(openid, res);
  },
  onPullDownRefresh() {
    this.init()
    wx.stopPullDownRefresh()
  },
  init() {
    const { id, userFlag, userMobile } = app.globalData.user || {};
    // 假数据填充
    const banner = [
      { imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80' },
      { imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80' }
    ];

    const goods = [
      {
        id: 1,
        remarkC: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
        goodsTitle: '金牌日常保洁 (2小时)',
        goodsSub: '专业团队，包含客厅、卧室、厨房、卫生间表面清洁，不含擦玻璃。',
        price: '99.00'
      },
      {
        id: 2,
        remarkC: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
        goodsTitle: '挂壁式空调深度清洗',
        goodsSub: '高温蒸汽杀菌，拆洗过滤网、导风板，去除异味。',
        price: '89.00'
      },
      {
        id: 3,
        remarkC: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
        goodsTitle: '家庭常驻保姆 (按月)',
        goodsSub: '负责三餐及家庭卫生，持证上岗，经验丰富。',
        price: '4500.00'
      },
      {
        id: 4,
        remarkC: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
        goodsTitle: '同城小面搬家',
        goodsSub: '适合单身公寓搬迁，含司机帮忙搬运，价格透明不坐地起价。',
        price: '150.00'
      }
    ];

    this.setData({ banner, goods });

    /* 原接口请求暂且注释
    util.get("api/wx/index").then((data) => {
      let { banner, goods, contnets, marketGoods}=data;
      contnets.forEach((v,i)=>{
        contnets[i].time = util.formatTime(new Date(v.createTime));
      })
      this.setData({ banner, goods, contnets, marketGoods });
    })
    */

    if (userFlag == 1) {
      util.post('api/order/all', {
        userFlag,
        id
      }).then((data) => {
        let list = [];
        data.forEach((v, i) => {
          if (new Date().getTime() - v.createTime > 1296000000) {
            return;
          }
          const { name } = util.stateTabel(v.orderState),
            time = util.formatTime(new Date(v.createTime));
          v.stateStr = name;
          v.time = time;
          list.push(v);
        })
        this.setData({ list, userFlag: 1 });
      }).catch(err => {
        // 请求失败时给予容错处理，防止抛错影响预览
        console.log("订单加载失败，可忽略", err);
      })
    }
  },
  chooseAdd() {
    wx.chooseAddress({
      success: function (res) {
        console.log(res.userName)
        console.log(res.postalCode)
        console.log(res.provinceName)
        console.log(res.cityName)
        console.log(res.countyName)
        console.log(res.detailInfo)
        console.log(res.nationalCode)
        console.log(res.telNumber)
      }
    })
  },
  goActivity(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../activity/activity?id=' + id,
    })
  },
  getPhoneNumber(e) {
    const { iv, encryptedData: decryptData } = e.detail;
    const { id, sessionKey } = app.globalData.user;
    util.post("/api/user_info/update", {
      id,
      sessionKey,
      iv,
      decryptData
    }).then((data) => {
      this.setData({ showGetTelModal: false });
      app.save();//更新globalData中存储的个人信息
    })
  }
})
