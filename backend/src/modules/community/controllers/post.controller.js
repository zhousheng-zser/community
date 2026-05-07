// GET /posts
exports.getList = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /posts/my/published
exports.getMyPublished = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /posts/my/liked
exports.getMyLiked = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /posts/my/participated
exports.getMyParticipated = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /posts
exports.create = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /posts/:postId/like
exports.toggleLike = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /posts/:postId/comment
exports.comment = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
