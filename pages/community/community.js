// pages/community/community.js
Page({
    data: {
    navTopPadding: 20,
    communitySearchKeyword: "",
    tabs: ["热门话题", "热门活动", "邻里互动"],
    activeTab: "热门活动",
        posts: [
            {
        id: "1",
        name: "微信用户",
        time: "2026-01-02 15:42:30",
        title: "未来",
        desc: "未来可期",
        read: 1,
        comment: 0,
        like: 0
            },
            {
        id: "2",
        name: "微信用户",
        time: "2026-01-02 14:58:02",
        title: "你好",
        desc: "你好啊",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
        read: 1,
        comment: 0,
        like: 0
      },
      {
        id: "3",
        name: "微信用户",
        time: "2025-05-31 17:24:41",
        title: "",
        desc: "",
        read: 11,
        comment: 0,
        like: 0
      }
    ]
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 8 });
    },
  handleLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        wx.showToast({
          title: res.name ? "已定位到" + res.name : "定位已更新",
          icon: "none"
        });
      },
      fail: () => {
        wx.showToast({
          title: "未获取到定位",
          icon: "none"
        });
      }
    });
  },
  onCommunitySearchInput(e) {
    this.setData({ communitySearchKeyword: e.detail.value });
  },
  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    }
});
