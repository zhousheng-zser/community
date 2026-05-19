const util = require('../../../utils/util.js');
const config = require('../../../utils/config.js');
const { imgUrl } = util;
const { asId, sameId } = require('../../../utils/snowflakeId.js');

Page({
  data: {
    postId: '',
    post: null,
    loading: true,
    commentText: '',
    submitting: false
  },

  onLoad(options) {
    const id = options.id || options.postId;
    if (!id) {
      wx.showToast({ title: '帖子不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({ postId: String(id) });
    this.loadPost();
  },

  onPullDownRefresh() {
    this.loadPost().finally(() => wx.stopPullDownRefresh());
  },

  loadPost() {
    this.setData({ loading: true });
    let communityId = '';
    try {
      communityId = wx.getStorageSync('user_community_id') || '';
    } catch (e) { /* ignore */ }
    const app = getApp();
    const user = (app.globalData && app.globalData.user) || {};
    if (!communityId) {
      communityId = user.communityId != null ? user.communityId : (user.community_id || '');
    }
    const query = {};
    if (communityId !== '' && communityId != null) query.community_id = communityId;

    return util.get(`posts/${this.data.postId}`, query)
      .then((res) => {
        const raw = res && res.id != null ? res : (res && res.data) || res;
        if (!raw || raw.id == null) {
          throw new Error('empty');
        }
        const post = this.normalizePost(raw);
        this.setData({ post, loading: false });
        if (post.category) {
          wx.setNavigationBarTitle({ title: post.category });
        }
      })
      .catch((err) => {
        this.setData({ loading: false, post: null });
        const errno = err && (err.errno || err.code);
        if (errno === 401) {
          wx.showToast({ title: '请先登录', icon: 'none' });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      });
  },

  normalizePost(post) {
    const app = getApp();
    const uid = asId((app.globalData && app.globalData.user) || {}).id);
    const apiOrigin = config.imageBaseUrl.replace(/\/$/, '');

    let images = post.images || [];
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch (e) { images = []; }
    }
    images = (Array.isArray(images) ? images : []).map((src) => {
      if (!src) return '';
      return String(src).startsWith('http') ? src : (String(src).startsWith('/') ? apiOrigin + src : imgUrl(src));
    }).filter(Boolean);

    const author = post.author || post.User || {};
    let avatar = author.avatar_url || author.avatar || imgUrl('/uploads/placeholders/avatar_worker.png');
    if (avatar.startsWith('/uploads')) avatar = apiOrigin + avatar;

    const comments = (post.comments || []).map((c) => {
      const ca = c.author || {};
      return {
        ...c,
        authorName: ca.nickname || '邻居',
        avatar: ca.avatar_url && ca.avatar_url.startsWith('/uploads') ? apiOrigin + ca.avatar_url : (ca.avatar_url || ''),
        createdAt: c.createdAt ? util.formatTime(new Date(c.createdAt)) : ''
      };
    });

    let createdAt = post.createdAt;
    try {
      createdAt = post.createdAt ? util.formatTime(new Date(post.createdAt)) : '';
    } catch (e) {
      createdAt = String(post.createdAt || '');
    }

    return {
      ...post,
      author: {
        nickname: author.nickname || '社区邻居',
        avatar_url: avatar
      },
      images,
      comments,
      likes_count: post.likes ? post.likes.length : 0,
      isLiked: post.likes ? post.likes.some((l) => sameId(l.user_id, uid)) : false,
      createdAt
    };
  },

  previewImage(e) {
    const idx = e.currentTarget.dataset.index;
    const urls = (this.data.post && this.data.post.images) || [];
    if (!urls.length) return;
    wx.previewImage({ current: urls[idx], urls });
  },

  handleLike() {
    const { post } = this.data;
    if (!post) return;
    util.post(`posts/${post.id}/like`)
      .then((res) => {
        const liked = res.status === 'liked' || res.action === 'liked';
        const likes_count = Math.max(0, (post.likes_count || 0) + (liked ? 1 : -1));
        this.setData({ 'post.isLiked': liked, 'post.likes_count': likes_count });
      })
      .catch(() => wx.showToast({ title: '操作失败', icon: 'none' }));
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  submitComment() {
    const text = (this.data.commentText || '').trim();
    if (!text) return wx.showToast({ title: '请输入评论', icon: 'none' });
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    util.post(`posts/${this.data.postId}/comment`, { content: text })
      .then(() => {
        wx.showToast({ title: '评论成功', icon: 'success' });
        this.setData({ commentText: '' });
        return this.loadPost();
      })
      .catch(() => wx.showToast({ title: '评论失败', icon: 'none' }))
      .finally(() => this.setData({ submitting: false }));
  }
});
