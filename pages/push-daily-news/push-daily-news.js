const util = require('../../utils/util.js');

Page({
    data: {
        navTopPadding: 20,
        goodsList: [],   // 纯真实接口数据，无兜底假商品
        loading: true
    },
    onLoad(options) {
        const sys = wx.getSystemInfoSync();
        this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
        this.loadDailyNews();
    },
    async loadDailyNews() {
        try {
            const q = await util.buildShopGoodsQueryAsync({ distance_km: 10 });
            if (!q) {
                this.setData({ goodsList: [], loading: false });
                return;
            }
            const res = await util.get('local-goods-home/modules', q);
            const payload = res && typeof res === 'object' ? (res.data || res) : {};
            const rawList = payload.daily_news || payload.dailyNews || [];
            const filtered = util.filterShopProductsByDistance(rawList, 10);
            const goodsList = filtered.map((it, i) => util.normalizeShopProductRow(it, i));
            this.setData({ goodsList, loading: false });
        } catch (e) {
            console.log('每日上新加载失败', e);
            this.setData({ goodsList: [], loading: false });
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
