const { Post, User, Comment, Like } = require('../models');

// 1. 获取社区帖子列表 (朋友图形式：按时间倒序排，带上用户信息、评论、点赞)
exports.getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const posts = await Post.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'nickname', 'avatar_url', 'bg_image']
                },
                {
                    model: Comment,
                    as: 'comments',
                    include: [
                        { model: User, as: 'author', attributes: ['id', 'nickname'] },
                        { model: User, as: 'replyToUser', attributes: ['id', 'nickname'] }
                    ]
                },
                {
                    model: Like,
                    as: 'likes',
                    include: [{ model: User, as: 'user', attributes: ['id', 'nickname'] }]
                }
            ]
        });

        res.json({
            message: '获取成功',
            total: posts.count,
            page: page,
            limit: limit,
            data: posts.rows
        });
    } catch (error) {
        console.error('获取帖子失败:', error);
        res.status(500).json({ error: '获取帖子失败' });
    }
};

// 2. 发帖子 (纯文字或带图片)
exports.createPost = async (req, res) => {
    try {
        // req.user 来源于 authMiddleware
        const userId = req.user.id;
        const { content, location } = req.body;

        // 解析通过 multer 上传的图片路径，或者直接使用前端传过来的已上传的图片URL数组
        let imagePaths = [];
        if (req.body.images && Array.isArray(req.body.images)) {
            imagePaths = req.body.images;
        } else if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `/uploads/${file.filename}`);
        }

        if (!content && imagePaths.length === 0) {
            return res.status(400).json({ error: '帖子不能完全为空' });
        }

        const newPost = await Post.create({
            user_id: userId,
            content: content || '',
            images: imagePaths, // Sequelize 的 JSON 字段会自动处理数组
            location: location || ''
        });

        res.status(201).json({
            message: '发布成功',
            data: newPost
        });

    } catch (error) {
        console.error('发布帖子失败:', error);
        res.status(500).json({ error: '发布帖子失败' });
    }
};

// 3. 点赞/取消点赞
exports.toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.postId;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 查找是否已经点过赞
        const existingLike = await Like.findOne({
            where: { user_id: userId, post_id: postId }
        });

        if (existingLike) {
            // 已点赞，则取消
            await existingLike.destroy();
            return res.json({ message: '取消点赞成功', status: 'unliked' });
        } else {
            // 未点赞，则添加
            await Like.create({ user_id: userId, post_id: postId });
            return res.json({ message: '点赞成功', status: 'liked' });
        }

    } catch (error) {
        console.error('操作点赞失败:', error);
        res.status(500).json({ error: '操作点赞失败' });
    }
};

// 4. 发表评论
exports.addComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.postId;
        const { content, reply_to_user_id } = req.body;

        if (!content) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const newComment = await Comment.create({
            post_id: postId,
            user_id: userId,
            content: content,
            reply_to_user_id: reply_to_user_id || null // 可空
        });

        res.status(201).json({
            message: '评论成功',
            data: newComment
        });

    } catch (error) {
        console.error('评论失败:', error);
        res.status(500).json({ error: '评论失败' });
    }
};
