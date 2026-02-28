const axios = require('axios');
const jwt = require('jsonwebtoken');
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

        // 3. 签发 JWT Token 给前端
        const token = jwt.sign(
            { id: user.id, openid: user.openid },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '7d' } // token 7天有效
        );

        res.json({
            message: '登录成功',
            token: token,
            user: {
                id: user.id,
                nickname: user.nickname,
                avatar_url: user.avatar_url,
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};
