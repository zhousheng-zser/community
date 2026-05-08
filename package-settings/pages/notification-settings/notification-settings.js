const lp = require('../../utils/localPrefs.js');

Page({
  data: {
    order: true,
    system: true,
    marketing: true
  },
  onLoad() {
    const p = lp.getNotifyPrefs();
    this.setData({
      order: !!p.order,
      system: !!p.system,
      marketing: !!p.marketing
    });
  },
  toggle(e) {
    const field = e.currentTarget.dataset.field;
    const next = !!e.detail.value;
    this.setData({ [field]: next });
    const d = this.data;
    lp.setNotifyPrefs({
      order: field === 'order' ? next : d.order,
      system: field === 'system' ? next : d.system,
      marketing: field === 'marketing' ? next : d.marketing
    });
  }
});
