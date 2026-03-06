Page({
    data: {
        navTopPadding: 20,
        listType: '',    // 当前类型：'今日主推' | '本周热卖' | '本月排行'
        themeClass: '',  // 'theme-today' | 'theme-week' | 'theme-month'
        bgText: '',      // 装饰文字
        subText: '',     // 标题下的小贴士
        goodsList: []    // 渲染的商品数据
    },

    onLoad(options) {
        // 从路由中获取类别
        const type = options.type || '今日主推';
        let themeClass = 'theme-today';
        let bgText = 'TODAY';
        let subText = '严选好货 发现不一样的好物';

        // 我们用统一的模拟数据池子，分别对三种展示风格配图
        let mockList = [
            {
                id: 301,
                title: "[品质升级！ 三合一快充线]三合一数据线快充多头充电线一拖三通用",
                price: "4.99",
                comm: "0.22",
                image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80",
                reason: ""
            },
            {
                id: 302,
                title: "内衣裤清新剂清洁内裤持久清洗液抑菌专用VHVB仙人掌去污...",
                price: "5.90",
                comm: "0.45",
                image: "https://images.unsplash.com/photo-1584820927498-cafe4c23db07?w=500&q=80",
                reason: ""
            },
            {
                id: 303,
                title: "体重秤充电款 电子秤 精准 称量【广元】",
                price: "19.90",
                comm: "2.16",
                image: "https://images.unsplash.com/photo-1520113412646-fa41cbbedb09?w=500&q=80",
                reason: ""
            }
        ];

        if (type === '本周热卖') {
            themeClass = 'theme-week';
            bgText = 'HOT!';
            subText = '爆款推荐';
            mockList = [
                {
                    id: 401,
                    title: "[年年宏]桑葚坚果糕红枣枸杞核桃软糕美味手工芝麻酥老式切糕零...",
                    price: "39.90",
                    comm: "6.38",
                    image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=500&q=80",
                    reason: "香酥香甜 唇齿留香"
                },
                {
                    id: 402,
                    title: "【三只松鼠-肉食海味玉米拇指肠】外脆里嫩肉质紧实甜润",
                    price: "19.90",
                    comm: "2.29",
                    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
                    reason: ""
                },
                {
                    id: 403,
                    title: "[新客推荐]【八种果蔬】 三只松鼠 嗨浪  果蔬海苔脆7g*9袋",
                    price: "9.90",
                    comm: "1.14",
                    image: "https://images.unsplash.com/photo-1599813580459-d8bc2d609101?w=500&q=80",
                    reason: ""
                }
            ];
        } else if (type === '本月排行') {
            themeClass = 'theme-month';
            bgText = 'TOP';
            subText = '根据商品的销量情况排序';
            mockList = [
                {
                    id: 501,
                    title: "[小鹿蓝蓝_DHA坚果巧克力棒42g/盒3根]0反式脂肪酸",
                    price: "29.90",
                    comm: "4.01",
                    image: "https://images.unsplash.com/photo-1511381939415-e440c9418aa2?w=500&q=80",
                    reason: "醇香酥脆 口口惊喜"
                }
            ];
        }

        this.setData({
            listType: type,
            themeClass,
            bgText,
            subText,
            goodsList: mockList
        });

        const sysInfo = wx.getSystemInfoSync();
        if (sysInfo.statusBarHeight) {
            this.setData({ navTopPadding: sysInfo.statusBarHeight + 10 });
        }
    },

    goBack() {
        wx.navigateBack();
    }
});
