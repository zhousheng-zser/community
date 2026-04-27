// GET /messages/conversations
exports.getConversations = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /messages/history/:conversationId
exports.getHistory = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /messages/conversations/:conversationId
exports.deleteConversation = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /messages/send
exports.sendMessage = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /messages/broadcast
exports.broadcast = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
