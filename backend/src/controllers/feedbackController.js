const { Feedback } = require('../models');

// 提交意见反馈 POST /api/v1/feedback/submit
exports.submit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, contact } = req.body;
        if (!content) {
            return res.status(400).json({ error: '请填写反馈内容' });
        }
        const row = await Feedback.create({
            user_id: userId,
            content,
            contact: contact || null
        });
        res.status(201).json({ message: '提交成功', data: row });
    } catch (e) {
        console.error('提交反馈失败:', e);
        res.status(500).json({ error: '提交失败' });
    }
};
