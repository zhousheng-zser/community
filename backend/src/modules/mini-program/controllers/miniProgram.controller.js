const { MiniProgram } = require('../../../models');

// GET /mini-programs - Get list (public)
exports.getMiniPrograms = async (req, res) => {
    try {
        const programs = await MiniProgram.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });

        const list = programs.map(p => ({
            id: p.id, name: p.name, app_id: p.app_id, appId: p.app_id,
            path: p.path, icon: p.icon_url || '', description: p.description,
            sort_order: p.sort_order
        }));

        res.json({ code: 0, msg: 'ok', data: { list } });
    } catch (error) {
        console.error('获取小程序列表失败:', error);
        res.status(500).json({ code: 1, msg: '获取小程序列表失败' });
    }
};

// GET /mini-programs/:id - Get detail
exports.getMiniProgramDetail = async (req, res) => {
    try {
        const program = await MiniProgram.findByPk(req.params.id);
        if (!program) return res.status(404).json({ code: 1, msg: '小程序配置不存在' });

        res.json({ code: 0, msg: 'ok', data: {
            id: program.id, name: program.name, app_id: program.app_id,
            path: program.path, icon_url: program.icon_url,
            description: program.description, sort_order: program.sort_order,
            is_active: program.is_active
        }});
    } catch (error) {
        console.error('获取小程序详情失败:', error);
        res.status(500).json({ code: 1, msg: '获取小程序详情失败' });
    }
};

// POST /mini-programs - Create (admin)
exports.createMiniProgram = async (req, res) => {
    try {
        const { name, app_id, path, icon_url, description, sort_order } = req.body;
        if (!name || !app_id) return res.status(400).json({ code: 1, msg: 'name 和 app_id 为必填项' });

        const program = await MiniProgram.create({
            name, app_id, path: path || '', icon_url: icon_url || '',
            description: description || '', sort_order: sort_order || 0, is_active: true
        });

        res.json({ code: 0, msg: '创建成功', data: program.toJSON() });
    } catch (error) {
        console.error('创建小程序配置失败:', error);
        res.status(500).json({ code: 1, msg: '创建小程序配置失败' });
    }
};

// PUT /mini-programs/:id - Update (admin)
exports.updateMiniProgram = async (req, res) => {
    try {
        const program = await MiniProgram.findByPk(req.params.id);
        if (!program) return res.status(404).json({ code: 1, msg: '小程序配置不存在' });

        await program.update(req.body);
        res.json({ code: 0, msg: '更新成功', data: program.toJSON() });
    } catch (error) {
        console.error('更新小程序配置失败:', error);
        res.status(500).json({ code: 1, msg: '更新小程序配置失败' });
    }
};

// DELETE /mini-programs/:id - Delete (admin)
exports.deleteMiniProgram = async (req, res) => {
    try {
        const program = await MiniProgram.findByPk(req.params.id);
        if (!program) return res.status(404).json({ code: 1, msg: '小程序配置不存在' });

        await program.destroy();
        res.json({ code: 0, msg: '删除成功' });
    } catch (error) {
        console.error('删除小程序配置失败:', error);
        res.status(500).json({ code: 1, msg: '删除小程序配置失败' });
    }
};
