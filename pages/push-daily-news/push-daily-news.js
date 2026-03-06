Page({
    data: {
        navTopPadding: 20,
        goodsList: [
            { id: 1, name: "子初紫草多效舒缓膏清凉温和棒状紫草膏婴幼儿童适用30g", price: "19.00", comm: "2.43", image: "/img/placeholders/home_cleaning.png", tag: "30g" },
            { id: 2, name: "【3年苗】带苞发货 蓝莓苗盆栽 阳台盆栽地栽绿植花卉w", price: "39.90", comm: "13.53", image: "/img/placeholders/home_repair.png", tag: "当年结果 基地现挖" },
            { id: 3, name: "十月结晶婴幼儿酵素洗衣液宝宝专用洗衣液天然皂液...", price: "15.90", comm: "2.04", image: "/img/placeholders/home_cleaning.png", tag: "酵素去污 深层洁净" },
            { id: 4, name: "子初蛋黄油倍护霜保湿秋冬面霜植萃舒缓按压泵大罐家庭装", price: "99.00", comm: "22.18", image: "/img/placeholders/home_cleaning.png", tag: "多效倍护" }
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
