// GET /worker/service-orders
exports.getOrders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /worker/service-orders/:id
exports.getOrderDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/accept
exports.acceptOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/reject
exports.rejectOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/check-in
exports.checkIn = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/evidence
exports.uploadEvidence = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /worker/service-orders/:id/complete
exports.completeOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
