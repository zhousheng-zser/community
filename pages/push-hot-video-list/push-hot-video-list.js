Page({
    data: {
        navTopPadding: 20,
        hotVideos: [
            {
                id: 1, author: "榆园家具厂花姐", likes: "2",
                title: "老榆木板原木桌面定制茶桌板材质...",
                price: "300.00", comm: "15.00",
                image: "https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?w=400&q=80"
            },
            {
                id: 2, author: "立白精品", likes: "13",
                title: "大师香氛玫瑰洗衣液护色洁净柔顺...",
                price: "99.90", comm: "24.97",
                image: "https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?w=400&q=80"
            },
            {
                id: 3, author: "立白精品", likes: "8",
                title: "立白大师格拉斯玫瑰香氛洗衣液深层...",
                price: "69.00", comm: "10.00",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"
            },
            {
                id: 4, author: "立白精品", likes: "11",
                title: "立白小白白衣物去油王250g精化...",
                price: "35.50", comm: "5.00",
                image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80"
            }
        ]
    },

    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 6
        });
    },

    goBack() {
        wx.navigateBack({ delta: 1 });
    },

    openFakeVideoChannel() {
        wx.showToast({
            title: '即将打开微信视频号...',
            icon: 'none'
        });
    }
});
