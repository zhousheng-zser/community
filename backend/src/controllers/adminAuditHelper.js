const { AdminOperationLog } = require('../models');

async function logAdminAction(req, action, targetType, targetId, detail = {}) {
    try {
        await AdminOperationLog.create({
            admin_username: (req.admin && req.admin.sub) || 'unknown',
            action,
            target_type: targetType || null,
            target_id: targetId != null ? String(targetId) : null,
            detail_json: detail,
            ip: req.ip || req.headers['x-forwarded-for'] || null
        });
    } catch (_e) {
        // 审计失败不应影响主流程
    }
}

module.exports = {
    logAdminAction
};
