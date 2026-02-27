// pages/classify/classify.js
const app = getApp()
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // menus:[],
    // items:[],
    activeIndex: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 假数据：分类左侧菜单
    const menus = [
      { id: 1, clfcName: '日常保洁' },
      { id: 2, clfcName: '家电清洗' },
      { id: 3, clfcName: '维修服务' },
      { id: 4, clfcName: '月嫂育儿' }
    ];
    // 假数据：全部商品/服务池
    const allItems = {
      1: [
        { id: 11, goodsTitle: '金牌日常保洁(2小时)', goodsSub: '专业团队，包含客厅、卧室等表面清洁', goodsPrice: '99.00', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80' },
        { id: 12, goodsTitle: '深度开荒保洁(100平)', goodsSub: '适合新房装修后，全方位不留死角', goodsPrice: '499.00', imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=200&q=80' }
      ],
      2: [
        { id: 21, goodsTitle: '挂壁式空调清洗', goodsSub: '高温蒸汽杀菌，除异味', goodsPrice: '89.00', imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&q=80' }
      ],
      3: [
        { id: 31, goodsTitle: '下水管道疏通', goodsSub: '专业设备，不通不收费', goodsPrice: '120.00', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&q=80' },
        { id: 32, goodsTitle: '灯具卫浴安装', goodsSub: '专业师傅上门，安全可靠', goodsPrice: '60.00', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80' }
      ],
      4: [] // 模拟空数据
    };

    // 存入 data 供后续点击切换使用
    this.setData({
      menus: menus,
      allItems: allItems,
      items: allItems[1] // 默认展示第一个分类
    });

    /* 原接口请求
    util.get('api/wx/allkind').then((data)=>{
      this.setData({menus: data })
      util.get('/api/wx/pro/' + data[0].id).then((data) => {
        this.setData({ items: data })
      })
    })
    */
  },
  onShareAppMessage: function (res) {
    const openid = app.globalData.user.opId;
    return app.onShare(openid, res);
  },
  goService(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../service/service?id=' + id
    })
  },
  setCurrentActive(e) {
    const activeIndex = e.currentTarget.dataset.index,
      id = this.data.menus[activeIndex].id;

    // 直接从本地假数据读取
    const items = this.data.allItems[id] || [];
    this.setData({ items: items, activeIndex: activeIndex });

    /* 原接口请求
    util.get('/api/wx/pro/' + id).then((data) => {
      console.log(data)
      this.setData({ items: data, activeIndex })
    })
    */
  }
})