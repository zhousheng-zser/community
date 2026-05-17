const util = require('../../utils/util.js');

Page({
    data: {
        navTopPadding: 20,
        topList: [],   // 纯真实接口数据，无兜底假商品
        loading: true
    },
    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
        this.loadTopSales();
    },
    async loadTopSales() {
        try {
            await util.ensureUserCoordsForShop();
            const q = util.buildShopGoodsQuery({ distance_km: 10 });
            const res = await util.get('local-goods-home/modules', q);
            const payload = res && typeof res === 'object' ? (res.data || res) : {};
            const rawList = payload.top_sales || payload.topSales || [];
            const filtered = util.filterShopProductsByDistance(rawList, 10);
            // 保留后端返回的 rank 字段；若无则按顺序生成 01/02/...
            const topList = filtered.map((it, i) => {
                const row = util.normalizeShopProductRow(it, i);
                const rankRaw = it.rank != null ? it.rank : (i + 1);
                return { ...row, rank: String(rankRaw).padStart(2, '0') };
            });
            this.setData({ topList, loading: false });
        } catch (e) {
            console.log('热卖TOP榜加载失败', e);
            this.setData({ topList: [], loading: false });
        }
    },
    goBack() {
        const pages = getCurrentPages();
        if (pages.length > 1) {
            wx.navigateBack({ delta: 1 });
            return;
        }
        wx.switchTab({ url: '/pages/index/index' });
    }
});
