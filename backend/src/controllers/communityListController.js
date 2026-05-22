/** GET /core/communities、POST /core/communities/resolve */
const geofence = require('../services/communityGeofence.service');

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
      attributes: ['id', 'name', 'address', 'latitude', 'longitude']
    });
    const areas = await geofence.loadActiveAreas();
    const areaByComm = {};
    areas.forEach((a) => {
      if (!areaByComm[a.community_id]) areaByComm[a.community_id] = a;
    });
    return res.json({
      success: true,
      errno: 0,
      list: rows.map((r) => {
        const area = areaByComm[r.id];
        return {
          id: r.id,
          name: r.name,
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
          service_center: area ? area.center_name : null,
          radius_meters: area ? area.radius_meters : null
        };
      })
    });
  } catch (err) {
    console.error('[getCommunities]', err);
    return res.status(500).json({ code: 1, msg: '服务器内部错误' });
  }
};

/** POST /core/communities/resolve — 根据坐标/选点文案解析小区 */
module.exports.resolveCommunity = async (req, res) => {
  try {
    const body = req.body || {};
    const hit = await geofence.resolveCommunityFromInput(body);
    if (!hit || hit.community_id == null) {
      return res.json({
        success: true,
        errno: 0,
        matched: false,
        community_id: null,
        msg: '当前位置不在已开通小区服务范围内'
      });
    }
    const db = require('../models');
    let name = '';
    if (db.Community) {
      const row = await db.Community.findByPk(hit.community_id, { attributes: ['id', 'name'] });
      name = row ? row.name : '';
    }
    return res.json({
      success: true,
      errno: 0,
      matched: true,
      community_id: hit.community_id,
      community_name: name,
      match_type: hit.match_type || null,
      distance_m: hit.distance_m != null ? hit.distance_m : null,
      center_name: hit.center_name || null
    });
  } catch (err) {
    console.error('[resolveCommunity]', err);
    return res.status(500).json({ code: 1, msg: '解析失败' });
  }
};
