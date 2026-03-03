// pages/community/community.js
Page({
  data: {
    navTopPadding: 20,
    communitySearchKeyword: "",
    tabs: ["鐑棬璇濋", "鐑棬娲诲姩", "閭婚噷浜掑姩"],
    activeTab: "鐑棬娲诲姩",
    posts: [
      {
        id: "1",
        name: "寰俊鐢ㄦ埛",
        time: "2026-01-02 15:42:30",
        title: "鏈潵",
        desc: "鏈潵鍙湡",
        read: 1,
        comment: 0,
        like: 0
      },
      {
        id: "2",
        name: "寰俊鐢ㄦ埛",
        time: "2026-01-02 14:58:02",
        title: "浣犲ソ",
        desc: "浣犲ソ鍟?,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
        read: 1,
        comment: 0,
        like: 0
      },
      {
        id: "3",
        name: "寰俊鐢ㄦ埛",
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
          title: res.name ? "宸插畾浣嶅埌" + res.name : "瀹氫綅宸叉洿鏂?,
          icon: "none"
        });
      },
      fail: () => {
        wx.showToast({
          title: "鏈幏鍙栧埌瀹氫綅",
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
