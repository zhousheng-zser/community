const app = getApp();
const util = require('../../utils/util.js');

Page({
    data: {
        conversations: [],
        // 左滑相关的变量
        startX: 0,
        startY: 0
    },

    onShow: function () {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 3 });
        }
        this.fetchConversations();
    },

    // 获取消息列表
    fetchConversations() {
        util.get("messages/conversations").then(res => {
            // 动态给每条记录加上一个位移变量，用来控制左滑删除动效
            const formattedList = res.map(item => ({
                ...item,
                isTouchMove: false
            }));
            this.setData({
                conversations: formattedList
            });
        }).catch(err => {
            console.error(err);
            wx.showToast({ title: '加载消息失败', icon: 'none' });
        });
    },

    // 格式化时间的辅助方法可以在 WXS 里或者前端直接存好后再做

    // --------- 左滑删除逻辑 ---------
    touchstart: function (e) {
        // 恢复所有元素的初始状态
        this.data.conversations.forEach(function (v, i) {
            if (v.isTouchMove) v.isTouchMove = false;
        })
        this.setData({
            startX: e.changedTouches[0].clientX,
            startY: e.changedTouches[0].clientY,
            conversations: this.data.conversations
        })
    },

    // 滑动事件处理
    touchmove: function (e) {
        let index = e.currentTarget.dataset.index;
        let startX = this.data.startX;
        let startY = this.data.startY;
        let touchMoveX = e.changedTouches[0].clientX;
        let touchMoveY = e.changedTouches[0].clientY;

        // 获取滑动角度
        let angle = this.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });

        this.data.conversations.forEach(function (v, i) {
            v.isTouchMove = false;
            // 滑动超过30度角就当作非横向滑动
            if (Math.abs(angle) > 30) return;
            if (i == index) {
                if (touchMoveX > startX) { // 右滑
                    v.isTouchMove = false;
                } else { // 左滑
                    v.isTouchMove = true;
                }
            }
        });

        // 只有当isTouchMove改变时才setData，优化性能
        this.setData({
            conversations: this.data.conversations
        });
    },

    angle: function (start, end) {
        var _X = end.X - start.X,
            _Y = end.Y - start.Y
        return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
    },

    // 删除按钮点击事件
    deleteConv(e) {
        let index = e.currentTarget.dataset.index;
        let convId = this.data.conversations[index].conversation_id;

        // 前端先直接移除
        this.data.conversations.splice(index, 1);
        this.setData({
            conversations: this.data.conversations
        });

        // 调用后端软删除接口
        util.delete(`messages/conversations/${convId}`).then(() => {
        }).catch(() => {
            wx.showToast({ title: '删除状态同步失败', icon: 'none' });
        });
    },

    // 进入对话详情
    goToChat(e) {
        let item = e.currentTarget.dataset.item;
        // 传递房间和对方信息，这里暂不复杂化，只传 ID
        wx.navigateTo({
            url: `/pages/chat/chat?conversationId=${item.conversation_id}&peerId=${item.peer_id}&name=${item.peerUser ? item.peerUser.nickname : (item.peer_id == 0 ? '系统消息' : '...')}`
        });
    }
})
