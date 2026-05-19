/** GET /core/communities 与 /geo/communities 共用 */
module.exports.getCommunities = async (req, res) => {
  try {
    const db = require('../models');
    const Community = db.Community;
    if (!Community) {
      return res.status(501).json({ code: 1, msg: 'Community 模型未加载' });
    }
    const rows = await Community.findAll({
      where: { status: 'active' },
      order: [['id', 'ASC']],
      attributes: ['id', 'name', 'address']
    });
    return res.json({
      success: true,
      list: rows.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address
      }))
    });
  } catch (err) {
    console.error('[getCommunities]', err);
    return res.status(500).json({ code: 1, msg: '服务器内部错误' });
  }
};
