const app = getApp();
const util = require('../../utils/util.js');

Page({
    data: {
        conversationId: null,
        peerId: null,
        myUserId: null,
        history: [],
        inputText: '',
        scrollIntoView: ''
    },

    onLoad: function (options) {
        // 动态设置对方昵称到导航栏
        if (options.name) {
            wx.setNavigationBarTitle({ title: options.name });
        }
        let currentUserId = app.globalData.user ? app.globalData.user.id : 2;
        this.setData({
            conversationId: options.conversationId,
            peerId: options.peerId,
            myUserId: parseInt(currentUserId)
        });
        this.fetchHistory();
    },

    fetchHistory() {
        util.get(`messages/history/${this.data.conversationId}`).then(res => {
            this.setData({ history: res }, () => {
                this.scrollToBottom();
            });
        }).catch(err => {
            wx.showToast({ title: '加载历史失败', icon: 'none' });
        });
    },

    onInput(e) {
        this.setData({ inputText: e.detail.value });
    },

    sendText() {
        if (!this.data.inputText.trim()) return;
        const text = this.data.inputText;

        // 乐观更新 UI
        const tempMsg = {
            id: 'temp_' + Date.now(),
            sender_id: this.data.myUserId, // 本地缓存获取ID，或通过接口获取
            msg_type: 'text',
            content: text,
            created_at: new Date().toISOString()
        };
        this.setData({
            history: [...this.data.history, tempMsg],
            inputText: ''
        }, () => {
            this.scrollToBottom();
        });

        util.post('messages/send', {
            peerId: this.data.peerId,
            content: text,
            msgType: 'text'
        }).then(() => {
            // Background reload to sync exact IDs and dates from server.  
            // For immediate fluid UX, we'd rely on websocket or manual push.
            this.fetchHistory();
        }).catch(err => {
            wx.showToast({ title: '发送失败', icon: 'none' });
        });
    },

    sendImage() {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            success: (res) => {
                const tempFilePath = res.tempFilePaths[0];
                // 实际上线时应先按前面实现过的 util.uploadFile 传到服务器拿到真实业务URL
                // 这里模拟已有一张图发送（假设服务器返回了地址）
                util.post('messages/send', {
                    peerId: this.data.peerId,
                    content: '/img/placeholders/home_cleaning.png', // Replace with uploaded URL later
                    msgType: 'image'
                }).then(() => {
                    this.fetchHistory();
                });
            }
        });
    },

    scrollToBottom() {
        if (this.data.history.length > 0) {
            const lastMsg = this.data.history[this.data.history.length - 1];
            this.setData({
                scrollIntoView: 'msg_' + lastMsg.id
            });
        }
    }
})
