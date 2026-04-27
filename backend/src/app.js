/**
 * Express 应用入口
 *
 * [开发阶段] 当前配置与 doc/项目开发参考.md 保持一致。
 * 启动命令:  node backend/src/app.js
 * 默认端口:  3001
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// ── 全局中间件 ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 静态资源 ───────────────────────────────────────────────────────────────
// 上传图片通过 /uploads/ 路径访问
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// ── 健康检查 ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'community-backend is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── API 路由 ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 处理 ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

// ── 全局错误处理 ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    code: err.code || 1,
    msg: err.message || '服务器内部错误'
  });
});

// ── 启动 ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API base: http://localhost:${PORT}/api/v1`);
  });
}

module.exports = app;
