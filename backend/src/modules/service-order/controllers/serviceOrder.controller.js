const authMiddleware = require('../../../middlewares/authMiddleware');

// POST /service-orders
exports.create = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /service-orders/:id
exports.getDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /service-orders/my
exports.getMyList = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /service-orders/:id/mock-pay
exports.mockPay = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /service-orders/:id/confirm
exports.confirm = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
