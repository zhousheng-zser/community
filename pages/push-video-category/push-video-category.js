Page({
    data: {
        navTopPadding: 20,
        tabs: ["新手教程", "新人入门", "新人进阶", "明星达人", "地推物料"],
        currentTab: "新手教程",
        videos: []
    },
    onLoad(options) {
        const sys = wx.getSystemInfoSync();

        // 初始化选中的 Tab（从首页传进来的类别名称）
        if (options.category) {
            this.setData({ currentTab: options.category });
        }

        // 伪造一组图二样式里的“左图右文”视频列表数据
        const mockVideos = [
            { id: 1, title: "什么是推客", viewers: 604, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80" },
            { id: 2, title: "推客的分佣逻辑", viewers: 347, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80" },
            { id: 3, title: "推客的分佣规则", viewers: 63, image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&q=80" },
            { id: 4, title: "推客的染色关系与时效", viewers: 58, image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&q=80" },
            { id: 5, title: "本地好物分佣逻辑", viewers: 66, image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=300&q=80" },
            { id: 6, title: "如何成为一名优秀的推客", viewers: 91, image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&q=80" }
        ];

        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 6,
            videos: mockVideos
        });
    },

    // 顶部深咖色导航栏点击事件
    onTabClick(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ currentTab: tab });
    },

    // 模拟播放视频（点击卡片时提示）
    playVideo(e) {
        wx.showToast({
            title: "播放模块开发中",
            icon: "none"
        });
    },

    goBack() {
        wx.navigateBack({ delta: 1 });
    }
});
