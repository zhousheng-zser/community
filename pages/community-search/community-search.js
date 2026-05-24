const {
  DEFAULT_CITIES,
  searchCommunities,
  collectCitiesFromList,
  normalizeCommunityRow,
  getCityMapCenter
} = require('../../utils/communitySearch.js');

Page({
  data: {
    cities: DEFAULT_CITIES,
    cityIndex: 0,
    currentCity: DEFAULT_CITIES[0],
    keyword: '',
    list: [],
    loading: false,
    mapCenter: getCityMapCenter(DEFAULT_CITIES[0]),
    mapScale: 11,
    markers: [],
    circles: [],
    focusedId: null,
    scrollIntoView: ''
  },

  _searchTimer: null,
  _gps: null,
  /** 仅点击「定位」后为 true；切换城市后按城市筛列表，不再用 GPS 拉全国 */
  _sortByGps: false,

  onLoad(options) {
    const city = options.city ? decodeURIComponent(options.city) : DEFAULT_CITIES[0];
    let cities = DEFAULT_CITIES.slice();
    if (city && !cities.includes(city)) cities = [city].concat(cities);
    const cityIndex = Math.max(0, cities.indexOf(city));
    const lat = options.latitude != null ? Number(options.latitude) : NaN;
    const lng = options.longitude != null ? Number(options.longitude) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this._gps = { latitude: lat, longitude: lng };
    }
    const currentCity = cities[cityIndex];
    this.setData({
      cities,
      cityIndex,
      currentCity,
      mapCenter: getCityMapCenter(currentCity),
      mapScale: 11,
      focusedId: null
    });
    this.loadList();
  },

  onUnload() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
  },

  onCityChange(e) {
    const idx = Number(e.detail.value);
    const city = this.data.cities[idx] || DEFAULT_CITIES[0];
    this._sortByGps = false;
    this.setData({
      cityIndex: idx,
      currentCity: city,
      focusedId: null,
      mapCenter: getCityMapCenter(city),
      mapScale: 11,
      list: [],
      markers: [],
      circles: []
    });
    this.loadList();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.loadList(), 400);
  },

  onSearch() {
    this.loadList();
  },

  _buildMapOverlays(list, focusedId) {
    const markers = [];
    const circles = [];
    let latSum = 0;
    let lngSum = 0;
    let count = 0;

    (list || []).forEach((item) => {
      if (item.latitude == null || item.longitude == null) return;
      const isFocused = focusedId != null && Number(item.id) === Number(focusedId);
      markers.push({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.name,
        width: isFocused ? 36 : 28,
        height: isFocused ? 36 : 28,
        callout: {
          content: item.name,
          display: isFocused ? 'ALWAYS' : 'BYCLICK',
          padding: 6,
          borderRadius: 4,
          fontSize: 12
        }
      });
      if (item.radius_meters > 0) {
        circles.push({
          latitude: item.latitude,
          longitude: item.longitude,
          radius: item.radius_meters,
          color: isFocused ? '#e85d0488' : '#22c55e55',
          fillColor: isFocused ? '#e85d0422' : '#22c55e22',
          strokeWidth: 1
        });
      }
      latSum += item.latitude;
      lngSum += item.longitude;
      count += 1;
    });

    return { markers, circles, latSum, lngSum, count };
  },

  async loadList(keepFocus) {
    this.setData({ loading: true });
    try {
      const { city, keyword, focusedId } = this.data;
      const gps = this._sortByGps && this._gps ? this._gps : {};
      const { list } = await searchCommunities({
        city,
        keyword,
        page: 1,
        page_size: 100,
        latitude: gps.latitude,
        longitude: gps.longitude
      });
      const cities = collectCitiesFromList(list);
      let merged = this.data.cities.slice();
      cities.forEach((c) => {
        if (!merged.includes(c)) merged.push(c);
      });

      const fid = keepFocus ? focusedId : null;
      const { markers, circles, latSum, lngSum, count } = this._buildMapOverlays(list, fid);

      let mapCenter = this.data.mapCenter;
      let mapScale = this.data.mapScale;
      if (!keepFocus || !fid) {
        if (count > 0) {
          mapCenter = { latitude: latSum / count, longitude: lngSum / count };
          mapScale = count > 3 ? 12 : 11;
        } else {
          mapCenter = getCityMapCenter(city);
          mapScale = 11;
        }
      }

      this.setData({
        list,
        loading: false,
        markers,
        circles,
        mapCenter,
        mapScale,
        cities: merged,
        focusedId: fid
      });
    } catch (e) {
      this.setData({ list: [], loading: false, markers: [], circles: [], focusedId: null });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  _focusOnCommunity(item) {
    if (!item) return;
    if (item.latitude == null || item.longitude == null) {
      wx.showToast({ title: '该小区暂无地图坐标', icon: 'none' });
      return;
    }
    const { markers, circles } = this._buildMapOverlays(this.data.list, item.id);
    this.setData({
      focusedId: item.id,
      mapCenter: { latitude: item.latitude, longitude: item.longitude },
      mapScale: 15,
      markers,
      circles,
      scrollIntoView: `comm-${item.id}`
    });
  },

  onLocateMe() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this._gps = { latitude: res.latitude, longitude: res.longitude };
        this._sortByGps = true;
        this.setData({
          mapCenter: { latitude: res.latitude, longitude: res.longitude },
          mapScale: 14,
          focusedId: null
        });
        const ctx = wx.createMapContext('communityMap', this);
        if (ctx && ctx.moveToLocation) {
          ctx.moveToLocation();
        }
        this.loadList(false);
      },
      fail: () => {
        wx.showToast({ title: '无法获取当前位置', icon: 'none' });
      }
    });
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    const item = (this.data.list || []).find((x) => Number(x.id) === Number(markerId));
    if (item) this._focusOnCommunity(item);
  },

  onItemTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    const item = (this.data.list || []).find((x) => Number(x.id) === id);
    if (item) this._focusOnCommunity(item);
  },

  onSelect(e) {
    const id = Number(e.currentTarget.dataset.id);
    const item = (this.data.list || []).find((x) => Number(x.id) === id);
    if (item) this._emitSelect(item);
  },

  _emitSelect(item) {
    const row = normalizeCommunityRow(item);
    if (!row) return;
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel) channel.emit('selectCommunity', row);
    wx.navigateBack();
  }
});
