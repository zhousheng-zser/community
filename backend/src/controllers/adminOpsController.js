/** 运营占位接口（活动/报表待实现） */
exports.listActivities = async (req, res) => {
  res.json({ code: 0, msg: 'ok', data: { list: [], total: 0 } });
};

exports.createActivity = async (req, res) => {
  res.status(501).json({ code: 1, msg: '活动管理暂未实现' });
};

exports.dataReport = async (req, res) => {
  res.json({ code: 0, msg: 'ok', data: {} });
};
