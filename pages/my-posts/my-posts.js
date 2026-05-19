// pages/my-posts/my-posts.js
const util = require('../../utils/util.js');
const { asId } = require('../../utils/snowflakeId.js');

Page({
    data: {
        navTopPadding: 20,
        posts: [],
        pageType: '',
        category: ''
    },

    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 8,
            pageType: options.type || 'myposts',
            category: options.category || ''
        });

        if (options.title) {
            wx.setNavigationBarTitle({ title: options.title });
        }

        this.fetchData();
    },

    fetchData() {
        let url = '';
        const query = {};
        const app = getApp();
        const user = (app.globalData && app.globalData.user) || {};
        const communityId = user.communityId != null ? user.communityId : user.community_id;
        if (communityId != null && communityId !== '') query.community_id = communityId;

        if (this.data.pageType === 'myposts') {
            url = 'posts/my/published';
        } else if (this.data.pageType === 'mylikes') {
            url = 'posts/my/liked';
        } else if (this.data.pageType === 'participated') {
            url = 'posts/my/participated';
            query.category = this.data.category;
        }

        if (!url) return;

        util.get(url, query)
            .then(res => {
                // Handle array returned by backend util wrapper appropriately
                this.setData({ posts: Array.isArray(res) ? res : (res.list || res.data || []) });
            })
            .catch(err => {
                console.error('加载列表失败', err);
                wx.showToast({ title: '加载失败', icon: 'none' });
            });
    },

    goPostDetail(e) {
        const { id, index } = e.currentTarget.dataset;
        const postId = id || (this.data.posts[index] && this.data.posts[index].id);
        if (!postId) return;
        wx.navigateTo({ url: `/package-customer/pages/post-detail/post-detail?id=${postId}` });
    },

    handleLike(e) {
        const { id, index } = e.currentTarget.dataset;
        util.post(`posts/${id}/like`)
            .then(res => {
                // Optimistic UI Update
                const posts = this.data.posts;
                if (!posts[index].likes) posts[index].likes = [];

                if (res.status === 'liked') {
                    const uid = asId((getApp().globalData.user || {}).id);
                    posts[index].likes.push({ user_id: uid || 'mock' });
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
