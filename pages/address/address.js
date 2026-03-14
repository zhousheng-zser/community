// pages/address/address.js
const util = require('../../utils/util.js');

const EMPTY_FORM = {
  show: false,
  id: null,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  tag: '家',
  isDefault: false,
};

Page({
  data: {
    list: [],
    loading: true,
    tags: ['家', '公司', '学校', '其他'],
    form: Object.assign({}, EMPTY_FORM),
    canSave: false,
  },

  onLoad() {
    this.loadAddresses();
  },

  onShow() {
    this.loadAddresses();
  },

  // ===== 加载地址列表 =====
  async loadAddresses() {
    this.setData({ loading: true });
    try {
      const res = await util.get('user/addresses');
      const list = Array.isArray(res) ? res : (res.list || []);
      this.setData({ list, loading: false });
    } catch (e) {
      // 后端暂不支持时使用本地缓存
      const cached = wx.getStorageSync('address_list') || [];
      this.setData({ list: cached, loading: false });
    }
  },

  // ===== 打开新增弹窗 =====
  addAddress() {
    this.setData({
      form: Object.assign({}, EMPTY_FORM, { show: true }),
      canSave: false,
    });
  },

  // ===== 打开编辑弹窗 =====
  editAddress(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      form: Object.assign({}, EMPTY_FORM, item, { show: true }),
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

  // ===== 选择地区 =====
  chooseRegion() {
    wx.chooseLocation({
      success: () => {},
      fail: () => {}
    });
    // 使用 picker 方式选择省市区
    wx.showActionSheet({
      itemList: ['使用省市区选择器'],
      success: () => {}
    });
    // 直接用 wx API 的地区选择
    const self = this;
    wx.getLocation({
      type: 'wgs84',
      success() {},
      fail() {}
    });
    // 采用简单的三级联动方式
    self._openRegionPicker();
  },

  _openRegionPicker() {
    const self = this;
    // WeChat 内置地区选择
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
        // 降级：手动输入省市区
        wx.showModal({
          title: '选择地区',
          content: '暂不支持地图选择，请在详细地址中输入完整地址',
          showCancel: false,
        });
      }
    });
  },

  // ===== 验证是否可以保存 =====
  _checkCanSave(form) {
    return !!(form.name && form.phone && form.phone.length === 11 && form.detail);
  },

  // ===== 保存地址 =====
  async saveAddress() {
    if (!this.data.canSave) return;
    const form = this.data.form;
    const payload = {
      name: form.name,
      phone: form.phone,
      province: form.province,
      city: form.city,
      district: form.district,
      detail: form.detail,
      tag: form.tag,
      isDefault: form.isDefault,
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
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.closeForm();
  },

  // ===== 设为默认 =====
  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await util.post('user/addresses/' + id + '/default', {});
      this.loadAddresses();
    } catch (e) {
      // 本地模拟
      let list = this.data.list.map(item =>
        Object.assign({}, item, { isDefault: item.id === id })
      );
      wx.setStorageSync('address_list', list);
      this.setData({ list });
      wx.showToast({ title: '已设为默认', icon: 'success' });
    }
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
          this.loadAddresses();
        } catch (err) {
          // 本地模拟
          let list = this.data.list.filter(item => item.id !== id);
          wx.setStorageSync('address_list', list);
          this.setData({ list });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },
});
