const { Post, User, Comment, Like } = require('../models');

// 1. 获取社区帖子列表 (朋友图形式：按时间倒序排，带上用户信息、评论、点赞)
exports.getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.category) {
            whereClause.category = req.query.category;
        }

        const posts = await Post.findAndCountAll({
            where: whereClause,
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

// 1.1 获取我发布的帖子
exports.getMyPublishedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const posts = await Post.findAndCountAll({
            where: { user_id: userId },
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url', 'bg_image'] },
                { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'nickname'] }] },
                { model: Like, as: 'likes', include: [{ model: User, as: 'user', attributes: ['id', 'nickname'] }] }
            ]
        });

        res.json({ message: '获取成功', total: posts.count, page: page, limit: limit, data: posts.rows });
    } catch (error) {
        console.error('获取我的发布失败:', error);
        res.status(500).json({ error: '获取我的发布失败' });
    }
};

// 1.2 获取我点赞过的帖子
exports.getMyLikedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Find likes by this user
        const likes = await Like.findAll({
            where: { user_id: userId },
            attributes: ['post_id']
        });
        const postIds = likes.map(like => like.post_id);

        const posts = await Post.findAndCountAll({
            where: { id: postIds },
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url', 'bg_image'] },
                { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'nickname'] }] },
                { model: Like, as: 'likes', include: [{ model: User, as: 'user', attributes: ['id', 'nickname'] }] }
            ]
        });

        res.json({ message: '获取成功', total: posts.count, page: page, limit: limit, data: posts.rows });
    } catch (error) {
        console.error('获取我的点赞失败:', error);
        res.status(500).json({ error: '获取我的点赞失败' });
    }
};

// 1.3 获取我参与的话题/活动 (发过或者评论过的某分类的帖子)
exports.getMyParticipatedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const category = req.query.category; // "热门话题" or "热门活动"
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (!category) return res.status(400).json({ error: '缺少分类参数' });

        // 先找我评论过的帖子ID
        const myComments = await Comment.findAll({
            where: { user_id: userId },
            attributes: ['post_id']
        });
        const commentedPostIds = myComments.map(c => c.post_id);

        const { Op } = require('sequelize');

        const posts = await Post.findAndCountAll({
            where: {
                category: category,
                [Op.or]: [
                    { user_id: userId },        // 我发的
                    { id: commentedPostIds }    // 我评论的
                ]
            },
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url', 'bg_image'] },
                { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'nickname'] }] },
                { model: Like, as: 'likes', include: [{ model: User, as: 'user', attributes: ['id', 'nickname'] }] }
            ]
        });

        res.json({ message: '获取成功', total: posts.count, page: page, limit: limit, data: posts.rows });
    } catch (error) {
        console.error('获取参与数据失败:', error);
        res.status(500).json({ error: '获取参与数据失败' });
    }
};

// 2. 发帖子 (纯文字或带图片)
exports.createPost = async (req, res) => {
    try {
        // req.user 来源于 authMiddleware
        const userId = req.user.id;
        const { content, location, category } = req.body;

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
            category: category || '邻里互动',
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

// 4. 发表评论（支持 content、reply_to_user_id、image_urls）
exports.addComment = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: '未登录' });
        }
        const userId = req.user.id;
        const postId = req.params.postId;
        const { content, reply_to_user_id, image_urls } = req.body;

        if (!content && (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0)) {
            return res.status(400).json({ error: '评论内容或图片不能同时为空' });
        }

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const newComment = await Comment.create({
            post_id: postId,
            user_id: userId,
            content: content || '',
            reply_to_user_id: reply_to_user_id || null,
            image_urls: Array.isArray(image_urls) ? image_urls : null
        });

        res.status(201).json({
            code: 0,
            msg: '评论成功',
            data: {
                comment_id: newComment.id,
                image_urls: newComment.image_urls || [],
                created_at: newComment.createdAt
            }
        });

    } catch (error) {
        const msg = error && (error.original && error.original.message || error.message) || String(error);
        console.error('评论失败:', msg, error && error.original || '');
        res.status(500).json({
            error: '评论失败',
            ...(process.env.NODE_ENV !== 'production' && { errMsg: msg })
        });
    }
};
