const util = require('../../utils/util.js');
const { unwrapList } = util;

function moneyText(v) {
  if (v == null || v === '') return '0';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function normalizeCatalogGroups(raw, imgUrlFn) {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((g) => {
    const gk = g.group_key || g.key || 'default';
    const gl = g.group_label || g.label || g.name || gk;
    const itemsIn = Array.isArray(g.items) ? g.items : unwrapList(g);
    const items = (itemsIn || []).map((line) => {
      const sid = line.service_id != null ? line.service_id : line.id;
      const cartKey = `${gk}:${sid}`;
      return {
        service_id: sid,
        title: line.title || line.name || line.goodsTitle || '服务',
        price: line.price,
        priceText: moneyText(line.price),
        cover: imgUrlFn(line.cover_image || line.image || '/img/placeholders/home_cleaning.png'),
        cartKey
      };
    });
    return { group_key: gk, group_label: gl, items };
  });
}

Page({
  data: {
    loading: true,
    providerId: '',
    providerName: '',
    groups: [],
    cart: {},
    totalText: '0'
  },

  onLoad(q) {
    const pid = q.provider_id != null ? String(q.provider_id) : '';
    if (!pid) {
      wx.showToast({ title: '缺少服务商', icon: 'none' });
      return;
    }
    this.setData({ providerId: pid });
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    const imgUrl = (u) => util.imgUrl(u, u);
    try {
      let detail = {};
      try {
        detail = await util.get(`core/service-providers/${this.data.providerId}`);
      } catch (e) {
        detail = {};
      }
      const d = detail && detail.data && typeof detail.data === 'object' ? detail.data : detail;
      const inner = d && d.provider ? d.provider : d;
      const name =
        (inner && (inner.name || inner.shop_name || inner.display_name)) || '服务商';

      let groups = [];
      try {
        const cat = await util.get(`core/service-providers/${this.data.providerId}/catalog`);
        const payload = cat && cat.data ? cat.data : cat;
        let rawGroups = payload && payload.groups ? payload.groups : payload;
        if (!Array.isArray(rawGroups) && payload && Array.isArray(payload.items)) {
          rawGroups = [{ group_key: 'all', group_label: '服务', items: payload.items }];
        }
        groups = normalizeCatalogGroups(Array.isArray(rawGroups) ? rawGroups : [], imgUrl);
      } catch (e2) {
        groups = [];
      }
      if (!groups.length) {
        groups = await this._fallbackCatalog(imgUrl);
      }
      this.setData({ providerName: name, groups, loading: false });
      this._recalcTotal();
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  async _fallbackCatalog(imgUrl) {
    try {
      const hot = await util.get('core/services/hot', { limit: 24 });
      const rows = unwrapList(hot);
      if (!rows.length) return [];
      const items = rows.map((s) => {
        const sid = s.id;
        const gk = s.group_key || 'tidy';
        return {
          service_id: sid,
          title: (s.title || s.name || '').replace(/【.*?】/g, '').trim() || '服务',
          price: s.price,
          priceText: moneyText(s.price),
          cover: imgUrl(s.cover_image || s.image || '/img/placeholders/home_cleaning.png'),
          cartKey: `${gk}:${sid}`
        };
      });
      return [{ group_key: 'hot', group_label: '热门服务', items }];
    } catch (e) {
      return [];
    }
  },

  cartKey(gk, sid) {
    return `${gk}:${sid}`;
  },

  incLine(e) {
    const gk = e.currentTarget.dataset.gk;
    const sid = e.currentTarget.dataset.sid;
    const key = this.cartKey(gk, sid);
    const cart = Object.assign({}, this.data.cart);
    const n = (cart[key] || 0) + 1;
    if (n > 99) return;
    cart[key] = n;
    this.setData({ cart });
    this._recalcTotal();
  },

  decLine(e) {
    const gk = e.currentTarget.dataset.gk;
    const sid = e.currentTarget.dataset.sid;
    const key = this.cartKey(gk, sid);
    const cart = Object.assign({}, this.data.cart);
    const n = Math.max((cart[key] || 0) - 1, 0);
    if (n === 0) delete cart[key];
    else cart[key] = n;
    this.setData({ cart });
    this._recalcTotal();
  },

  _recalcTotal() {
    const { groups, cart } = this.data;
    let sum = 0;
    (groups || []).forEach((grp) => {
      (grp.items || []).forEach((line) => {
        const q = cart[line.cartKey] || 0;
        if (q > 0) {
          sum += Number(line.price || 0) * q;
        }
      });
    });
    this.setData({ totalText: moneyText(sum) });
  },

  checkout() {
    const { providerId, providerName, groups, cart } = this.data;
    const items = [];
    (groups || []).forEach((grp) => {
      (grp.items || []).forEach((line) => {
        const q = cart[line.cartKey] || 0;
        if (q > 0) {
          items.push({
            service_id: line.service_id,
            group_key: grp.group_key,
            qty: q,
            title: line.title,
            price: line.price
          });
        }
      });
    });
    if (!items.length) {
      wx.showToast({ title: '请选择服务', icon: 'none' });
      return;
    }
    wx.setStorageSync('sp_bundle_checkout', {
      provider_id: providerId,
      provider_name: providerName,
      items
    });
    wx.navigateTo({
      url: `/pages/order-confrim/order-confrim?mode=sp_bundle&provider_id=${encodeURIComponent(providerId)}`
    });
  }
});
