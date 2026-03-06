Page({
    data: {
        navTopPadding: 20,
        topList: [
            { id: 101, rank: "01", name: "君乐宝简醇桶760g0蔗糖酸奶大桶 怕糖控糖减脂期家人聚...", price: "29.90", comm: "3.83", image: "/img/placeholders/home_cleaning.png", tag: "极速发货" },
            { id: 102, rank: "02", name: "【日常早餐】百草味牛乳千层吐司1000g约20袋整箱早餐...", price: "21.90", comm: "2.52", image: "/img/placeholders/home_cleaning.png", tag: "牛乳千层吐司" },
            { id: 103, rank: "03", name: "立白大师香氛格拉斯玫瑰洗衣液去污花香持久留香深层洁...", price: "29.90", comm: "4.78", image: "/img/placeholders/home_cleaning.png", tag: "72小时持久留香" },
            { id: 104, rank: "04", name: "君乐宝简醇20袋100g0蔗糖低GI认证 轻食餐控糖塑身减...", price: "39.80", comm: "7.89", image: "/img/placeholders/home_cleaning.png", tag: "爆款热卖" }
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
    }
});
