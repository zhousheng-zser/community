const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权：缺少 Token 或者 Token 格式不正确' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        if (!decoded || decoded.admin !== true) {
            return res.status(403).json({ error: '禁止访问：需要管理员令牌' });
        }
        req.admin = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: '无效或已过期的 Token' });
    }
};
