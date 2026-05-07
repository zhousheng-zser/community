const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/auth.controller');

router.post('/login', ctrl.login);
router.post('/login_password', ctrl.loginPassword);
router.post('/register', ctrl.register);
router.post('/sms-code', ctrl.sendSmsCode);
router.post('/admin/login', ctrl.adminLogin);

module.exports = router;
