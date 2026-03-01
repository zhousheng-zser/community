const app = getApp();
const util = require('../../utils/util.js');

Page({
    data: {
        userInfo: {},
        // 动态帖子数据
        posts: [],
        page: 1,
        hasMore: true,
        isLoading: false
    },

    onLoad: function (options) {
        this.loadPosts(true);
    },

    onShow: function () {
        // 同步最新的个人信息
        if (app.globalData.user) {
            this.setData({
                userInfo: app.globalData.user
            });
        }
    },

    // 下拉刷新
    onPullDownRefresh: function () {
        this.loadPosts(true).then(() => {
            wx.stopPullDownRefresh();
        });
    },

    // 触底加载更多
    onReachBottom: function () {
        if (this.data.hasMore) {
            this.loadPosts(false);
        }
    },

    // 时间格式化辅助函数：把 ISO 字符串转为 "xx小时前" 等更友好的显示
    formatTimeAgoToNow: function (dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000; // 秒

        if (diff < 60) return '刚刚';
        if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
        if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
        if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },

    // 加载帖子列表
    loadPosts: function (isRefresh = false) {
        if (this.data.isLoading) return Promise.resolve();
        this.setData({ isLoading: true });

        const page = isRefresh ? 1 : this.data.page;
        return util.get(`posts?page=${page}&limit=10`).then(res => {
            const currentUserId = app.globalData.user ? app.globalData.user.id : null;

            // 极度防御：确保我们拿到的是数组
            let postsList = [];
            if (Array.isArray(res)) {
                postsList = res;
            } else if (res && Array.isArray(res.data)) {
                postsList = res.data;
            } else if (res && res.data && Array.isArray(res.data.data)) {
                postsList = res.data.data;
            }

            const formattedPosts = postsList.map(post => {
                // 处理图片链接 (加上 host)
                let images = [];
                if (post.images) {
                    try {
                        let parsed = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
                        if (Array.isArray(parsed)) {
                            images = parsed.map(img => img.startsWith('http') ? img : `http://localhost:3000${img}`);
                        }
                    } catch (e) {
                        console.error('解析图片报错', e);
                    }
                }

                // 处理点赞数据
                const likes = Array.isArray(post.likes) ? post.likes.map(like => like.user && like.user.nickname ? like.user.nickname : '匿名') : [];
                const isLiked = Array.isArray(post.likes) ? post.likes.some(like => like.user_id === currentUserId) : false;

                // 处理评论数据
                const comments = Array.isArray(post.comments) ? post.comments.map(c => ({
                    id: c.id,
                    name: c.author ? c.author.nickname : '未知用户',
                    text: c.content
                })) : [];

                return {
                    id: post.id,
                    name: post.author ? post.author.nickname : '匿名用户',
                    avatar: post.author ? post.author.avatar_url : 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
                    content: post.content,
                    images: images,
                    time: this.formatTimeAgoToNow(post.createdAt),
                    likes: likes,
                    comments: comments,
                    isLiked: isLiked,
                    showMenu: false
                };
            });

            this.setData({
                posts: isRefresh ? formattedPosts : [...this.data.posts, ...formattedPosts],
                page: page + 1,
                hasMore: formattedPosts.length === 10,
                isLoading: false
            });
        }).catch(err => {
            console.error('获取帖子失败:', err);
            this.setData({ isLoading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        });
    },

    onShow: function () {
        // 每次显示页面时，同步最新的个人信息
        if (app.globalData.user) {
            this.setData({
                userInfo: app.globalData.user
            });
        }
    },

    // 预览图片
    previewImage: function (e) {
        const current = e.currentTarget.dataset.url;
        const urls = e.currentTarget.dataset.urls;
        wx.previewImage({
            current: current,
            urls: urls
        })
    },

    // 点亮/隐藏操作菜单
    toggleActionMenu: function (e) {
        const index = e.currentTarget.dataset.index;
        let posts = this.data.posts;
        // 先把其他的菜单全关掉
        posts.forEach((post, i) => {
            if (i !== index) post.showMenu = false;
        });
        // 切换当前的
        posts[index].showMenu = !posts[index].showMenu;
        this.setData({ posts });
    },

    // 点赞逻辑
    likePost: function (e) {
        if (!app.globalData.user) {
            return wx.showToast({ title: '请先前往我的页面登录', icon: 'none' });
        }

        const index = e.currentTarget.dataset.index;
        let posts = this.data.posts;
        let post = posts[index];
        const postId = post.id;

        // 乐观更新 UI
        post.showMenu = false;

        util.post(`posts/${postId}/like`, {}).then(res => {
            // 后端返回成功后，如果是点赞，往数组里加自己的名字；如果是取消点赞，去掉
            const myName = app.globalData.user.userName || '未知用户';
            if (res.status === 'liked') {
                post.likes.push(myName);
                post.isLiked = true;
            } else {
                post.likes = post.likes.filter(name => name !== myName);
                post.isLiked = false;
            }
            this.setData({ posts });
            wx.showToast({ title: res.message, icon: 'none' });
        }).catch(err => {
            wx.showToast({ title: '操作失败', icon: 'none' });
            console.error('点赞失败', err);
        });
    },

    // 评论逻辑
    commentPost: function (e) {
        if (!app.globalData.user) {
            return wx.showToast({ title: '请先前往我的页面登录', icon: 'none' });
        }

        const index = e.currentTarget.dataset.index;
        let posts = this.data.posts;
        const postId = posts[index].id;

        posts[index].showMenu = false;
        this.setData({ posts });

        const that = this;
        wx.showModal({
            title: '发表评论',
            editable: true,
            placeholderText: '说点什么...',
            success(res) {
                if (res.confirm && res.content) {
                    wx.showLoading({ title: '发送中' });
                    util.post(`posts/${postId}/comment`, {
                        content: res.content
                    }).then(data => {
                        wx.hideLoading();
                        let currentPosts = that.data.posts;
                        currentPosts[index].comments.push({
                            id: data.id || Date.now(),
                            name: app.globalData.user.userName || '未知用户',
                            text: res.content
                        });
                        that.setData({ posts: currentPosts });
                        wx.showToast({ title: '评论成功', icon: 'success' });
                    }).catch(err => {
                        wx.hideLoading();
                        wx.showToast({ title: '评论失败', icon: 'none' });
                        console.error('发送评论失败', err);
                    });
                }
            }
        })
    },

    // 真实发布界面
    goPublish: function () {
        if (!app.globalData.user) {
            return wx.showToast({ title: '请先前往我的页面登录', icon: 'none' });
        }
        wx.navigateTo({
            url: '/pages/community-publish/community-publish'
        });
    },

    // 点击空白处关闭所有的操作菜单
    onPageTap: function () {
        let posts = this.data.posts;
        let changed = false;
        posts.forEach((post) => {
            if (post.showMenu) {
                post.showMenu = false;
                changed = true;
            }
        });
        if (changed) {
            this.setData({ posts });
        }
    }
})
