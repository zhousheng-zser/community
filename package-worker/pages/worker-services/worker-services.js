const app = getApp();
const api = require('../../../api/index.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    list: [],
    showForm: false,
    editingId: null,
    form: { name: '', price: '', desc: '', cover_image: '' },
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
      const list = rawList.map((s) => ({
        id: s.id,
        name: s.name || '',
        price: s.price != null ? String(s.price) : '',
        desc: s.desc || s.description || '',
        cover_image: s.cover_image ? util.imgUrl(s.cover_image) : ''
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
      form: { name: '', price: '', desc: '', cover_image: '' }
    });
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['form.' + key]: e.detail.value });
  },

  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const path = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!path) return;
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          const up = await util.uploadFile('upload', path, 'file');
          const url = (up && (up.url || up.path || up.file_url)) || (typeof up === 'string' ? up : '');
          if (!url) {
            wx.showToast({ title: '上传失败', icon: 'none' });
            return;
          }
          this.setData({ 'form.cover_image': url });
          wx.showToast({ title: '图片已上传', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: (e && e.errmsg) || '上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  removeCover() {
    this.setData({ 'form.cover_image': '' });
  },

  async saveForm() {
    const { form, editingId } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写服务名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });
    try {
      const payload = {
        name: form.name.trim(),
        price: form.price.trim(),
        desc: form.desc.trim(),
        cover_image: form.cover_image || ''
      };
      if (editingId) {
        await api.worker.updateService(editingId, payload);
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await api.worker.createService(payload);
        wx.showToast({ title: '创建成功', icon: 'success' });
      }
      this.setData({
        showForm: false,
        editingId: null,
        form: { name: '', price: '', desc: '', cover_image: '' }
      });
      this.loadList();
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || (e && e.msg) || '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  editItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find((x) => String(x.id) === String(id));
    if (!item) return;
    this.setData({
      showForm: true,
      editingId: id,
      form: {
        name: item.name,
        price: item.price,
        desc: item.desc || '',
        cover_image: item.cover_image || ''
      }
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
