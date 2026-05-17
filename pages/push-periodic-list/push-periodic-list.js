const util = require('../../utils/util.js');

Page({
    data: {
        navTopPadding: 20,
        listType: '',    // '今日主推' | '本周甄选'
        themeClass: '',  // 'theme-today' | 'theme-week'
        bgText: '',      // 装饰文字
        subText: '',     // 标题下的小贴士
        goodsList: [],
        loading: true
    },

    onLoad(options) {
        const type = options.type || '今日主推';

        let themeClass = 'theme-today';
        let bgText = 'TODAY';
        let subText = '严选好货 发现不一样的好物';

        if (type === '本周甄选') {
            themeClass = 'theme-week';
            bgText = 'WEEKLY';
            subText = '本周严选 发现不一样的好物';
        }

        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            listType: type,
            themeClass,
            bgText,
            subText,
            navTopPadding: (sysInfo.statusBarHeight || 20) + 10
        });

        this.loadGoods(type);
    },

    async loadGoods(type) {
        try {
            await util.ensureUserCoordsForShop();
            const q = util.buildShopGoodsQuery({ distance_km: 10 });
            const res = await util.get('local-goods-home/modules', q);
            const payload = res && typeof res === 'object' ? (res.data || res) : {};

            // 从 periodic_modules 数组中找到对应 module_name 的模块
            const rawPeriodic = Array.isArray(payload.periodic_modules || payload.periodic)
                ? (payload.periodic_modules || payload.periodic)
                : [];

            const module = rawPeriodic.find(m =>
                (m.module_name || m.name || m.title) === type
            );

            const rawList = module
                ? (module.goods_list || module.products || module.items || [])
                : [];

            const filtered = util.filterShopProductsByDistance(rawList, 10);
            const goodsList = filtered.map((it, i) => {
                const row = util.normalizeShopProductRow(it, i);
                return { ...row, title: row.name };
            });

            this.setData({ goodsList, loading: false });
        } catch (e) {
            console.log('periodic-list 加载失败', e);
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
