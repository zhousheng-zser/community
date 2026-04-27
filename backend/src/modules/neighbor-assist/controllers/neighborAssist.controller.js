/**
 * 邻里互助（帮帮订单）Controller
 *
 * [占位] 该模块由主后端提供核心实现，此处保留路由结构以便模块化管理。
 * 如需在此扩展，请参照已有 controller 模式实现具体业务逻辑。
 */

exports.create = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助下单接口由主后端实现' });
};

exports.myList = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助我的订单接口由主后端实现' });
};

exports.pool = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助订单池接口由主后端实现' });
};

exports.communityPool = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助小区订单池接口由主后端实现' });
};

exports.detail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助订单详情接口由主后端实现' });
};

exports.mockPay = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助支付接口由主后端实现' });
};

exports.grab = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助抢单接口由主后端实现' });
};

exports.communityGrab = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助小区抢单接口由主后端实现' });
};

exports.cancel = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助取消订单接口由主后端实现' });
};

exports.accept = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助接单接口由主后端实现' });
};

exports.reject = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助拒单接口由主后端实现' });
};

exports.complete = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助完成订单接口由主后端实现' });
};

exports.confirm = async (req, res) => {
  res.status(501).json({ code: 1, msg: '邻里互助确认订单接口由主后端实现' });
};
