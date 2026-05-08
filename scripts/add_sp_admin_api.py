#!/usr/bin/env python3
"""Add service provider admin API endpoints to adminMarketController.js and adminRoutes.js"""
import subprocess, sys

HOST = 'cw@192.168.110.50'

def ssh(cmd):
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', HOST, cmd],
                       capture_output=True, text=True)
    print('STDOUT:', r.stdout[:500] if r.stdout else '')
    print('STDERR:', r.stderr[:300] if r.stderr else '')
    return r.returncode, r.stdout

CONTROLLER_PATH = '/home/cw/a/community-backend/backend/src/controllers/adminMarketController.js'
ROUTES_PATH = '/home/cw/a/community-backend/backend/src/routes/adminRoutes.js'

# 1. Add Service and ServiceOrder to imports
fix_imports_cmd = r"""
python3 -c "
import re
path = '/home/cw/a/community-backend/backend/src/controllers/adminMarketController.js'
with open(path) as f:
    content = f.read()

# Add Service and ServiceOrder to the destructured require
old = 'ServiceProviderPortalAccount,'
new = 'ServiceProviderPortalAccount,\n    Service,\n    ServiceOrder,'
if 'ServiceOrder,' not in content:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print('imports updated')
else:
    print('imports already updated')
"
"""
print("=== Updating imports ===")
ssh(fix_imports_cmd)

# 2. Append new controller functions
NEW_FUNCTIONS = r"""
// ========== 直约服务商 管理 ==========

exports.listServiceProviders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.community_id) where.community_id = parseInt(req.query.community_id, 10);
        const { rows, count } = await ServiceProviderProfile.findAndCountAll({
            where, offset, limit,
            order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'], required: false }
            ]
        });
        // attach service count
        const ids = rows.map(r => r.id);
        let svcMap = {};
        if (ids.length) {
            const svcs = await Service.findAll({
                where: { provider_id: ids },
                attributes: ['provider_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
                group: ['provider_id'],
                raw: true
            });
            svcs.forEach(s => { svcMap[s.provider_id] = parseInt(s.cnt, 10); });
        }
        const data = rows.map(r => ({ ...r.toJSON(), service_count: svcMap[r.id] || 0 }));
        res.json({ message: 'ok', total: count, page, limit, data });
    } catch (e) {
        console.error('admin listServiceProviders:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.getServiceProvider = async (req, res) => {
    try {
        const row = await ServiceProviderProfile.findByPk(req.params.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'], required: false }
            ]
        });
        if (!row) return res.status(404).json({ error: '服务商不存在' });
        const services = await Service.findAll({
            where: { provider_id: row.id },
            order: [['created_at', 'DESC']]
        });
        res.json({ message: 'ok', data: { ...row.toJSON(), services } });
    } catch (e) {
        console.error('admin getServiceProvider:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.updateServiceProvider = async (req, res) => {
    try {
        const row = await ServiceProviderProfile.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '服务商不存在' });
        const allowed = ['shop_name', 'contact_name', 'phone', 'status', 'community_id',
                         'shop_front_url', 'license_url', 'environment_url', 'description'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        await row.update(updates);
        await logAdminAction(req, 'update_service_provider', 'service_provider_profile', row.id, updates);
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin updateServiceProvider:', e);
        res.status(500).json({ error: '更新失败' });
    }
};

exports.createServiceProvider = async (req, res) => {
    try {
        const { shop_name, contact_name, phone, community_id, user_id } = req.body || {};
        if (!shop_name) return res.status(400).json({ error: '请填写店铺名称' });
        const row = await ServiceProviderProfile.create({
            shop_name, contact_name: contact_name || '',
            phone: phone || '',
            community_id: community_id ? parseInt(community_id, 10) : null,
            user_id: user_id ? parseInt(user_id, 10) : null,
            status: 'active'
        });
        await logAdminAction(req, 'create_service_provider', 'service_provider_profile', row.id, { shop_name });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin createServiceProvider:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.listSpServices = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        const rows = await Service.findAll({
            where: { provider_id: providerId },
            order: [['created_at', 'DESC']]
        });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listSpServices:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.createSpService = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        const prof = await ServiceProviderProfile.findByPk(providerId);
        if (!prof) return res.status(404).json({ error: '服务商不存在' });
        const { title, sub_title, description, price, unit, cover_image, category_key, is_published } = req.body || {};
        if (!title) return res.status(400).json({ error: '请填写服务名称' });
        const row = await Service.create({
            title, sub_title: sub_title || '',
            description: description || '',
            price: parseFloat(price) || 0,
            unit: unit || '次',
            cover_image: cover_image || '',
            category_key: category_key || 'general',
            provider_id: providerId,
            is_published: is_published !== undefined ? (is_published ? 1 : 0) : 1
        });
        await logAdminAction(req, 'create_sp_service', 'service', row.id, { provider_id: providerId, title });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin createSpService:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.updateSpService = async (req, res) => {
    try {
        const row = await Service.findOne({
            where: { id: req.params.sid, provider_id: req.params.id }
        });
        if (!row) return res.status(404).json({ error: '服务不存在' });
        const allowed = ['title', 'sub_title', 'description', 'price', 'unit', 'cover_image', 'category_key', 'is_published'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        await row.update(updates);
        await logAdminAction(req, 'update_sp_service', 'service', row.id, updates);
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin updateSpService:', e);
        res.status(500).json({ error: '更新失败' });
    }
};

exports.deleteSpService = async (req, res) => {
    try {
        const row = await Service.findOne({
            where: { id: req.params.sid, provider_id: req.params.id }
        });
        if (!row) return res.status(404).json({ error: '服务不存在' });
        await row.update({ is_published: 0 });
        await logAdminAction(req, 'archive_sp_service', 'service', row.id, {});
        res.json({ message: '已下架' });
    } catch (e) {
        console.error('admin deleteSpService:', e);
        res.status(500).json({ error: '操作失败' });
    }
};

exports.listSpOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.provider_id) where.provider_user_id = req.query.provider_id;
        const { rows, count } = await ServiceOrder.findAndCountAll({
            where, offset, limit,
            order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false },
                { model: Service, as: 'service', attributes: ['id', 'title', 'price'], required: false }
            ]
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listSpOrders:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
"""

# Write new functions to a temp file and append
write_cmd = f"""python3 -c "
content = '''{NEW_FUNCTIONS}'''
path = '{CONTROLLER_PATH}'
with open(path) as f:
    existing = f.read()
if 'exports.listServiceProviders' in existing:
    print('functions already added')
else:
    with open(path, 'a') as f:
        f.write(content)
    print('functions appended OK')
"
"""
print("=== Appending controller functions ===")
ssh(write_cmd)

# 3. Add routes to adminRoutes.js
add_routes_cmd = r"""
python3 -c "
path = '/home/cw/a/community-backend/backend/src/routes/adminRoutes.js'
with open(path) as f:
    content = f.read()

new_routes = '''
// ---- 直约服务商管理 ----
router.get(\'/service-providers\', adminMarketController.listServiceProviders);
router.post(\'/service-providers\', adminMarketController.createServiceProvider);
router.get(\'/service-providers/:id\', adminMarketController.getServiceProvider);
router.put(\'/service-providers/:id\', adminMarketController.updateServiceProvider);
router.get(\'/service-providers/:id/services\', adminMarketController.listSpServices);
router.post(\'/service-providers/:id/services\', adminMarketController.createSpService);
router.put(\'/service-providers/:id/services/:sid\', adminMarketController.updateSpService);
router.delete(\'/service-providers/:id/services/:sid\', adminMarketController.deleteSpService);
router.get(\'/sp-orders\', adminMarketController.listSpOrders);
'''

if 'listServiceProviders' in content:
    print('routes already added')
else:
    # Insert before module.exports
    content = content.replace('module.exports = router;', new_routes + '\nmodule.exports = router;')
    with open(path, 'w') as f:
        f.write(content)
    print('routes added OK')
"
"""
print("=== Adding routes ===")
ssh(add_routes_cmd)

# 4. Restart backend
print("=== Restarting backend ===")
ssh("pkill -f 'node src/index.js' 2>/dev/null || true; sleep 1")
ssh("cd /home/cw/a/community-backend/backend && nohup node src/index.js > /tmp/backend.log 2>&1 & sleep 3 && curl -s http://localhost:3001/api/v1/core/banners | head -c 100")

print("=== Done ===")
