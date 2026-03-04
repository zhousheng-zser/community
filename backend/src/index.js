require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json()); // 用于解析 application/json

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    next();
});

// 静态文件目录映射到 E 盘外部目录
const path = require('path');
app.use('/uploads', express.static(path.join('E:', 'cw2026', 'community', 'uploads', 'images')));

// 基础测试路由
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Community Mini-Program API!' });
});

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const coreDataRoutes = require('./routes/coreDataRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

// -------------------
// 路由挂载
// -------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/core', coreDataRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/messages', require('./routes/messageRoutes'));

// ===================
// User Profile Mock Routes
// 为了匹配前端直接写死的接口名而临时添加
// ===================
const userController = require('./controllers/userController');
app.get('/api/v1/acount/info', userController.getAccountInfo);
app.get('/api/v1/wx/user/coupon/:id', userController.getUserCoupons);

// 通用单文件上传接口
const upload = require('./utils/upload');
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
});


// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
