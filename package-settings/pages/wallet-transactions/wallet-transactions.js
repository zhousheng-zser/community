const lp = require('../../utils/localPrefs.js');

Page({
  data: {
    list: []
  },
  onShow() {
    const list = lp.getWalletTransactions().map((x) =>
      Object.assign({}, x, {
        timeLabel: x.t ? new Date(x.t).toLocaleString() : ''
      })
    );
    this.setData({ list });
  }
});
