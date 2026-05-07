const app = getApp();
const api = require('../../../api/index.js');

Page({
  data: {
    list: [],
    showForm: false,
    editingId: null,
    form: { name: '', price: '', desc: '' },
    loading: false
  },

  onShow() {
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await api.worker.getMyServices({ page: 1, limit: 100 });
      const data = res && res.data ? res.data : res;
      const rawList = data && data.list ? data.list : (Array.isArray(data) ? data : []);
      const list = rawList.map(s => ({
        id: s.id,
        name: s.name || '',
        price: s.price != null ? String(s.price) : '',
        desc: s.desc || ''
      }));
      this.setData({ list, loading: false });
    } catch (e) {
      console.warn('加载服务列表失败:', e);
      this.setData({ list: [], loading: false });
      const errno = e && Number(e.errno);
      if (errno !== 404 && errno !== 501) {
        wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      }
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

  async saveForm() {
    const { form, editingId } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写服务名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });
    try {
      if (editingId) {
        await api.worker.updateService(editingId, {
          name: form.name.trim(),
          price: form.price.trim(),
          desc: form.desc.trim()
        });
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await api.worker.createService({
          name: form.name.trim(),
          price: form.price.trim(),
          desc: form.desc.trim()
        });
        wx.showToast({ title: '创建成功', icon: 'success' });
      }
      this.setData({ showForm: false, editingId: null, form: { name: '', price: '', desc: '' } });
      this.loadList();
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  editItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find(x => String(x.id) === String(id));
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
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中...', mask: true });
        try {
          await api.worker.deleteService(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadList();
        } catch (e) {
          wx.showToast({ title: (e && e.errmsg) || '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
