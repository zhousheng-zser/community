
  loadRecentList() {
    util.get('neighbor-assist/orders/recent', { limit: 6 })
        .then(data => {
            const list = Array.isArray(data) ? data : [];
            this.setData({ recentList: list.map(item => ({
                id: item.id,
                content: item.content || item.title || '邻里帮帮任务'
            })) });
        })
        .catch(() => { this.setData({ recentList: [] }); });
  },

  onUnload() {
    if (this._lastPushTimer) {
        clearTimeout(this._lastPushTimer);
        this._lastPushTimer = null;
    }
  },
});
