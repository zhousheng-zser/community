const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// 兼容性接口 (被原小程序代码误拼为 api/wx/getkey)
router.get('/wx/getkey/:code', (req, res) => {
    // 转发给 login 处理提取 openid 和 session_key
    // 这里简单返回 mock 数据或者调用 login
    req.body = { code: req.params.code };
    return authController.login(req, res);
});


module.exports = router;
