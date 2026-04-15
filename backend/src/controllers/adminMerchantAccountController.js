const crypto = require('crypto');
const { MerchantAccount, MarketShop } = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

function hashPassword(raw) {
    return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

exports.list = async (req, res) => {
    try {
        const where = {};
        if (req.query.shop_id) where.shop_id = req.query.shop_id;
        if (req.query.status) where.status = req.query.status;
        const rows = await MerchantAccount.findAll({
            where,
            include: [{ model: MarketShop, as: 'shop', attributes: ['id', 'name', 'shop_no'], required: false }],
            order: [['created_at', 'DESC']]
        });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin merchant account list:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.create = async (req, res) => {
    try {
        const { shop_id, username, password, role = 'operator' } = req.body || {};
        if (!shop_id || !username || !password) return res.status(400).json({ error: 'shop_id、username、password 必填' });
        const shop = await MarketShop.findByPk(shop_id);
        if (!shop) return res.status(400).json({ error: '店铺不存在' });
        const row = await MerchantAccount.create({
            shop_id,
            username,
            password_hash: hashPassword(password),
            role
        });
        await logAdminAction(req, 'create_merchant_account', 'merchant_account', row.id, { shop_id, username, role });
        res.status(201).json({ message: '创建成功', data: row });
    } catch (e) {
        console.error('admin merchant account create:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.update = async (req, res) => {
    try {
        const row = await MerchantAccount.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '账号不存在' });
        const { role, status } = req.body || {};
        if (role !== undefined) row.role = role;
        if (status !== undefined) row.status = status;
        await row.save();
        await logAdminAction(req, 'update_merchant_account', 'merchant_account', row.id, { role, status });
        res.json({ message: '更新成功', data: row });
    } catch (e) {
        console.error('admin merchant account update:', e);
        res.status(500).json({ error: '更新失败' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const row = await MerchantAccount.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '账号不存在' });
        const { password } = req.body || {};
        if (!password) return res.status(400).json({ error: '缺少新密码' });
        row.password_hash = hashPassword(password);
        await row.save();
        await logAdminAction(req, 'reset_merchant_password', 'merchant_account', row.id);
        res.json({ message: '重置成功' });
    } catch (e) {
        console.error('admin merchant account resetPassword:', e);
        res.status(500).json({ error: '重置失败' });
    }
};
