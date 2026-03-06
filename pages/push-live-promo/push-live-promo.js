Page({
    data: {
        navTopPadding: 20,
        status: 'booking', // booking | live | closed
        liveInfo: {
            brand: "歌莉娅会员店",
            sub: "暂无",
            logo: "/img/placeholders/home_cleaning.png",
            rebate: "10%",
            promoters: 100
        }
    },

    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        // 优先读取路由传参的状态
        let pageStatus = options.status || 'booking';

        // 如果是通过点击首页过来的，可以使用 Mock 数据假装请求
        // 此处简化，只改变状态
        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 6,
            status: pageStatus
        });
    },

    handlePrimaryAction() {
        const { status } = this.data;
        if (status === 'closed') {
            wx.showToast({ title: '直播已关闭', icon: 'none' });
            return;
        }
        if (status === 'booking') {
            wx.showToast({ title: '预约成功', icon: 'success' });
            this.setData({ status: 'live' }); // 演示交互用
            return;
        }
        if (status === 'live') {
            wx.showToast({ title: '即将跳转小程序直播间...', icon: 'none' });
        }
    },

    goBack() {
        wx.navigateBack({ delta: 1 });
    }
});
