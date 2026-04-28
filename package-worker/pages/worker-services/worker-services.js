const app = getApp();
const util = require('../../../utils/util.js');

function getStorageKey() {
  const uid = (app.globalData.user || {}).id || '0';
  return 'worker_services_' + uid;
}

Page({
  data: {
    list: [],
    showForm: false,
    editingId: null,
    form: { name: '', price: '', desc: '' }
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    try {
      const list = wx.getStorageSync(getStorageKey()) || [];
      this.setData({ list });
    } catch (e) {
      this.setData({ list: [] });
    }
  },

  toggleForm() {
    this.setData({
      showForm: !this.data.showForm,
      editingId: null,
      form: { name: '', price: '', desc: '' }
    });
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['form.' + key]: e.detail.value });
  },

  saveForm() {
    const { form, editingId, list } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写服务名称', icon: 'none' });
      return;
    }
    const item = {
      id: editingId || 'ws_' + Date.now(),
      name: form.name.trim(),
      price: form.price.trim(),
      desc: form.desc.trim()
    };
    let next;
    if (editingId) {
      next = list.map(x => x.id === editingId ? item : x);
    } else {
      next = [item, ...list];
    }
    try {
      wx.setStorageSync(getStorageKey(), next);
    } catch (e) {}
    this.setData({ list: next, showForm: false, editingId: null, form: { name: '', price: '', desc: '' } });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  editItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find(x => x.id === id);
    if (!item) return;
    this.setData({
      showForm: true,
      editingId: id,
      form: { name: item.name, price: item.price, desc: item.desc || '' }
    });
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: (res) => {
        if (!res.confirm) return;
        const next = this.data.list.filter(x => x.id !== id);
        try {
          wx.setStorageSync(getStorageKey(), next);
        } catch (e) {}
        this.setData({ list: next });
        wx.showToast({ title: '已删除', icon: 'success' });
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
