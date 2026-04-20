/**
 * 本地偏好：隐私可见性、通知开关、商城搜索历史、最近浏览、系统通知缓存（无后端时兜底）
 */
const PUBLISH = 'privacy_publish_v1';
const REPLY = 'privacy_reply_v1';
const NOTIFY = 'notify_prefs_v1';
const SEARCH = 'mall_search_history_v1';
const RECENT = 'mall_recent_goods_v1';
const SYS = 'system_notices_v1';
const ANN = 'community_announce_read_v1';

function get(key, def) {
  try {
    const v = wx.getStorageSync(key);
    return v !== '' && v != null ? v : def;
  } catch (e) {
    return def;
  }
}

function set(key, val) {
  try {
    wx.setStorageSync(key, val);
  } catch (e) {}
}

module.exports = {
  visibilityOptions: [
    { id: 'all', label: '所有人' },
    { id: 'followers', label: '仅关注我的人' },
    { id: 'self', label: '仅自己' }
  ],

  getPublishVisibility() {
    return get(PUBLISH, 'all');
  },
  setPublishVisibility(v) {
    set(PUBLISH, v);
  },
  getReplyVisibility() {
    return get(REPLY, 'all');
  },
  setReplyVisibility(v) {
    set(REPLY, v);
  },

  getNotifyPrefs() {
    return (
      get(NOTIFY, null) || {
        order: true,
        system: true,
        marketing: true
      }
    );
  },
  setNotifyPrefs(p) {
    set(NOTIFY, p);
  },

  getSearchHistory() {
    const arr = get(SEARCH, []);
    return Array.isArray(arr) ? arr : [];
  },
  addSearchHistory(q) {
    const s = String(q || '').trim();
    if (!s) return;
    let arr = this.getSearchHistory().filter((x) => x !== s);
    arr.unshift(s);
    arr = arr.slice(0, 20);
    set(SEARCH, arr);
  },
  clearSearchHistory() {
    wx.removeStorageSync(SEARCH);
  },

  getRecentGoods() {
    const arr = get(RECENT, []);
    return Array.isArray(arr) ? arr : [];
  },
  addRecentGood(item) {
    if (!item || !item.id) return;
    let arr = this.getRecentGoods().filter((x) => Number(x.id) !== Number(item.id));
    arr.unshift({
      id: item.id,
      name: item.name || item.title || '商品',
      image: item.image || item.cover || '',
      price: item.price != null ? item.price : ''
    });
    arr = arr.slice(0, 12);
    set(RECENT, arr);
  },

  getSystemNotices() {
    const arr = get(SYS, []);
    return Array.isArray(arr) ? arr : [];
  },
  pushSystemNotice(row) {
    const list = this.getSystemNotices();
    const id = row.id || `sys_${Date.now()}`;
    const next = [{ id, title: row.title || '通知', content: row.content || '', time: row.time || new Date().toISOString(), read: false }, ...list].slice(0, 50);
    set(SYS, next);
  },
  markAllSystemRead() {
    const list = this.getSystemNotices().map((x) => Object.assign({}, x, { read: true }));
    set(SYS, list);
  },
  markSystemRead(id) {
    const list = this.getSystemNotices().map((x) => (String(x.id) === String(id) ? Object.assign({}, x, { read: true }) : x));
    set(SYS, list);
  },
  seedSystemIfEmpty() {
    if (this.getSystemNotices().length > 0) return;
    this.pushSystemNotice({
      id: 'welcome_1',
      title: '欢迎使用惠民社区',
      content: '订单与系统消息将展示在「消息-通知」中。',
      time: new Date().toISOString()
    });
  },

  getAnnounceReadIds() {
    const o = get(ANN, {});
    return o && typeof o === 'object' ? o : {};
  },
  markAnnounceRead(id) {
    const o = this.getAnnounceReadIds();
    o[String(id)] = 1;
    set(ANN, o);
  },
  markAllAnnounceRead(ids) {
    const o = this.getAnnounceReadIds();
    (ids || []).forEach((id) => {
      o[String(id)] = 1;
    });
    set(ANN, o);
  },

  WALLET_TX: 'wallet_tx_v1',
  getWalletTransactions() {
    const arr = get(this.WALLET_TX, []);
    return Array.isArray(arr) ? arr : [];
  },
  pushWalletTransaction(row) {
    let list = this.getWalletTransactions();
    list.unshift(
      Object.assign(
        {
          id: `tx_${Date.now()}`,
          t: Date.now()
        },
        row
      )
    );
    list = list.slice(0, 100);
    set(this.WALLET_TX, list);
  }
};
