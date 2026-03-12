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
    const category = this.data.activeTab;
    console.log(`[社区] 正在拉取分类 [${category}] 的帖子...`);
    
    // 使用相对路径，斜杠由 util 处理
    util.get("/posts", { 
      category: category,
      page: 1,
      limit: 20
    })
      .then(res => {
        const list = res.list || res;
        const userId = wx.getStorageSync('userId');
        const apiOrigin = 'http://114.55.167.14:3000'; // 补全图片所需的域名
        
        const processedPosts = (Array.isArray(list) ? list : []).map(post => {
            // 自动补全图片路径
            let images = post.images || [];
            if (typeof images === 'string') {
              try { images = JSON.parse(images); } catch(e) { images = []; }
            }
            images = images.map(src => src.startsWith('/') ? apiOrigin + src : src);

            // 处理作者信息
            const author = post.author || post.User || {};
            let avatar = author.avatar_url || author.avatar || '/img/placeholders/avatar_worker.png';
            if (avatar.startsWith('/uploads')) avatar = apiOrigin + avatar;

            return {
                ...post,
                author: {
                    nickname: author.nickname || '社区邻居',
                    avatar_url: avatar
                },
                images: images,
                isLiked: post.likes ? post.likes.some(l => l.user_id === userId) : false,
                createdAt: util.formatTime(new Date(post.createdAt))
            };
        });

        console.log(`[社区] 成功加载 ${processedPosts.length} 条动态`);
        this.setData({ posts: processedPosts });
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
        // 乐观更新 UI
        const posts = this.data.posts;
        const post = posts[index];
        
        if (res.status === 'liked' || res.action === 'liked') {
          post.isLiked = true;
          post.likes_count = (post.likes_count || 0) + 1;
        } else {
          post.isLiked = false;
          post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
        }

        this.setData({ [`posts[${index}]`]: post });
      })
      .catch(err => {
        console.error("点赞失败", err);
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
  },

  handleComment(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '发表评论',
      editable: true,
      placeholderText: '文明上网，理性发言...',
      success: (res) => {
        if (res.confirm && res.content) {
          util.post(`posts/${id}/comment`, { content: res.content })
            .then(commentData => {
              wx.showToast({ title: '评论成功', icon: 'success' });

              const posts = this.data.posts;
              const post = posts[index];
              if (!post.comments) post.comments = [];
              
              // 统一渲染格式
              post.comments.push({
                  ...commentData,
                  createdAt: '刚刚'
              });

              this.setData({ [`posts[${index}]`]: post });
            })
            .catch(err => {
              console.error("评论失败", err);
              wx.showToast({ title: '评论失败', icon: 'none' });
            });
        }
      }
    });
  }
});
