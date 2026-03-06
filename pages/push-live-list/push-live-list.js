Page({
    data: {
        navTopPadding: 20,
        currentTab: 'all', // all | brand | expert
        liveList: [
            { id: 1, type: 'expert', brand: "三只松鼠 ThreeSquirrels", sub: "三只松鼠坚果po价专场来喽！", logo: "/img/placeholders/home_cleaning.png", rebate: "10%", promoters: 15968, status: 'booking' },
            { id: 2, type: 'brand', brand: "玛氏箭牌糖果中国有限公司", sub: "德芙三八女神节专场", logo: "/img/placeholders/home_cleaning.png", rebate: "10%", promoters: 269, status: 'booking' },
            { id: 3, type: 'brand', brand: "科尔沁食品旗舰店", sub: "科尔沁牛肉干官方补贴", logo: "/img/placeholders/home_repair.png", rebate: "10%", promoters: 100, status: 'booking' },
            { id: 4, type: 'expert', brand: "李佳琦直播间", sub: "美妆节特别活动特卖", logo: "/img/placeholders/home_cleaning.png", rebate: "15%", promoters: 89012, status: 'live' },
            { id: 5, type: 'brand', brand: "老乡鸡旗舰店", sub: "19.9霸王餐限时秒杀", logo: "/img/placeholders/home_repair.png", rebate: "5%", promoters: 156, status: 'closed' }
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
        if (tabName !== 'all') {
            filtered = liveList.filter(item => item.type === tabName);
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
