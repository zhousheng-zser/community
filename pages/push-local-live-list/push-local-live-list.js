Page({
    data: {
        navTopPadding: 20,
        currentTab: '全部',
        pavilions: [
            { name: "全部", image: "/img/index/menuicon1.png" },
            { name: "贵州馆", image: "/img/placeholders/home_cleaning.png" },
            { name: "上海馆", image: "/img/placeholders/home_repair.png" },
            { name: "江西馆", image: "/img/placeholders/home_cleaning.png" },
            { name: "山西馆", image: "/img/placeholders/home_repair.png" }
        ],
        liveList: [
            {
                id: 1,
                region: "江苏馆",
                brand: "家事速配如东特产店",
                sub: "海鲜礼品节",
                logo: "/img/placeholders/home_cleaning.png",
                rebate: "10%",
                promoters: 2354,
                status: 'closed',
                goods: [
                    { name: "酒店海盐虾", price: "19.90", comm: "1.27", img: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&q=80" },
                    { name: "八鲜海产大礼包", price: "208.00", comm: "13.31", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80" }
                ]
            },
            {
                id: 2,
                region: "福建馆",
                brand: "家事速配-霞浦特产优选店",
                sub: "欢迎来到我的直播间",
                logo: "/img/placeholders/home_repair.png",
                rebate: "10%",
                promoters: 2825,
                status: 'closed',
                goods: [
                    { name: "霞浦特产海苔碎", price: "29.90", comm: "2.50", img: "https://images.unsplash.com/photo-1582046123000-c08126fc2388?w=400&q=80" },
                    { name: "精选野生黄鱼干", price: "168.00", comm: "18.31", img: "https://images.unsplash.com/photo-1606752763351-4191d8ba0d7d?w=400&q=80" }
                ]
            }
        ],
        filteredList: []
    },

    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 6,
            filteredList: this.data.liveList
        });
    },

    switchTab(e) {
        const tabName = e.currentTarget.dataset.tab;
        const { liveList } = this.data;

        let filtered = liveList;
        if (tabName !== '全部') {
            filtered = liveList.filter(item => item.region === tabName);
        }

        this.setData({
            currentTab: tabName,
            filteredList: filtered
        });
    },

    goBack() {
        wx.navigateBack({ delta: 1 });
    }
});
