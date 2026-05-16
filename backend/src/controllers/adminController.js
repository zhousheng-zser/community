const { WorkerApplication, WorkerProfile, User, ApprovalRecord } = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

async function writeApproval(bizType, bizId, fromStatus, toStatus, operator, note) {
    try {
        await ApprovalRecord.create({
            biz_type: bizType,
            biz_id: String(bizId),
            from_status: fromStatus || null,
            to_status: toStatus,
            operator,
            note: note || null
        });
    } catch (_e) {}
}

exports.getWorkerApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const where = status ? { status } : {};
        const include = [];
        if (
            User &&
            WorkerApplication.associations &&
            WorkerApplication.associations.user
        ) {
            include.push({
                model: User,
                as: 'user',
                attributes: ['id', 'nickname', 'avatar_url', 'phone'],
                required: false
            });
        }
        const { rows, count } = await WorkerApplication.findAndCountAll({
            where,
            offset,
            limit,
            order: [['created_at', 'DESC']],
            include
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('getWorkerApplications:', e);
        res.status(500).json({ error: '加载技工申请失败，请稍后重试' });
    }
};

exports.updateWorkerApplication = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, note } = req.body || {};
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'status 须为 approved 或 rejected' });
        }
        const row = await WorkerApplication.findByPk(id);
        if (!row) return res.status(404).json({ error: '申请不存在' });
        const fromStatus = row.status;
        row.status = status;
        await row.save();
        const user = await User.findByPk(row.user_id);
        if (status === 'approved') {
            await WorkerProfile.upsert({
                user_id: row.user_id,
                application_id: row.id,
                real_name: row.name,
                phone: row.phone,
                industry: row.industry,
                education: row.education || null,
                city: row.city || null,
                resume: row.resume || null,
                id_card_url: row.id_card_url,
                work_photo_url: row.work_photo_url || null,
                certificate_url: row.certificate_url || null,
                status: 'active'
            });
            if (user) {
                user.role = 'worker';
                if (!user.phone && row.phone) user.phone = row.phone;
                if (!user.nickname && row.name) user.nickname = row.name;
                await user.save();
            }
        } else if (fromStatus === 'approved') {
            const profile = await WorkerProfile.findOne({ where: { application_id: row.id } });
            if (profile) await profile.update({ status: 'inactive' });
            if (user) {
                const activeCount = await WorkerProfile.count({
                    where: { user_id: row.user_id, status: 'active' }
                });
                if (activeCount === 0 && user.role === 'worker') {
                    user.role = 'user';
                    await user.save();
                }
            }
        }
        await writeApproval(
            'worker_application',
            row.id,
            fromStatus,
            status,
            (req.admin && req.admin.sub) || 'admin',
            note
        );
        await logAdminAction(req, 'update_worker_application', 'worker_application', row.id, {
            fromStatus,
            toStatus: status,
            note: note || ''
        });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('updateWorkerApplication:', e);
        res.status(500).json({ error: '更新申请失败，请稍后重试' });
    }
};

