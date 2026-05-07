// GET /core/banners
exports.getBanners = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/categories
exports.getCategories = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/services/hot
exports.getHotServices = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/services
exports.getServices = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/services/:id
exports.getServiceDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/workers
exports.getWorkers = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/workers/:id
exports.getWorkerDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/service-providers
exports.getServiceProviders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /core/communities
exports.getCommunities = async (req, res) => {
  try {
    const db = require('../../../models');
    const Community = db.Community;
    if (!Community) {
      return res.status(501).json({ code: 1, msg: 'Community 模型未加载' });
    }
    const rows = await Community.findAll({
      where: { status: 'active' },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'name', 'address']
    });
    res.json({
      success: true,
      list: rows.map(r => ({
        id: r.id,
        name: r.name,
        address: r.address
      }))
    });
  } catch (err) {
    console.error('[getCommunities]', err);
    res.status(500).json({ code: 1, msg: '服务器内部错误' });
  }
};
