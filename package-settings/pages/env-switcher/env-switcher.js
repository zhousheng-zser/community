const env = require('../../utils/env.js');

Page({
  data: {
    currentEnv: '',
    envOptions: [
      { value: env.ENV.DEVELOPMENT, label: '开发环境', desc: '显示所有演示入口和mock数据' },
      { value: env.ENV.TESTING, label: '测试环境', desc: '显示演示入口，不使用mock数据' },
      { value: env.ENV.PRODUCTION, label: '生产环境', desc: '隐藏所有演示入口' }
    ]
  },

  onShow() {
    this.setData({ currentEnv: env.getCurrentEnv() });
  },

  switchEnv(e) {
    const newEnv = e.currentTarget.dataset.value;
    if (newEnv === this.data.currentEnv) return;
    
    wx.showModal({
      title: '切换环境',
      content: `确定切换到${this.getEnvLabel(newEnv)}吗？`,
      success: (res) => {
        if (res.confirm) {
          env.setEnv(newEnv);
          this.setData({ currentEnv: newEnv });
          wx.showToast({ title: '环境已切换', icon: 'success' });
        }
      }
    });
  },

  getEnvLabel(value) {
    const opt = this.data.envOptions.find(o => o.value === value);
    return opt ? opt.label : value;
  },

  back() {
    wx.navigateBack();
  }
});
