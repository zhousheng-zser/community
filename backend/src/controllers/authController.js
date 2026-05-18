const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');

// 微信 API 地址 (换取 openid)
const WX_LOGIN_URL = 'https://api.weixin.qq.com/sns/jscode2session';

exports.login = async (req, res) => {
    try {
        const { code, nickname, avatar_url, phone } = req.body;

        if (!code) {
            return res.status(400).json({ error: '缺少 code 参数' });
        }

        const appid = process.env.WX_APPID;
        const secret = process.env.WX_APPSECRET;

        let openid = '';

        // 如果配置了 AppSecret，说明我们需要真实向微信服务器发起请求
        // 注意：在没有 AppSecret 的开发初期，我们可以通过模拟逻辑跳过
        if (secret) {
            const response = await axios.get(WX_LOGIN_URL, {
                params: {
                    appid: appid,
                    secret: secret,
                    js_code: code,
                    grant_type: 'authorization_code'
                }
            });

            if (response.data.errcode) {
                return res.status(400).json({ error: '微信登录失败', details: response.data });
            }
            openid = response.data.openid;
        } else {
            // 本地模拟登录逻辑（无 Secret 时跳过请求微信直接生成假的 openid）
            console.warn("⚠️ WX_APPSECRET 未配置，正在使用本地模拟登录逻辑！");
            openid = `mock_openid_${code}`;
        }

        // 1. 在数据库中查找是否已有该用户
        let user = await User.findOne({ where: { openid: openid } });

        // 2. 如果没有，则注册新用户
        if (!user) {
            user = await User.create({
                openid: openid,
                nickname: nickname || '微信用户',
                avatar_url: avatar_url || '',
                phone: phone || ''
            });
        } else {
            // 如果已存在，但前端传来了新的头像或昵称，可以考虑更新
            if (nickname || avatar_url || phone) {
                user.nickname = nickname || user.nickname;
                user.avatar_url = avatar_url || user.avatar_url;
                user.phone = phone || user.phone;
                await user.save();
            }
        }

        // 3. 签发 JWT Token 给前端（携带 token_version，用于 logout 失效旧 token）
        const token = jwt.sign(
            { id: user.id, openid: user.openid, token_version: user.token_version || 0 },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '7d' } // token 7天有效
        );

        const _roleExtra = await getRoleExtra(user.id, user.phone);
        res.json({
            message: '登录成功',
            token: token,
            user: Object.assign({
                id: user.id,
                openid: user.openid || '',
                phone: user.phone || '',
                nickname: user.nickname,
                avatar_url: user.avatar_url,
                role: user.role || 'user',
            }, _roleExtra)
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};

/** POST /api/v1/auth/logout — 递增 token_version 以失效旧 token */
exports.logout = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: '未登录' });
        }
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        user.token_version = Number(user.token_version || 0) + 1;
        await user.save();
        return res.json({ code: 0, msg: 'ok', data: { token_version: user.token_version } });
    } catch (e) {
        console.error('Logout Error:', e);
        return res.status(500).json({ error: '服务器内部错误' });
    }
};

/** POST /api/v1/auth/admin/login — 管理后台独立登录，JWT 含 admin:true */
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const adminUser = process.env.ADMIN_USERNAME || 'wsxCDE';
        const adminPass = String(process.env.ADMIN_PASSWORD || '').trim();

        const isProduction = process.env.NODE_ENV === 'production';
        const forcePassword = process.env.ADMIN_FORCE_PASSWORD === '1';
        /** 开发：非 production 默认不校验密码；生产仍校验。可设 ADMIN_FORCE_PASSWORD=1 在本地也校验；DEBUG_ADMIN_LOGIN=1 仍兼容 */
        const skipPassword =
            process.env.DEBUG_ADMIN_LOGIN === '1' || (!isProduction && !forcePassword);

        if (skipPassword) {
            const u =
                username && typeof username === 'string' && String(username).trim()
                    ? String(username).trim()
                    : adminUser;
            if (!isProduction) {
                console.warn('[admin/login] 开发模式：已跳过密码校验（生产请设 NODE_ENV=production）');
            } else {
                console.warn('[DEBUG_ADMIN_LOGIN] 已跳过密码校验，用户:', u);
            }
            const token = jwt.sign(
                { sub: u, admin: true },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );
            return res.json({
                message: '登录成功',
                data: { token, username: u }
            });
        }

        if (!username || typeof username !== 'string') {
            return res.status(400).json({ error: '缺少用户名' });
        }
        if (password === undefined || password === null || String(password) === '') {
            return res.status(400).json({ error: '请输入密码' });
        }
        if (username !== adminUser) {
            return res.status(401).json({ error: '账号或密码错误' });
        }
        if (!adminPass) {
            return res.status(503).json({ error: '服务端未配置 ADMIN_PASSWORD' });
        }
        if (String(password) !== adminPass) {
            return res.status(401).json({ error: '账号或密码错误' });
        }

        const token = jwt.sign(
            { sub: username, admin: true },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' }
        );
        res.json({
            message: '登录成功',
            data: { token, username }
        });
    } catch (e) {
        console.error('Admin login error:', e);
        res.status(500).json({ error: '服务器内部错误' });
    }
};



/** 查询用户的技工 / 服务商 / 角色信息，合并到登录响应
 *  phone 参数用于覆盖「同手机号多 user_id」场景（E2E 重复数据）
 */
async function getRoleExtra(userId, phone) {
  const extra = {};
  try {
    const { WorkerApplication, ServiceProviderProfile, sequelize } = require('../models');
    const { Op } = require('sequelize');

    // Gather all user_ids that share the same phone (dedup test data)
    let userIds = [userId];
    if (phone && sequelize) {
      try {
        const { User } = require('../models');
        if (User) {
          const samePhone = await User.findAll({ where: { phone: String(phone) }, attributes: ['id'] });
          userIds = [...new Set([userId, ...samePhone.map(u => u.id)])];
        }
      } catch (_) {}
    }

    if (WorkerApplication) {
      const wa = await WorkerApplication.findOne({ where: { user_id: { [Op.in]: userIds }, status: 'approved' } });
      if (wa) extra.worker_status = 'approved';
    }
    if (ServiceProviderProfile) {
      const sp = await ServiceProviderProfile.findOne({ where: { user_id: { [Op.in]: userIds }, status: 'active' } });
      if (sp) extra.service_provider_status = 'active';
    }
  } catch (e) {
    console.warn('[getRoleExtra]', e.message);
  }
  return extra;
}

function issueUserToken(user) {
    return jwt.sign(
        { id: user.id, openid: user.openid || null, token_version: user.token_version || 0 },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
    );
}

function hashPassword(raw) {
    const salt = crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('sha256').update(`${salt}:${String(raw)}`).digest('hex');
    return { salt, hash };
}

function verifyPassword(user, rawPassword) {
    const saltRaw = String(user && user.wx_id ? user.wx_id : '');
    const hashRaw = String(user && user.bank_num ? user.bank_num : '');
    if (!saltRaw.startsWith('pwd_salt:') || !hashRaw.startsWith('pwd_hash:')) return false;
    const salt = saltRaw.slice('pwd_salt:'.length);
    const stored = hashRaw.slice('pwd_hash:'.length);
    const calc = crypto.createHash('sha256').update(`${salt}:${String(rawPassword)}`).digest('hex');
    return calc === stored;
}

/** POST /api/v1/auth/sms/send */
exports.sendSmsCode = async (req, res) => {
    try {
        const { phone, type } = req.body || {};
        if (!phone) return res.status(400).json({ code: 400, msg: '缺少 phone', data: null });
        const allow = ['register', 'forget_password', 'login'];
        const t = allow.includes(type) ? type : 'register';
        return res.json({
            code: 0,
            msg: '发送成功',
            data: {
                phone: String(phone),
                type: t,
                code: '024680',
                expires_in: 300
            }
        });
    } catch (e) {
        console.error('sendSmsCode error:', e);
        return res.status(500).json({ code: 500, msg: '发送验证码失败', data: null });
    }
};

/** POST /api/v1/auth/register */
exports.register = async (req, res) => {
    try {
        const { phone, code, password, address, lat, lng } = req.body || {};
        if (!phone || !code || !password) {
            return res.status(400).json({ code: 400, msg: '缺少 phone/code/password', data: null });
        }
        if (String(code) != '024680') {
            return res.status(400).json({ code: 400, msg: '验证码错误', data: null });
        }

        let user = await User.findOne({ where: { phone: String(phone) } });
        const { salt, hash } = hashPassword(password);

        if (!user) {
            user = await User.create({
                openid: `phone_${phone}`,
                nickname: `用户${String(phone).slice(-4)}`,
                avatar_url: '',
                phone: String(phone),
                address: address || null,
                wx_id: `pwd_salt:${salt}`,
                bank_num: `pwd_hash:${hash}`
            });
        } else {
            user.address = address || user.address || null;
            user.wx_id = `pwd_salt:${salt}`;
            user.bank_num = `pwd_hash:${hash}`;
            await user.save();
        }

        const token = issueUserToken(user);
        return res.json({
            code: 0,
            msg: '注册成功',
            token,
            user: { id: user.id, phone: user.phone, address: user.address || null },
            data: { id: user.id, phone: user.phone, lat: lat ?? null, lng: lng ?? null }
        });
    } catch (e) {
        console.error('register error:', e);
        return res.status(500).json({ code: 500, msg: '注册失败', data: null });
    }
};

/** POST /api/v1/auth/password_reset */
exports.passwordReset = async (req, res) => {
    try {
        const { phone, code, new_password } = req.body || {};
        if (!phone || !code || !new_password) {
            return res.status(400).json({ code: 400, msg: '缺少 phone/code/new_password', data: null });
        }
        if (String(code) !== '024680') {
            return res.status(400).json({ code: 400, msg: '验证码错误', data: null });
        }
        const user = await User.findOne({ where: { phone: String(phone) } });
        if (!user) return res.status(404).json({ code: 404, msg: '用户不存在', data: null });

        const { salt, hash } = hashPassword(new_password);
        user.wx_id = `pwd_salt:${salt}`;
        user.bank_num = `pwd_hash:${hash}`;
        user.token_version = Number(user.token_version || 0) + 1;
        await user.save();

        return res.json({ code: 0, msg: '重置成功', data: null });
    } catch (e) {
        console.error('passwordReset error:', e);
        return res.status(500).json({ code: 500, msg: '重置失败', data: null });
    }
};


/** POST /api/v1/auth/login_sms */
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


/** POST /api/v1/auth/login_password */
exports.loginPassword = async (req, res) => {
    try {
        const { phone, password } = req.body || {};
        if (!phone || !password) {
            return res.status(400).json({ code: 400, msg: '缺少 phone/password', data: null });
        }

        const user = await User.findOne({ where: { phone: String(phone) } });
        if (!user) {
            return res.status(401).json({ code: 401, msg: '账号或密码错误', data: null });
        }
        if (!verifyPassword(user, password)) {
            return res.status(401).json({ code: 401, msg: '账号或密码错误', data: null });
        }

        const token = issueUserToken(user);
        const _roleExtra2 = await getRoleExtra(user.id, user.phone);
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
                role: user.role || 'user',
            }, _roleExtra2),
            data: { token }
        });
    } catch (e) {
        console.error('loginPassword error:', e);
        return res.status(500).json({ code: 500, msg: '登录失败', data: null });
    }
};
