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
        },
        hasHotGoods: false,
        hotGoods: [
          { image: '/img/placeholders/home_cleaning.png' },
          { image: '/img/placeholders/home_cleaning.png' },
          { image: '/img/placeholders/home_cleaning.png' }
        ]
    },

    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        // 优先读取路由传参的状态
        let pageStatus = options.status || 'booking';

        // 解析并展示传入的品牌等信息
        let hasGoods = options.goods === '1';
        
        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 6,
            status: pageStatus,
            hasHotGoods: hasGoods,
            finderUserName: options.username || '',
            ['liveInfo.brand']: options.brand || this.data.liveInfo.brand,
            ['liveInfo.logo']: options.logo || this.data.liveInfo.logo
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
            const targetFinderUserName = this.data.finderUserName || 'sphJ1iCq7wE7Kj1';
            wx.openChannelsLive({
              finderUserName: targetFinderUserName,
              success(res) {
                console.log('成功拉起视频号直播间', res);
              },
              fail(err) {
                console.error('拉起视频号直播间失败', err);
                wx.showToast({
                  title: '拉起直播间失败, 请检查ID或稍后再试',
                  icon: 'none'
                });
              }
            });
        }
    },

    goBack() {
        wx.navigateBack({ delta: 1 });
    }
});
