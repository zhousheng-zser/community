const app = getApp();
const util = require('../../utils/util.js');
const lp = require('../../utils/localPrefs.js');
const api = require('../../api/index.js');

Page({
    data: {
        activeTab: 'chat',
        systemNotices: [],
        conversations: [],
        startX: 0,
        startY: 0
    },

    onShow: function () {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 3 });
        }
        lp.seedSystemIfEmpty();
        this.fetchConversations();
        this.loadSystemNotices();
    },

    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ activeTab: tab });
        if (tab === 'sys') this.loadSystemNotices();
    },

    loadSystemNotices() {
        const token = wx.getStorageSync('token');
        if (!token) {
            this.applyLocalSystemNotices();
            return;
        }
        api.message.getSystemNotices().then((res) => {
            const list = Array.isArray(res) ? res : [];
            if (list.length === 0) {
                lp.seedSystemIfEmpty();
                this.applyLocalSystemNotices();
                return;
            }
            const systemNotices = list.map((x) =>
                Object.assign({}, x, {
                    timeLabel: x.time ? String(x.time).slice(0, 19).replace('T', ' ') : ''
                })
            );
            this.setData({ systemNotices });
        }).catch(() => {
            this.applyLocalSystemNotices();
        });
    },

    applyLocalSystemNotices() {
        const systemNotices = lp.getSystemNotices().map((x) =>
            Object.assign({}, x, {
                timeLabel: x.time ? String(x.time).slice(0, 19).replace('T', ' ') : ''
            })
        );
        this.setData({ systemNotices });
    },

    markAllSysRead() {
        lp.markAllSystemRead();
        this.loadSystemNotices();
        wx.showToast({ title: '已标记已读', icon: 'none' });
    },

    openSys(e) {
        const id = e.currentTarget.dataset.id;
        const row = (this.data.systemNotices || []).find((x) => String(x.id) === String(id));
        if (row && row.bot_type) {
            const q = [
                `conversationId=${id}`,
                `peerId=0`,
                `name=${encodeURIComponent(row.title || '系统通知')}`
            ];
            wx.navigateTo({ url: `/pages/chat/chat?${q.join('&')}` });
            this.loadSystemNotices();
            return;
        }
        lp.markSystemRead(id);
        this.loadSystemNotices();
        if (row && row.content) {
            wx.showModal({ title: row.title || '通知', content: row.content, showCancel: false });
        }
    },

    // 获取消息列表（商家端带 shop_id 时只拉取该店关联的订单会话）
    fetchConversations() {
        const u = app.globalData.user || {};
        const q = {};
        if (u.shop_id != null && u.shop_id !== '') {
            q.shop_id = u.shop_id;
        } else if (u.shopId != null && u.shopId !== '') {
            q.shop_id = u.shopId;
        }
        api.message.getConversationList(q).then(res => {
            const list = Array.isArray(res) ? res : [];
            const formattedList = list.map(item => ({
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
        api.message.deleteConversation(convId).then(() => {
        }).catch(() => {
            wx.showToast({ title: '删除状态同步失败', icon: 'none' });
        });
    },

    // 进入对话详情（订单会话：带 order_no）；到家服务单可先进详情再沟通
    goToChat(e) {
        let item = e.currentTarget.dataset.item;
        if (item.service_order_id != null && item.service_order_id !== '') {
            wx.navigateTo({
                url: `/pages/service-order-detail/service-order-detail?id=${item.service_order_id}`
            });
            return;
        }
        const t = item.title || '';
        if (item.order_no && t.indexOf('[到家]') === 0) {
            wx.navigateTo({
                url: `/pages/service-order-detail/service-order-detail?orderNo=${encodeURIComponent(item.order_no)}`
            });
            return;
        }
        const botNames = { logistics: '订单物流通知', event: '活动优惠', notices: '系统公告' };
        const name = item.bot_type
            ? (botNames[item.bot_type] || '系统通知')
            : (item.peerUser ? item.peerUser.nickname : (item.peer_id == 0 ? '系统消息' : '会话'));
        const title = item.title || name;
        const q = [
            `conversationId=${item.conversation_id}`,
            `peerId=${item.peer_id || ''}`,
            `name=${encodeURIComponent(title)}`
        ];
        if (item.order_no) {
            q.push(`orderNo=${encodeURIComponent(item.order_no)}`);
        }
        wx.navigateTo({
            url: `/pages/chat/chat?${q.join('&')}`
        });
    }
})
