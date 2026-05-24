const communityBind = require('../../utils/communityBind.js');
const util = require('../../utils/util.js');
const { getAuthToken, hasAuthToken } = require('../../utils/authToken.js');

function notifyIndexCommunityChanged() {
  const pages = getCurrentPages();
  const indexPage = pages.find((p) => p.route === 'pages/index/index');
  if (!indexPage) return;
  if (typeof indexPage._refreshLocationPill === 'function') indexPage._refreshLocationPill();
  if (typeof indexPage.refreshPortalListsForCommunity === 'function') {
    indexPage.refreshPortalListsForCommunity();
  }
  if (typeof indexPage.refreshLocalGoodsModulesForLocation === 'function') {
    indexPage.refreshLocalGoodsModulesForLocation();
  }
}

Page({
  data: {
    activeName: '',
    activeId: null,
    bindings: [],
    loading: false,
    saving: false,
    pendingCommunity: null,
    gpsAddress: '',
    bindingsApiAvailable: true,
    bindingsApiHint: ''
  },

  onLoad() {
    this._bindingsLoadSeq = 0;
    this._bindingsLoading = false;
    communityBind.takePrefetchBindings();
    this.refreshActive();
    this.loadBindings();
    this.loadGpsAddress();
  },

  onShow() {
    this.refreshActive();
    if (this._bindingsLoadedOnce) {
      this.loadBindings();
    }
  },

  refreshActive() {
    const active = communityBind.getActiveCommunity();
    this.setData({
      activeId: active ? active.id : null,
      activeName: active ? active.name : ''
    });
  },

  loadBindings() {
    const self = this;
    const seq = (this._bindingsLoadSeq = (this._bindingsLoadSeq || 0) + 1);
    this.setData({ loading: true });

    const token = getAuthToken();
    console.log('[bind-community] loadBindings token=', !!token);

    const applyResult = (result) => {
      if (seq !== self._bindingsLoadSeq) return;
      const activeId = communityBind.getStoredActiveId();
      const list = (result && result.list) || [];
      const bindingsApiAvailable = !!(result && result.bindingsApiAvailable);
      const bindings = list
        .filter((b) => b.name)
        .map((b) => ({
          ...b,
          is_active: Number(b.community_id) === Number(activeId)
        }));
      let bindingsApiHint = '';
      if (!hasAuthToken()) {
        bindingsApiHint = '未检测到登录状态，请先在「我的」页登录';
      } else if (!bindingsApiAvailable) {
        bindingsApiHint =
          bindings.length > 0
            ? '绑定列表接口未上线，以下为资料/本地缓存'
            : '绑定列表接口未上线，请搜索小区后绑定';
      }
      self.setData({
        bindings,
        bindingsApiAvailable,
        bindingsApiHint,
        loading: false
      });
      self.refreshActive();
      self._bindingsLoadedOnce = true;
    };

    const onFail = () => {
      if (seq !== self._bindingsLoadSeq) return;
      self.setData({
        bindings: [],
        bindingsApiAvailable: false,
        bindingsApiHint: '加载绑定失败',
        loading: false
      });
      self._bindingsLoadedOnce = true;
    };

    const bust = Date.now();
    const loadBindingList = () => {
      if (!token) {
        return communityBind.fetchBindings();
      }
      return util
        .get('user/community-bindings', { _t: bust })
        .then((res) => communityBind.buildBindingsFromApiResponse(res))
        .catch((e) => {
          console.warn('[bind-community] GET user/community-bindings', e);
          return communityBind.fetchBindings();
        });
    };

    return util
      .get('core/communities', { page: 1, page_size: 500, _t: bust })
      .catch((e) => {
        console.warn('[bind-community] GET core/communities', e);
        return null;
      })
      .then(loadBindingList)
      .then(applyResult)
      .catch(onFail);
  },

  loadGpsAddress() {
    const apiMod = require('../../api/index.js');
    const { withTimeout } = require('../../utils/asyncTimeout.js');
    if (this._gpsLoading) return;
    this._gpsLoading = true;

    const finish = (patch) => {
      this._gpsLoading = false;
      this.setData(patch);
    };

    withTimeout(
      new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject
        });
      }),
      10000,
      '定位'
    )
      .then(async (res) => {
        let text = '';
        try {
          const hit = await withTimeout(
            apiMod.core.resolveCommunity({
              latitude: res.latitude,
              longitude: res.longitude
            }),
            8000,
            '解析位置'
          );
          if (hit && hit.matched && hit.community_name) {
            text = hit.community_name;
          }
        } catch (e) {
          /* ignore */
        }
        if (!text) {
          text = `纬度 ${res.latitude.toFixed(5)}，经度 ${res.longitude.toFixed(5)}`;
        }
        finish({ gpsAddress: text, gpsLat: res.latitude, gpsLng: res.longitude });
      })
      .catch(() => {
        finish({ gpsAddress: '未能获取当前位置，请检查定位权限' });
      });
  },

  onRelocate() {
    this.setData({ gpsAddress: '正在获取位置…' });
    this.loadGpsAddress();
    wx.showToast({ title: '已刷新定位', icon: 'none' });
  },

  goSearch() {
    const city = this._guessCityFromBindings();
    let url = `/pages/community-search/community-search?city=${encodeURIComponent(city)}`;
    if (this.data.gpsLat != null && this.data.gpsLng != null) {
      url += `&latitude=${this.data.gpsLat}&longitude=${this.data.gpsLng}`;
    }
    wx.navigateTo({
      url,
      events: {
        selectCommunity: (item) => {
          const row = communityBind.setPendingSelectionLocally(item);
          if (!row) return;
          this.setData({ pendingCommunity: row });
          if (!hasAuthToken()) {
            communityBind.setActiveCommunity(row.id, row.name).then(() => {
              this.refreshActive();
              notifyIndexCommunityChanged();
              wx.showToast({ title: '已设为当前小区', icon: 'none' });
            });
          }
        }
      }
    });
  },

  _guessCityFromBindings() {
    const active = communityBind.getActiveCommunity();
    if (active && active.name) {
      const b = (this.data.bindings || []).find((x) => Number(x.community_id) === Number(active.id));
      if (b && b.city) return b.city;
    }
    return '上海市';
  },

  async onBindPending() {
    const item = this.data.pendingCommunity;
    if (!item || !item.id) return;
    if (!hasAuthToken()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '../login/login' }), 500);
      return;
    }
    const bindings = this.data.bindings || [];
    if (
      bindings.length >= communityBind.MAX_BINDINGS &&
      !bindings.some((b) => Number(b.community_id) === Number(item.id))
    ) {
      wx.showToast({ title: '最多绑定3个小区', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    wx.showLoading({ title: '绑定中' });
    try {
      await communityBind.bindCommunity(item.id, item);
      wx.hideLoading();
      wx.showToast({ title: '绑定成功', icon: 'success' });
      this.setData({ pendingCommunity: null });
      return this.loadBindings().then(() => notifyIndexCommunityChanged());
    } catch (err) {
      wx.hideLoading();
      const communityBindUtil = require('../../utils/communityBind.js');
      wx.showToast({
        title: communityBindUtil.apiErrorMessage(err, '绑定失败'),
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onSwitchBinding(e) {
    const { id, name } = e.currentTarget.dataset;
    if (!id) return;
    wx.showLoading({ title: '切换中', mask: true });
    try {
      await communityBind.setActiveCommunity(id, name);
      wx.hideLoading();
      wx.showToast({ title: '已切换', icon: 'success' });
      return this.loadBindings().then(() => notifyIndexCommunityChanged());
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: communityBind.apiErrorMessage(err, '切换失败'),
        icon: 'none'
      });
    }
  },

  onUnbind(e) {
    const { id, name } = e.currentTarget.dataset;
    if (!id) return;
    wx.showModal({
      title: '解绑小区',
      content: `确定解绑「${name || '该小区'}」吗？`,
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '解绑中' });
        try {
          await communityBind.unbindCommunity(id);
          wx.hideLoading();
          wx.showToast({ title: '已解绑', icon: 'success' });
          return this.loadBindings();
        } catch (err) {
          wx.hideLoading();
          const communityBindUtil = require('../../utils/communityBind.js');
          wx.showToast({
            title: communityBindUtil.apiErrorMessage(err, '解绑失败'),
            icon: 'none'
          });
        }
      }
    });
  }
});
