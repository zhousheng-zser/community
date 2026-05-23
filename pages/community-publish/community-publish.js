const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');
const { sensitiveCheck } = require('../../utils/sensitiveWords.js');
const { getPostCommunityId } = require('../../utils/communityPortal.js');

Page({
    data: {
        tempImagePaths: [],
        isSubmitting: false,
        category: '热门话题'
    },

    onLoad(options) {
        if (options && options.category) {
            this.setData({ category: decodeURIComponent(options.category) });
        }
    },

    chooseImages() {
        const that = this;
        const count = 9 - this.data.tempImagePaths.length;
        wx.chooseMedia({
            count: count,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success(res) {
                const newPaths = res.tempFiles.map(file => file.tempFilePath);
                that.setData({
                    tempImagePaths: that.data.tempImagePaths.concat(newPaths)
                });
            }
        });
    },

    deleteImage(e) {
        const index = e.currentTarget.dataset.index;
        let paths = this.data.tempImagePaths;
        paths.splice(index, 1);
        this.setData({
            tempImagePaths: paths
        });
    },

    // 顺序上传所有图片并返回线上 URL 数组
    uploadAllImages(paths) {
        if (paths.length === 0) return Promise.resolve([]);

        let uploadedUrls = [];
        let promiseChain = Promise.resolve();

        paths.forEach(path => {
            promiseChain = promiseChain.then(() => {
                return util.uploadFile('upload', path, 'file').then(res => {
                    uploadedUrls.push(res.url); // res.url 例如 '/uploads/xxx.jpg'
                });
            });
        });

        return promiseChain.then(() => uploadedUrls);
    },

    submitPost(e) {
        const content = e.detail.value.content.trim();
        const location = e.detail.value.location.trim();
        const images = this.data.tempImagePaths;

        if (!content && images.length === 0) {
            return wx.showToast({ title: '写点内容或发张照片吧', icon: 'none' });
        }

        const passed = sensitiveCheck(content, 
            () => {
                this.doSubmitPost(content, location, images);
            },
            (result) => {
                wx.showToast({ title: '内容包含敏感词汇，请修改后重试', icon: 'none' });
            }
        );
        
        if (!passed) return;
    },

    async ensureCommunityBeforePost() {
        const cid = getPostCommunityId(app);
        if (!cid) {
            wx.showModal({
                title: '需要绑定小区',
                content: '社区帖子按小区展示。请先在首页顶部选点「合川路」等服务站点，或联系客服绑定所属小区后再发布。',
                showCancel: false,
                confirmText: '去首页选点'
            });
            return null;
        }
        const user = (app.globalData && app.globalData.user) || {};
        const bound = user.communityId ?? user.community_id;
        if (bound == null || bound === '') {
            try {
                await api.user.updateProfileFields({ community_id: cid });
                app.globalData.user = Object.assign({}, user, {
                    communityId: cid,
                    community_id: cid
                });
                wx.setStorageSync('user_community_id', String(cid));
            } catch (e) {
                console.warn('[publish] sync community_id', e);
            }
        }
        return cid;
    },

    async doSubmitPost(content, location, images) {
        const communityId = await this.ensureCommunityBeforePost();
        if (!communityId) {
            this.setData({ isSubmitting: false });
            return;
        }

        this.setData({ isSubmitting: true });
        wx.showLoading({ title: '发布中', mask: true });

        // 先上传所有图片
        this.uploadAllImages(images)
            .then(uploadedUrls => {
                // 将上传得到的链接和文字一起发给后端
                return util.post('posts', {
                    content: content,
                    location: location,
                    images: uploadedUrls,
                    category: this.data.category,
                    community_id: communityId
                });
            })
            .then(() => {
                wx.hideLoading();
                wx.showToast({ title: '发布成功', icon: 'success' });
                const app = getApp();
                if (app.globalData) {
                    app.globalData.communityTargetTab = this.data.category;
                }
                // 发送事件通知社区列表页面刷新
                const pages = getCurrentPages();
                const prevPage = pages[pages.length - 2];
                if (prevPage && prevPage.route === 'pages/community/community') {
                    if (typeof prevPage.ensureCommunityContext === 'function') {
                        prevPage.ensureCommunityContext().then(() => prevPage.fetchPosts());
                    } else {
                        prevPage.fetchPosts();
                    }
                }

                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            })
            .catch(err => {
                this.setData({ isSubmitting: false });
                wx.hideLoading();
                const msg = (err && (err.errmsg || err.msg || err.error)) || '发布失败，请重试';
                wx.showToast({ title: msg, icon: 'none' });
                console.error('发布失败:', err);
            });
    }
});
