require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json()); // 用于解析 application/json

// 静态文件目录 (未来用于上传图片)
app.use('/uploads', express.static('uploads'));

// 基础测试路由
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Community Mini-Program API!' });
});

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const coreDataRoutes = require('./routes/coreDataRoutes');
const orderRoutes = require('./routes/orderRoutes');

// -------------------
// 路由挂载
// -------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/core', coreDataRoutes);
app.use('/api/v1/orders', orderRoutes);

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
