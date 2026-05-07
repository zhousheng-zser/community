const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/post.controller');

// 公共接口
router.get('/posts', ctrl.getList);

// 需登录
router.use(authMiddleware);
router.get('/posts/my/published', ctrl.getMyPublished);
router.get('/posts/my/liked', ctrl.getMyLiked);
router.get('/posts/my/participated', ctrl.getMyParticipated);
router.post('/posts', ctrl.create);
router.post('/posts/:postId/like', ctrl.toggleLike);
router.post('/posts/:postId/comment', ctrl.comment);

module.exports = router;
