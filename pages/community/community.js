// pages/community/community.js
Page({
    data: {
        // 模拟朋友圈帖子数据
        posts: [
            {
                id: 'p1',
                name: '王大妈',
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
                content: '今天王阿姨家修了个水管，小伙子手脚很麻利，没要多加钱。给社区服务点个赞！👍',
                images: [
                    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
                    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80'
                ],
                time: '1小时前',
                likes: ['李大爷', '张大山'],
                comments: [
                    { id: 'c1', name: '李大爷', text: '下次我家也要修' }
                ],
                isLiked: true,
                showMenu: false
            },
            {
                id: 'p2',
                name: '修理工老赵',
                avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80',
                content: '刚修完幸福小区 4 栋的空调，这种老旧机型清洗起来确实费劲，不过洗完冷风呼呼的。天气热了，大家记得提前洗空调啊~',
                images: [
                    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80'
                ],
                time: '3小时前',
                likes: [],
                comments: [
                    { id: 'c2', name: '幸福小赵', text: '师傅辛苦了' },
                    { id: 'c3', name: '修理工老赵', text: '回复 幸福小赵：应该的' }
                ],
                isLiked: false,
                showMenu: false
            }
        ]
    },

    onLoad: function (options) {
        // 页面初始化
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
        const index = e.currentTarget.dataset.index;
        let posts = this.data.posts;
        let post = posts[index];

        if (post.isLiked) {
            // 取消点赞
            post.likes = post.likes.filter(name => name !== '我');
            post.isLiked = false;
        } else {
            // 增加点赞
            post.likes.push('我');
            post.isLiked = true;
        }
        post.showMenu = false; // 操作完关闭菜单

        this.setData({ posts });
        wx.showToast({
            title: post.isLiked ? '点赞成功' : '取消点赞',
            icon: 'none'
        });
    },

    // 评论逻辑 (模拟弹窗)
    commentPost: function (e) {
        const index = e.currentTarget.dataset.index;
        let posts = this.data.posts;
        posts[index].showMenu = false;
        this.setData({ posts });

        const that = this;
        wx.showModal({
            title: '发表评论',
            editable: true,
            placeholderText: '说点什么...',
            success(res) {
                if (res.confirm && res.content) {
                    let currentPosts = that.data.posts; // 重新获取可能已被修改的数据
                    currentPosts[index].comments.push({
                        id: 'c' + Date.now(),
                        name: '我',
                        text: res.content
                    });
                    that.setData({ posts: currentPosts });
                    wx.showToast({ title: '评论成功', icon: 'success' });
                }
            }
        })
    },

    // 模拟发布界面
    goPublish: function () {
        wx.showActionSheet({
            itemList: ['拍摄', '从手机相册选择'],
            success(res) {
                wx.showToast({
                    title: '前端模拟暂无接口',
                    icon: 'none'
                })
            }
        })
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
