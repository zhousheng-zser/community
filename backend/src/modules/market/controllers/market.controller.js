// POST /market/apply
exports.apply = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/search
exports.search = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/shops
exports.getShops = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/shops/:shopId
exports.getShopDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/shops/:shopId/goods
exports.getShopGoods = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/goods/:goodsId
exports.getGoodsDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/shops/:shopId/contact
exports.getShopContact = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/cart
exports.getCart = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/cart/items
exports.addCartItem = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// PUT /market/cart/items/:itemId
exports.updateCartItem = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /market/cart/items/:itemId
exports.deleteCartItem = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /market/cart
exports.clearCart = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/preview
exports.previewOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders
exports.createOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders
exports.getMyOrders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders/:orderNo
exports.getOrderDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/cancel
exports.cancelOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /market/orders/:orderNo
exports.deleteOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/buy-again
exports.buyAgain = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders/:orderNo/logistics
exports.getLogistics = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/payments/create
exports.createPayment = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/payments/status
exports.getPaymentStatus = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/payments/mock-success
exports.mockPaymentSuccess = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/confirm-receipt
exports.confirmReceipt = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/refund
exports.applyRefund = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders/:orderNo/refund
exports.getRefundDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/refund/cancel
exports.cancelRefund = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
