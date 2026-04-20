Page({
    data: {
        navTopPadding: 20,
        banner: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
        quickNavs: [
            { name: "新手教程" },
            { name: "新人入门" },
            { name: "新人进阶" },
            { name: "明星达人" },
            { name: "地推物料" }
        ],
        videoSections: []
    },
    onLoad() {
        const sys = wx.getSystemInfoSync();

        const mockSections = [
            {
                title: "新手教程",
                items: [
                    { id: 1, title: "什么是推客", tag: "新手教程", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80" },
                    { id: 2, title: "推客的分佣逻辑", tag: "新手教程", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80" }
                ]
            },
            {
                title: "新人入门",
                items: [
                    { id: 3, title: "如何注册本地商城平台", tag: "新人入门", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&q=80" },
                    { id: 4, title: "如何分享商品", tag: "新人入门", image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=300&q=80" }
                ]
            },
            {
                title: "新人进阶",
                items: [
                    { id: 5, title: "高效建立客户群", tag: "进阶必学", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&q=80" },
                    { id: 6, title: "如何提升复购率", tag: "进阶必学", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80" }
                ]
            },
            {
                title: "明星达人",
                items: [
                    { id: 7, title: "月入过万的秘密", tag: "大咖分享", image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&q=80" },
                    { id: 8, title: "我的地推日记", tag: "实战案例", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&q=80" }
                ]
            },
            {
                title: "地推物料",
                items: [
                    { id: 9, title: "线下展架设计指南", tag: "实操手册", image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=300&q=80" },
                    { id: 10, title: "送客小礼品推荐", tag: "物料采购", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&q=80" }
                ]
            }
        ];

        this.setData({
            navTopPadding: (sys.statusBarHeight || 20) + 6,
            videoSections: mockSections
        });
    },
    goCategory(e) {
        const cat = e.currentTarget.dataset.name;
        wx.navigateTo({
            url: `/pages/push-video-category/push-video-category?category=${cat}`
        });
    },
    goBack() {
        const pages = getCurrentPages();
        if (pages.length > 1) {
            wx.navigateBack({ delta: 1 });
            return;
        }
        wx.switchTab({ url: "/pages/index/index" });
    }
});
