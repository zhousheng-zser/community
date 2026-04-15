const { Op } = require('sequelize');
const { ComplaintTicket, ApprovalRecord, AdminOperationLog } = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

function genTicketNo() {
    return `CT${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

exports.listComplaints = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.order_no) where.order_no = { [Op.like]: `%${String(req.query.order_no).trim()}%` };
        const rows = await ComplaintTicket.findAll({ where, order: [['created_at', 'DESC']], limit: 1000 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listComplaints:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.createComplaint = async (req, res) => {
    try {
        const { order_no, user_id, shop_id, type = 'order', content } = req.body || {};
        if (!content) return res.status(400).json({ error: 'content 必填' });
        const row = await ComplaintTicket.create({
            ticket_no: genTicketNo(),
            order_no: order_no || null,
            user_id: user_id || null,
            shop_id: shop_id || null,
            type,
            content
        });
        await logAdminAction(req, 'create_complaint', 'complaint_ticket', row.id, { order_no, type });
        res.status(201).json({ message: '创建成功', data: row });
    } catch (e) {
        console.error('admin createComplaint:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.resolveComplaint = async (req, res) => {
    try {
        const row = await ComplaintTicket.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '工单不存在' });
        const { status = 'resolved', reply } = req.body || {};
        if (!['processing', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'status 无效' });
        }
        row.status = status;
        if (reply !== undefined) row.reply = reply;
        if (status === 'resolved' || status === 'closed') row.resolved_at = new Date();
        await row.save();
        await logAdminAction(req, 'resolve_complaint', 'complaint_ticket', row.id, { status });
        res.json({ message: '处理成功', data: row });
    } catch (e) {
        console.error('admin resolveComplaint:', e);
        res.status(500).json({ error: '处理失败' });
    }
};

exports.listApprovalRecords = async (_req, res) => {
    try {
        const rows = await ApprovalRecord.findAll({ order: [['created_at', 'DESC']], limit: 1000 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listApprovalRecords:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.listOperationLogs = async (_req, res) => {
    try {
        const rows = await AdminOperationLog.findAll({ order: [['created_at', 'DESC']], limit: 2000 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listOperationLogs:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
