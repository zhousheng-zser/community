const { Activity, ActivityParticipant, User } = require('../models');

// 获取我参与的活动 GET /api/v1/activities/my
exports.getMyActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const participants = await ActivityParticipant.findAll({
            where: { user_id: userId },
            include: [{ model: Activity, as: 'activity' }]
        });
        const activities = participants.map(p => p.activity).filter(Boolean);
        res.json({ message: '获取成功', data: activities });
    } catch (e) {
        console.error('获取我参与的活动失败:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
