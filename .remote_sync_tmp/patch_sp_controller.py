"""Patch serviceProviderPortalController.js to add shelfService and orderAction handlers"""

SHELF_AND_ACTION = r"""
exports.shelfService = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const id = parseInt(req.params.id, 10);
    const s = await Service.findOne({ where: { id, provider_id: profile.id } });
    if (!s) return res.status(404).json({ errno: 404, errmsg: '服务不存在' });
    const b = req.body || {};
    const published = b.is_published !== undefined
      ? (b.is_published === 1 || b.is_published === true || b.is_published === '1')
      : (b.published !== undefined ? !!b.published : !s.is_published);
    s.is_published = published ? 1 : 0;
    await s.save();
    return res.json({ errno: 0, data: { service: mapServiceRow(s), is_published: s.is_published } });
  } catch (e) {
    console.error('spPortal shelfService', e);
    return res.status(500).json({ errno: 500, errmsg: '操作失败' });
  }
};

exports.orderAction = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const id = parseInt(req.params.id, 10);
    const action = req.body && req.body.action;
    if (!action) return res.status(400).json({ errno: 400, errmsg: '缺少 action 参数' });
    // Map action to existing endpoints
    const actionMap = { accept: exports.orderAccept, 'check-in': exports.orderCheckIn, checkin: exports.orderCheckIn, evidence: exports.orderEvidence, complete: exports.orderComplete };
    const handler = actionMap[action];
    if (!handler) return res.status(400).json({ errno: 400, errmsg: `不支持的操作: ${action}` });
    return handler(req, res);
  } catch (e) {
    console.error('spPortal orderAction', e);
    return res.status(500).json({ errno: 500, errmsg: '操作失败' });
  }
};
"""

filepath = '/home/cw/a/community-backend/backend/src/controllers/serviceProviderPortalController.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'exports.shelfService' in content:
    print('Already patched, skipping')
else:
    # Append before last line
    content = content.rstrip() + '\n' + SHELF_AND_ACTION
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patched', filepath)
