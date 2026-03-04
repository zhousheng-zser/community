const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');

// 获取社区列表 (可以开放，也可以加 authMiddleware 强制登录后看)
router.get('/', postController.getPosts);

// 下面的接口都需要登录鉴权
router.use(authMiddleware);

router.get('/my/published', postController.getMyPublishedPosts);
router.get('/my/liked', postController.getMyLikedPosts);
router.get('/my/participated', postController.getMyParticipatedPosts);

// 发帖子。'images' 是前端传图片的字段名，最多允许传 9 张 (和微信一样)
router.post('/', upload.array('images', 9), postController.createPost);

// 点赞 / 取消点赞
router.post('/:postId/like', postController.toggleLike);

// 发表评论
router.post('/:postId/comment', postController.addComment);

module.exports = router;
