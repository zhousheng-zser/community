const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');

// 所有用户接口都需要登录
router.use(authMiddleware);

// 获取个人资料
router.get('/profile', userController.getProfile);

// 更新个人资料 (支持上传头像)
// 'avatar' 是前端上传文件的字段名
router.post('/profile', upload.single('avatar'), userController.updateProfile);

// 兼容性的旧路径接口 (前端中有些地方调用的是 api/user_info/update)
router.post('/api/user_info/update', userController.updateProfile);

// 获取我的关注列表
router.get('/follows', userController.getFollows);

// 地址管理 CRUD
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

module.exports = router;
