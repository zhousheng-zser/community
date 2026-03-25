// pages/address/address.js
const util = require('../../utils/util.js');
const geo = require('../../utils/geo.js');

/** 通知首页本地集市：地址有变，需重算定位并刷新分类店铺 */
function notifyHomeMarketAddressChanged() {
  try {
    wx.setStorageSync('market_refresh_after_address', Date.now());
  } catch (e) {}
}

const EMPTY_FORM = {
  show: false,
  id: null,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  /** 地图选点（GCJ-02，与 wx.getLocation / chooseLocation 一致） */
  latitude: null,
  longitude: null,
  locationPoiName: '',
  tag: '家',
  isDefault: false,
};

const EMPTY_PICK_FORM = { address: '', door: '', name: '', gender: '先生', phone: '', isDefault: false };

Page({
  data: {
    list: [],
    loading: true,
    tags: ['家', '公司', '学校', '其他'],
    form: Object.assign({}, EMPTY_FORM),
    canSave: false,
    // pick mode
    pickMode: false,
    sourceField: 'currentForm.from',
    pickForm: Object.assign({}, EMPTY_PICK_FORM),
  },

  onLoad(options) {
    if (options && options.mode === 'pick') {
      const pickForm = Object.assign({}, EMPTY_PICK_FORM);
      // pre-fill from default saved address
      const cached = wx.getStorageSync('address_list') || [];
      const def = cached.find(a => a.isDefault) || cached[0];
      if (def) {
        pickForm.address = def._rawAddress || [def.province, def.city, def.district].filter(Boolean).join('');
        pickForm.door = def.detail || '';
        pickForm.name = def.name || '';
        pickForm.gender = def.gender || '先生';
        pickForm.phone = def.phone || '';
      }
      this.setData({ pickMode: true, sourceField: options.field || 'currentForm.from', pickForm });
    } else {
      this.loadAddresses();
    }
  },

  onShow() {
    if (!this.data.pickMode) this.loadAddresses();
  },

  /**
   * 统一 is_default / isDefault；仅一条地址时视为默认（与产品、本地集市定位一致，仍请后端落库 is_default）
   */
  _normalizeAddressList(raw) {
    const arr = Array.isArray(raw) ? raw : [];
    const mapped = arr.map((item) => {
      const isDef =
        item.isDefault === true ||
        item.isDefault === 1 ||
        item.is_default === true ||
        item.is_default === 1;
      return Object.assign({}, item, { isDefault: !!isDef });
    });
    if (mapped.length === 1) {
      return [Object.assign({}, mapped[0], { isDefault: true })];
    }
    return mapped;
  },

  // ===== 加载地址列表 =====
  async loadAddresses() {
    this.setData({ loading: true });
    try {
      const res = await util.get('user/addresses');
      const list = this._normalizeAddressList(Array.isArray(res) ? res : (res.list || []));
      this.setData({ list, loading: false });
    } catch (e) {
      // 后端暂不支持时使用本地缓存
      const cached = wx.getStorageSync('address_list') || [];
      this.setData({ list: this._normalizeAddressList(cached), loading: false });
    }
  },

  // ===== 打开新增弹窗 =====
  addAddress() {
    const isFirst = !this.data.list || this.data.list.length === 0;
    this.setData({
      form: Object.assign({}, EMPTY_FORM, { show: true, isDefault: isFirst }),
      canSave: false,
    });
  },

  // ===== 打开编辑弹窗 =====
  editAddress(e) {
    const item = e.currentTarget.dataset.item || {};
    const merged = Object.assign({}, item, {
      locationPoiName: item.location_poi_name || item.locationPoiName || '',
      latitude: item.latitude != null ? item.latitude : item.lat,
      longitude: item.longitude != null ? item.longitude : item.lng,
    });
    this.setData({
      form: Object.assign({}, EMPTY_FORM, merged, { show: true }),
      canSave: true,
    });
  },

  // ===== 关闭弹窗 =====
  closeForm() {
    this.setData({ form: Object.assign({}, EMPTY_FORM) });
  },

  // ===== 表单输入 =====
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const form = Object.assign({}, this.data.form, { [field]: value });
    this.setData({ form, canSave: this._checkCanSave(form) });
  },

  // ===== 选择标签 =====
  selectTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const form = Object.assign({}, this.data.form, { tag });
    this.setData({ form });
  },

  // ===== 默认地址开关 =====
  onDefaultChange(e) {
    const form = Object.assign({}, this.data.form, { isDefault: e.detail.value });
    this.setData({ form });
  },

  // ===== 选择地区：地图选点 / 微信地址导入（参考外卖类 App：主路径为地图 POI） =====
  chooseRegion() {
    const self = this;
    wx.showActionSheet({
      itemList: ['地图选点', '从微信地址导入省市区'],
      success(res) {
        if (res.tapIndex === 0) self.pickAddressOnMap();
        else if (res.tapIndex === 1) self.chooseRegionFromWechat();
      },
    });
  },

  /** 调起微信地图选点，回填经纬度、省市区与详细地址 */
  pickAddressOnMap() {
    const self = this;
    wx.chooseLocation({
      success(res) {
        const addrStr = (res.address || '').trim();
        const parsed = geo.parseRegionFromAddress(addrStr);
        const poi = (res.name || '').trim();
        const detailFromMap = [poi, parsed.detail || ''].filter(Boolean).join(' ').trim()
          || [addrStr, poi].filter(Boolean).join(' ').trim();
        const form = Object.assign({}, self.data.form, {
          latitude: res.latitude,
          longitude: res.longitude,
          locationPoiName: poi,
          province: parsed.province || self.data.form.province,
          city: parsed.city || self.data.form.city,
          district: parsed.district || self.data.form.district,
          detail: self.data.form.detail || detailFromMap,
        });
        self.setData({ form, canSave: self._checkCanSave(form) });
        wx.showToast({ title: '已选择地图位置', icon: 'success' });
      },
      fail(err) {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return;
        wx.showModal({
          title: '无法打开地图',
          content: '请在手机设置中允许定位，或稍后重试。',
          showCancel: false,
        });
      },
    });
  },

  /** 使用微信通讯录地址填充省市区（与地图选点互补） */
  chooseRegionFromWechat() {
    const self = this;
    wx.chooseAddress({
      success(res) {
        const form = Object.assign({}, self.data.form, {
          province: res.provinceName,
          city: res.cityName,
          district: res.countyName,
          detail: self.data.form.detail || res.detailInfo || '',
        });
        self.setData({ form, canSave: self._checkCanSave(form) });
      },
      fail() {
        wx.showModal({
          title: '提示',
          content: '未获取到微信地址，可使用「地图选点」或在详细地址中手动填写完整地址。',
          showCancel: false,
        });
      },
    });
  },

  // ===== 验证是否可以保存 =====
  _checkCanSave(form) {
    const phoneOk = form.phone && String(form.phone).length === 11;
    const detailOk = !!(form.detail && String(form.detail).trim());
    const mapOk =
      form.latitude != null &&
      form.longitude != null &&
      !Number.isNaN(Number(form.latitude)) &&
      !Number.isNaN(Number(form.longitude));
    const regionOk = !!(form.province && form.city && form.district) || mapOk;
    return !!(form.name && phoneOk && detailOk && regionOk);
  },

  // ===== 保存地址 =====
  async saveAddress() {
    if (!this.data.canSave) return;
    const form = this.data.form;
    const list = this.data.list || [];
    // 首条收货地址强制为默认，便于无 GPS 时本地集市用该坐标
    const isFirstAddress = !form.id && list.length === 0;
    const payload = {
      name: form.name,
      phone: form.phone,
      province: form.province,
      city: form.city,
      district: form.district,
      detail: form.detail,
      tag: form.tag,
      isDefault: isFirstAddress ? true : !!form.isDefault,
      latitude: form.latitude,
      longitude: form.longitude,
      location_poi_name: form.locationPoiName || '',
    };

    wx.showLoading({ title: '保存中...' });
    try {
      if (form.id) {
        await util.post('user/addresses/' + form.id, payload);
      } else {
        await util.post('user/addresses', payload);
      }
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      notifyHomeMarketAddressChanged();
      this.closeForm();
      this.loadAddresses();
    } catch (e) {
      wx.hideLoading();
      // 后端未实现时，本地存储模拟
      this._saveLocal(form.id, payload);
    }
  },

  // ===== 本地存储模拟（后端未实现时兜底） =====
  _saveLocal(id, payload) {
    let list = wx.getStorageSync('address_list') || [];
    if (id) {
      list = list.map(item => item.id === id ? Object.assign({}, item, payload) : item);
    } else {
      const newItem = Object.assign({ id: Date.now() }, payload);
      if (newItem.isDefault) {
        list = list.map(item => Object.assign({}, item, { isDefault: false }));
      }
      list.unshift(newItem);
    }
    // 保证只有一个默认
    if (payload.isDefault) {
      list = list.map(item => Object.assign({}, item, { isDefault: item.id === (id || list[0].id) }));
    }
    wx.setStorageSync('address_list', list);
    this.setData({ list });
    notifyHomeMarketAddressChanged();
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.closeForm();
  },

  // ===== 设为默认 =====
  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await util.post('user/addresses/' + id + '/default', {});
      notifyHomeMarketAddressChanged();
      this.loadAddresses();
    } catch (e) {
      // 本地模拟
      let list = this.data.list.map(item =>
        Object.assign({}, item, { isDefault: item.id === id })
      );
      wx.setStorageSync('address_list', list);
      this.setData({ list });
      notifyHomeMarketAddressChanged();
      wx.showToast({ title: '已设为默认', icon: 'success' });
    }
  },

  // ===== PICK MODE 方法 =====
  pickLocation() {
    wx.chooseLocation({
      success: (res) => {
        const addr = (res.address || '') + (res.name && res.name !== res.address ? ' ' + res.name : '');
        if (addr.trim()) this.setData({ 'pickForm.address': addr.trim() });
      },
      fail() {}
    });
  },

  onPickInput(e) {
    this.setData({ [`pickForm.${e.currentTarget.dataset.field}`]: e.detail.value });
  },

  setPickGender(e) {
    this.setData({ 'pickForm.gender': e.currentTarget.dataset.gender });
  },

  onPickDefault(e) {
    this.setData({ 'pickForm.isDefault': e.detail.value });
  },

  saveAndUse() {
    const { pickForm, sourceField } = this.data;
    if (!pickForm.address && !pickForm.door) {
      return wx.showToast({ title: '请填写服务地址', icon: 'none' });
    }
    const fullAddr = [pickForm.address, pickForm.door].filter(Boolean).join(' ');
    // save locally for future pre-fill
    if (pickForm.name || pickForm.isDefault) {
      let list = wx.getStorageSync('address_list') || [];
      if (pickForm.isDefault) list = list.map(a => Object.assign({}, a, { isDefault: false }));
      list.unshift({ id: Date.now(), name: pickForm.name, phone: pickForm.phone, gender: pickForm.gender, detail: pickForm.door, _rawAddress: pickForm.address, isDefault: pickForm.isDefault, tag: '家' });
      wx.setStorageSync('address_list', list);
      notifyHomeMarketAddressChanged();
    }
    // pass data back to calling page
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      pages[pages.length - 2].setData({ [sourceField]: fullAddr });
    }
    wx.navigateBack();
  },

  // ===== 删除地址 =====
  deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await util.post('user/addresses/' + id + '/delete', {});
          notifyHomeMarketAddressChanged();
          this.loadAddresses();
        } catch (err) {
          // 本地模拟
          let list = this.data.list.filter(item => item.id !== id);
          wx.setStorageSync('address_list', list);
          this.setData({ list });
          notifyHomeMarketAddressChanged();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },
});
