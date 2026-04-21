// pages/community/community.js
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const { imgUrl } = util;
const lp = require('../../utils/localPrefs.js');

Page({
  data: {
    navTopPadding: 20,
    communitySearchKeyword: "",
    tabs: ["热门话题", "热门活动", "邻里互动"],
    activeTab: "热门话题", // 默认改为第一个选项卡
    announcements: [
      { id: 'ann_1', title: '【公告】请友善交流，禁止发布违法与低俗内容' },
      { id: 'ann_2', title: '【提示】涉及交易请使用平台订单与聊天留痕' }
    ],
    posts: [],
    assistCards: [],
    commentPanel: {
      show: false,
      postId: null,
      postIndex: null,
      content: '',
      images: [],
      sending: false,
      keyboardHeight: 0
    }
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 8 });
    if (options && options.tab) {
      this.setData({ activeTab: decodeURIComponent(options.tab) });
    }
    this.syncAnnounceRead();
    this.fetchPosts();
  },
  syncAnnounceRead() {
    const readMap = lp.getAnnounceReadIds();
    const announcements = (this.data.announcements || []).map((a) =>
      Object.assign({}, a, { read: !!readMap[a.id] })
    );
    this.setData({ announcements });
  },
  readAllAnnouncements() {
    const ids = (this.data.announcements || []).map((a) => a.id);
    lp.markAllAnnounceRead(ids);
    this.syncAnnounceRead();
    wx.showToast({ title: '已全部标记已读', icon: 'none' });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    const app = getApp();
    if (app.globalData && app.globalData.communityTargetTab) {
      this.setData({ activeTab: app.globalData.communityTargetTab });
      app.globalData.communityTargetTab = '';
    }
    this.syncAnnounceRead();
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
        const apiOrigin = config.imageBaseUrl.replace(/\/$/, ''); // 与小程序合法域名、图片域名一致
        
        const processedPosts = (Array.isArray(list) ? list : []).map(post => {
            // 自动补全图片路径
            let images = post.images || [];
            if (typeof images === 'string') {
              try { images = JSON.parse(images); } catch(e) { images = []; }
            }
            images = images.map(src => src.startsWith('/') ? apiOrigin + src : src);

            // 处理作者信息
            const author = post.author || post.User || {};
            let avatar = author.avatar_url || author.avatar || imgUrl('/uploads/placeholders/avatar_worker.png');
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
        if (this.data.activeTab === '邻里互动') {
          this.fetchAssistFeed();
        }
      })
      .catch(err => {
        console.error("加载社区失败", err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        if (this.data.activeTab === '邻里互动') {
          this.fetchAssistFeed();
        }
      });
  },
  fetchAssistFeed() {
    util
      .get('neighbor-assist/orders/public', { page: 1, limit: 12 })
      .then((res) => {
        const list = res.list || res.items || res.data || res;
        const arr = Array.isArray(list) ? list : [];
        const assistCards = arr.map((x) => ({
          id: x.id,
          summary: (x.content || x.title || x.summary || '邻里帮帮').slice(0, 48),
          status: x.status_text || x.status || ''
        }));
        this.setData({ assistCards });
      })
      .catch(() => {
        this.setData({
          assistCards: [
            { id: 'demo1', summary: '【演示】代取快递：菜鸟至 3 栋', status: '待接单' },
            { id: 'demo2', summary: '【演示】帮忙遛狗 30 分钟', status: '待接单' }
          ]
        });
      });
  },

  goAssistDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const mock = String(id).indexOf('demo') === 0 ? '&mock=1' : '';
    wx.navigateTo({
      url: `/pages/neighbor-assist-order-detail/neighbor-assist-order-detail?id=${id}${mock}`
    });
  },

  goPublish() {
    wx.navigateTo({ url: '../order-publish/order-publish' });
  },

  goNewPost() {
    wx.navigateTo({ url: '../community-publish/community-publish' });
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
      if (this.data.activeTab === '邻里互动') {
        this.fetchAssistFeed();
      }
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
    this.setData({
      commentPanel: {
        show: true,
        postId: id,
        postIndex: index,
        content: '',
        images: [],
        sending: false,
        keyboardHeight: 0
      }
    });
  },

  closeCommentPanel() {
    this.setData({ 'commentPanel.show': false, 'commentPanel.keyboardHeight': 0 });
  },

  onCommentInput(e) {
    this.setData({ 'commentPanel.content': e.detail.value });
  },

  onCommentKeyboard(e) {
    this.setData({ 'commentPanel.keyboardHeight': e.detail.height || 0 });
  },

  addCommentImage() {
    const remain = 3 - this.data.commentPanel.images.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      success: (res) => {
        const newImgs = this.data.commentPanel.images.concat(
          res.tempFiles.map(f => f.tempFilePath)
        );
        this.setData({ 'commentPanel.images': newImgs });
      }
    });
  },

  delCommentImage(e) {
    const arr = [...this.data.commentPanel.images];
    arr.splice(e.currentTarget.dataset.idx, 1);
    this.setData({ 'commentPanel.images': arr });
  },

  previewCommentImage(e) {
    const idx = e.currentTarget.dataset.idx;
    wx.previewImage({
      current: this.data.commentPanel.images[idx],
      urls: this.data.commentPanel.images
    });
  },

  async submitComment() {
    const { content, images, postId, postIndex, sending } = this.data.commentPanel;
    if (sending) return;
    if (!content && images.length === 0) return wx.showToast({ title: '请输入评论内容', icon: 'none' });
    this.setData({ 'commentPanel.sending': true });

    try {
      // 先上传图片（如有），获取服务器 URL
      let imageUrls = [];
      for (const filePath of images) {
        const result = await util.uploadFile('upload', filePath, 'file', { type: 'comment' });
        const url = result.url || result.filePath || result;
        if (url) imageUrls.push(url);
      }

      const commentData = await util.post(`posts/${postId}/comment`, {
        content: content,
        image_urls: imageUrls
      });

      wx.showToast({ title: '评论成功', icon: 'success' });

      // 更新帖子评论数
      const posts = this.data.posts;
      const post = posts[postIndex];
      if (!post.comments) post.comments = [];
      post.comments.push({ ...commentData, createdAt: '刚刚' });
      this.setData({ [`posts[${postIndex}]`]: post });

      this.closeCommentPanel();
    } catch (err) {
      console.error('评论失败', err);
      wx.showToast({ title: '评论失败，请重试', icon: 'none' });
      this.setData({ 'commentPanel.sending': false });
    }
  }
});
