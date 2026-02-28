const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 规定前端请求需要在 Header 中携带 token
    // 格式：Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权：缺少 Token 或者 Token 格式不正确' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 验证 Token 是否合法且未过期
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

        // 将解密出来的用户信息挂载到 req 对象上，方便后续接口使用
        req.user = decoded;

        // 放行
        next();
    } catch (error) {
        return res.status(401).json({ error: '无效或已过期的 Token' });
    }
};
