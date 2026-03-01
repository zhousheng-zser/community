const { User } = require('../models');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { nickname, phone, address, bank_num, wx_id } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (nickname) user.nickname = nickname;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (bank_num) user.bank_num = bank_num;
        if (wx_id) user.wx_id = wx_id;

        // 如果有上传文件 (头像)
        if (req.file) {
            // 构建图片访问 URL (本地开发环境)
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            user.avatar_url = `${baseUrl}/uploads/${req.file.filename}`;
        }

        await user.save();

        res.json({
            message: '个人资料更新成功',
            user: {
                id: user.id,
                nickname: user.nickname,
                avatar_url: user.avatar_url,
                phone: user.phone,
                address: user.address,
                bank_num: user.bank_num,
                wx_id: user.wx_id
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};
