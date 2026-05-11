const util = require('../../utils/util.js');
const { unwrapList } = util;
const app = getApp();
const browseFootprint = require('../../utils/browseFootprint.js');
const serviceFavStore = require('../../utils/serviceFavStore.js');

function moneyText(v) {
  if (v == null || v === '') return '0';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function toBool(v) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === 'yes' || s === 'y') return true;
    if (s === 'false' || s === 'no' || s === 'n') return false;
  }
  return null;
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? parseInt(n, 10) : null;
}

function normalizeIdList(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => toInt(x)).filter((x) => x != null);
}

function getCurrentCommunityId() {
  const gd = app.globalData || {};
  return toInt(gd.communityId || gd.community_id || wx.getStorageSync('community_id') || wx.getStorageSync('communityId'));
}

function resolveSaleState(line) {
  const status = String(line.status || '').trim();
  const onShelfRaw = toBool(line.on_shelf != null ? line.on_shelf : line.onShelf);
  const isPublishedRaw = toBool(
    line.is_published != null ? line.is_published
      : (line.isPublished != null ? line.isPublished : line.published)
  );

  const hasSaleField = status || onShelfRaw != null || isPublishedRaw != null;
  let unsupportedBySale = false;
  if (hasSaleField) {
    if (status && status !== 'on_sale') unsupportedBySale = true;
    if (onShelfRaw === false) unsupportedBySale = true;
    if (isPublishedRaw === false) unsupportedBySale = true;
  }

  const communityId = getCurrentCommunityId();
  const allow = normalizeIdList(
    line.supported_community_ids != null ? line.supported_community_ids
      : (line.supportedCommunityIds != null ? line.supportedCommunityIds : line.community_ids)
  );
  const deny = normalizeIdList(
    line.blocked_community_ids != null ? line.blocked_community_ids
      : (line.blockedCommunityIds != null ? line.blockedCommunityIds : line.unsupported_community_ids)
  );
  const communitySupported = toBool(
    line.community_supported != null ? line.community_supported
      : (line.communitySupported != null ? line.communitySupported : line.is_available)
  );
  let unsupportedByCommunity = false;
  if (communitySupported === false) unsupportedByCommunity = true;
  if (communityId != null) {
    if (allow.length > 0 && !allow.includes(communityId)) unsupportedByCommunity = true;
    if (deny.includes(communityId)) unsupportedByCommunity = true;
  }

  const unsupported = unsupportedBySale || unsupportedByCommunity;
  return {
    status,
    onShelf: onShelfRaw,
    isPublished: isPublishedRaw,
    unsupported,
    saleStatusText: unsupported ? '不可提供' : ''
  };
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
      const sale = resolveSaleState(line);
      return {
        service_id: sid,
        title: line.title || line.name || line.goodsTitle || '服务',
        sub: line.sub_title || line.subtitle || '',
        desc: line.description ? String(line.description).slice(0, 60) : '',
        price: line.price,
        priceText: moneyText(line.price),
        cover: imgUrlFn(line.cover_image || line.image || 'https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png'),
        cartKey,
        unsupported: sale.unsupported,
        saleStatusText: sale.saleStatusText,
        status: sale.status,
        on_shelf: sale.onShelf,
        is_published: sale.isPublished
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
    providerCover: '',
    providerDesc: '',
    providerPhone: '',
    groups: [],
    cart: {},
    totalText: '0',
    favorited: false
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

  onShow() {
    if (this.data.providerId) {
      this.setData({ favorited: serviceFavStore.has('service_provider', this.data.providerId) });
    }
  },

  toggleFavorite() {
    const pid = this.data.providerId;
    if (!pid) return;
    const now = serviceFavStore.toggle({
      kind: 'service_provider',
      id: pid,
      title: this.data.providerName || '服务商',
      cover: this.data.providerCover || '',
      url: `/pages/service-provider-shop/service-provider-shop?provider_id=${encodeURIComponent(String(pid))}`
    });
    this.setData({ favorited: now });
    wx.showToast({ title: now ? '已收藏' : '已取消收藏', icon: 'none' });
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
      const name = (inner && (inner.name || inner.shop_name || inner.display_name)) || '服务商';
      const cover = imgUrl(inner && (inner.cover_image || inner.shop_front_url || inner.avatar_url || inner.avatar) || '');
      const desc = (inner && (inner.description || inner.subtitle || inner.tagline)) || '';
      const phone = (inner && inner.phone) || '';

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
      this.setData({ providerName: name, providerCover: cover, providerDesc: desc, providerPhone: phone, groups, loading: false });
      try {
        browseFootprint.record({
          kind: 'service_provider',
          dedupeKey: `service_provider:${this.data.providerId}`,
          title: name || '服务商',
          cover: cover || '',
          url: `/pages/service-provider-shop/service-provider-shop?provider_id=${encodeURIComponent(String(this.data.providerId))}`
        });
      } catch (e) {}
      this.setData({ favorited: serviceFavStore.has('service_provider', this.data.providerId) });
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
        const sale = resolveSaleState(s);
        return {
          service_id: sid,
          title: (s.title || s.name || '').replace(/【.*?】/g, '').trim() || '服务',
          price: s.price,
          priceText: moneyText(s.price),
          cover: imgUrl(s.cover_image || s.image || 'https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png'),
          cartKey: `${gk}:${sid}`,
          unsupported: sale.unsupported,
          saleStatusText: sale.saleStatusText,
          status: sale.status,
          on_shelf: sale.onShelf,
          is_published: sale.isPublished
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
    const unsupported = !!e.currentTarget.dataset.unsupported;
    if (unsupported) {
      wx.showToast({ title: '当前小区暂不支持该服务', icon: 'none' });
      return;
    }
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

  callProvider() {
    const phone = this.data.providerPhone;
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  checkout() {
    const { providerId, providerName, groups, cart } = this.data;
    const items = [];
    const blockedTitles = [];
    (groups || []).forEach((grp) => {
      (grp.items || []).forEach((line) => {
        const q = cart[line.cartKey] || 0;
        if (q > 0) {
          if (line.unsupported) {
            blockedTitles.push(line.title || '服务');
            return;
          }
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
    if (blockedTitles.length) {
      wx.showToast({ title: `含不可提供服务：${blockedTitles[0]}`, icon: 'none' });
      return;
    }
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
