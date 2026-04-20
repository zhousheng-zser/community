const KEY = 'user_appeals_v1';

function loadList() {
  try {
    const v = wx.getStorageSync(KEY);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

function saveList(list) {
  wx.setStorageSync(KEY, list);
}

Page({
  data: {
    list: [],
    content: ''
  },
  onShow() {
    this.setData({ list: loadList().sort((a, b) => (b.t || 0) - (a.t || 0)) });
  },
  onInput(e) {
    this.setData({ content: e.detail.value });
  },
  submit() {
    const content = (this.data.content || '').trim();
    if (!content) {
      wx.showToast({ title: '请填写诉求', icon: 'none' });
      return;
    }
    const row = {
      id: `ap_${Date.now()}`,
      content,
      t: Date.now(),
      status: '已提交'
    };
    const list = [row, ...loadList()];
    saveList(list);
    this.setData({ content: '', list });
    wx.showToast({ title: '已记录', icon: 'success' });
  }
});
