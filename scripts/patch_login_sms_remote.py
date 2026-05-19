import pathlib

LOGIN_SMS_FN = r'''/** POST /api/v1/auth/login_sms */
exports.loginSms = async (req, res) => {
    try {
        const { phone, code } = req.body || {};
        if (!phone || !code) {
            return res.status(400).json({ code: 400, msg: '缺少 phone/code', data: null });
        }
        const okCodes = ['024680', '123456'];
        if (!okCodes.includes(String(code))) {
            return res.status(400).json({ code: 400, msg: '验证码错误', data: null });
        }
        const user = await User.findOne({ where: { phone: String(phone) } });
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在，请先注册', data: null });
        }
        const token = issueUserToken(user);
        const _roleExtraSms = await getRoleExtra(user.id, user.phone);
        let role = user.role || 'user';
        if (_roleExtraSms.worker_status === 'approved') role = 'worker';
        else if (_roleExtraSms.service_provider_status === 'active') role = 'service_provider';
        return res.json({
            code: 0,
            msg: '登录成功',
            token,
            user: Object.assign({
                id: user.id,
                openid: user.openid || '',
                phone: user.phone || '',
                nickname: user.nickname || '',
                avatar_url: user.avatar_url || '',
                role,
            }, _roleExtraSms),
            data: { token }
        });
    } catch (e) {
        console.error('loginSms error:', e);
        return res.status(500).json({ code: 500, msg: '登录失败', data: null });
    }
};

'''

ctrl = pathlib.Path('/root/community-backend/backend/src/controllers/authController.js')
routes = pathlib.Path('/root/community-backend/backend/src/routes/authRoutes.js')

c = ctrl.read_text(encoding='utf-8')
if 'exports.loginSms' not in c:
    marker = '/** POST /api/v1/auth/login_password */'
    c = c.replace(marker, LOGIN_SMS_FN + '\n' + marker) if marker in c else c + '\n' + LOGIN_SMS_FN
    ctrl.write_text(c, encoding='utf-8')
    print('patched controller')
else:
    print('controller ok')

r = routes.read_text(encoding='utf-8')
line = "router.post('/login_sms', authController.loginSms);"
if '/login_sms' not in r:
    r = r.replace(
        "router.post('/login_password', authController.loginPassword);",
        "router.post('/login_password', authController.loginPassword);\n" + line,
    )
    routes.write_text(r, encoding='utf-8')
    print('patched routes')
else:
    print('routes ok')
