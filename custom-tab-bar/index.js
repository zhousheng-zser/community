const app = getApp();

Component({
  data: {
    selected: 0,
    color: "#8d8d8d",
    selectedColor: "#e64340",
    list: [
      {
        pagePath: "/pages/index/index",
        iconPath: "/img/home-0.png",
        selectedIconPath: "/img/home-1.png",
        text: "首页"
      },
      {
        pagePath: "/pages/community/community",
        iconPath: "/img/shop-0.png",
        selectedIconPath: "/img/shop-1.png",
        text: "社区"
      },
      {
        isPublish: true, // 标记为中间特殊的大按钮
        pagePath: "/pages/order-publish/order-publish",
        iconPath: "",
        selectedIconPath: "",
        text: "一键发布"
      },
      {
        pagePath: "/pages/message/message",
        iconPath: "/img/order-0.png",
        selectedIconPath: "/img/order-1.png",
        text: "消息"
      },
      {
        pagePath: "/pages/user/user",
        iconPath: "/img/user-0.png",
        selectedIconPath: "/img/user-1.png",
        text: "我的"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 如果是一键发布按钮，则跳转至发布页面（不在 tabBar 栈内）
      if (data.isPublish) {
        wx.navigateTo({ url });
        return;
      }
      
      wx.switchTab({ url });
    }
  }
});
