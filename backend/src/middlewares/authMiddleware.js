const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = (req, res, next) => {
    // 规定前端请求需要在 Header 中携带 token
    // 格式：Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const errmsg = '未授权：缺少 Token 或者 Token 格式不正确';
        return res.status(401).json({ errno: 401, errmsg, error: errmsg });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 验证 Token 是否合法且未过期
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

        // 将解密出来的用户信息挂载到 req 对象上，方便后续接口使用
        req.user = decoded;

        // token_version 校验：logout 后递增版本，旧 token 将被拒绝
        const userId = decoded && decoded.id;
        if (!userId) return res.status(401).json({ errno: 401, errmsg: '无效 Token', error: '无效 Token' });

        User.findByPk(userId)
            .then((u) => {
                if (!u) {
                    return res.status(401).json({ errno: 401, errmsg: '用户不存在', error: '用户不存在' });
                }
                const serverVer = Number(u.token_version || 0);
                const tokenVer = Number(decoded.token_version || 0);
                if (serverVer !== tokenVer) {
                    return res.status(401).json({ errno: 401, errmsg: '已退出登录或 Token 已失效', error: '已退出登录或 Token 已失效' });
                }
                next();
            })
            .catch((e) => {
                console.error('authMiddleware user lookup error:', e);
                return res.status(500).json({ errno: 500, errmsg: '鉴权失败', error: '鉴权失败' });
            });
    } catch (error) {
        const errmsg = '无效或已过期的 Token';
        return res.status(401).json({ errno: 401, errmsg, error: errmsg });
    }
};
