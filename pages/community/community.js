// pages/community/community.js
const util = require('../../utils/util.js');

Page({
  data: {
    navTopPadding: 20,
    communitySearchKeyword: "",
    tabs: ["热门话题", "热门活动", "邻里互动"],
    activeTab: "热门话题", // 默认改为第一个选项卡
    posts: []
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 8 });
    this.fetchPosts();
  },
  onShow() {
    this.fetchPosts(); // Handle returning from details/publish views
  },
  fetchPosts() {
    util.get("posts", { category: this.data.activeTab })
      .then(res => {
        // util.get 内部已经做了 resolve(data.data || data)，因此 res 直接是文章数组
        this.setData({ posts: Array.isArray(res) ? res : (res.data || []) });
      })
      .catch(err => {
        console.error("加载社区失败", err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
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
    this.setData({
      activeTab: e.currentTarget.dataset.tab,
      posts: [] // Clear immediately for better UX
    }, () => {
      this.fetchPosts();
    });
  },

  handleLike(e) {
    const { id, index } = e.currentTarget.dataset;
    util.post(`posts/${id}/like`)
      .then(res => {
        // Optimistic UI Update
        const posts = this.data.posts;
        if (!posts[index].likes) posts[index].likes = [];

        if (res.status === 'liked') {
          posts[index].likes.push({ id: wx.getStorageSync('userId') || 'mock' });
        } else {
          posts[index].likes.pop(); // Simplest optimistic pop
        }

        this.setData({ [`posts[${index}].likes`]: posts[index].likes });
      })
      .catch(err => {
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
  },

  handleComment(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '发表评论',
      editable: true,
      placeholderText: '说点什么吧...',
      success: (res) => {
        if (res.confirm && res.content) {
          util.post(`posts/${id}/comment`, { content: res.content })
            .then(data => {
              wx.showToast({ title: '评论成功', icon: 'success' });

              const posts = this.data.posts;
              if (!posts[index].comments) posts[index].comments = [];
              posts[index].comments.push(data); // Append returned comment

              this.setData({ [`posts[${index}].comments`]: posts[index].comments });
            })
            .catch(err => {
              wx.showToast({ title: '评论失败', icon: 'none' });
            });
        }
      }
    });
  }
});
