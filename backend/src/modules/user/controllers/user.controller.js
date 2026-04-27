const { User } = require('../../../models');

// GET /user/profile
exports.getProfile = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// PATCH /user/profile
exports.updateProfile = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /user/addresses
exports.getAddresses = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /user/addresses
exports.addAddress = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /user/addresses/:id
exports.updateAddress = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /user/addresses/:id
exports.deleteAddress = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
