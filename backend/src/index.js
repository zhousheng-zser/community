require('dotenv').config({
    path: require('path').resolve(__dirname, '..', '.env'),
    override: true,
    quiet: true
});
// E2E 子进程等场景：行内传入的监听端口不要被 .env 里 PORT 覆盖掉
if (process.env.E2E_API_PORT) {
    process.env.PORT = process.env.E2E_API_PORT;
}
// E2E：强制走本地 mock 微信登录（避免无效 code 调微信接口）
if (process.env.E2E_CLEAR_WX_SECRET === '1') {
    process.env.WX_APPSECRET = '';
}
const express = require('express');
const cors = require('cors');

const app = express();
/** 与 admin Vite 代理默认 VITE_PROXY_TARGET=3001 一致，避免只起前端时 ECONNREFUSED */
const PORT = parseInt(process.env.PORT, 10) || 3001;

// 中间件
app.use(cors());
// 微信支付 V3 回调验签需要原始 JSON 字符串；且不能被后续 express.json() 覆盖 req.body
app.use(
    '/api/v1/market/pay/callback',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
        const buf = req.body;
        req.rawBodyForWechat = buf && buf.length ? buf.toString('utf8') : '';
        try {
            req.body = req.rawBodyForWechat ? JSON.parse(req.rawBodyForWechat) : {};
        } catch (e) {
            req.body = {};
        }
        next();
    }
);
app.use((req, res, next) => {
    if (req.path === '/api/v1/market/pay/callback') return next();
    express.json()(req, res, next);
}); // 其余路由解析 application/json

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    next();
});

// 静态文件目录映射到项目内 data/uploads/images 目录（兼容 Linux 部署）
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'data', 'uploads', 'images')));

// 基础测试路由
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Community Mini-Program API!' });
});

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const coreDataRoutes = require('./routes/coreDataRoutes');
const userRoutes = require('./routes/userRoutes');

// -------------------
// 路由挂载
// -------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/core', coreDataRoutes);
app.use('/api/v1/service-orders', require('./routes/serviceOrderRoutes'));
app.use('/api/v1/neighbor-assist', require('./routes/neighborAssistRoutes'));
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/messages', require('./routes/messageRoutes'));
app.use('/api/v1/worker', require('./routes/workerRoutes'));

const workerPortalLoginController = require('./controllers/workerPortalLoginController');
const merchantPortalController = require('./controllers/merchantPortalController');
const serviceProviderPortalController = require('./controllers/serviceProviderPortalController');
const merchantPortalRoutes = require('./routes/merchantPortalRoutes');
const serviceProviderPortalRoutes = require('./routes/serviceProviderPortalRoutes');
app.post('/api/v1/worker-portal/login', workerPortalLoginController.login);
app.post('/api/v1/merchant-portal/login', merchantPortalController.login);
app.post('/api/v1/service-provider-portal/login', serviceProviderPortalController.login);
app.use('/api/v1/service-provider-portal', serviceProviderPortalRoutes);
app.use('/api/v1/service-provider-portal/workers', require('./routes/serviceProviderWorkerRoutes'));
app.use('/api/v1/service-provider-portal/finance', require('./routes/serviceProviderFinanceRoutes'));
app.use('/api/v1/market/merchant', merchantPortalRoutes);
app.use('/api/v1/market/shop', merchantPortalRoutes);
app.use('/api/v1/market/merchant/customers', require('./routes/merchantCustomerRoutes'));
app.use('/api/v1/market/merchant/marketing', require('./routes/merchantMarketingRoutes'));
app.use('/api/v1/market/merchant/refunds', require('./routes/merchantRefundRoutes'));
app.use('/api/v1/service-provider', require('./routes/serviceProviderRoutes'));
app.use('/api/v1/market', require('./routes/marketRoutes'));
app.use('/api/v1/activities', require('./routes/activityRoutes'));
app.use('/api/v1/feedback', require('./routes/feedbackRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/admin/communities', require('./routes/adminCommunityRoutes'));
app.use('/api/v1/admin/announcements', require('./routes/adminAnnouncementRoutes'));
app.use('/api/v1/local-goods-home', require('./routes/localGoodsHomeRoutes'));
// New modules: chat, coupons, benefit-coin, promoter, mini-programs
app.use('/api/v1/chat', require('./routes/chatRoutes'));
app.use('/api/v1/coupons', require('./routes/couponRoutes'));
app.use('/api/v1/benefit-coin', require('./routes/benefitCoinRoutes'));
app.use('/api/v1/promoter', require('./routes/promoterRoutes'));
app.use('/api/v1/mini-programs', require('./routes/miniProgramRoutes'));

require('./mountBenefitAlliance')(app);

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


const https = require('https');
const fs = require('fs');

const sslDir = path.join(__dirname, '..', 'ssl');
const hasSsl = fs.existsSync(path.join(sslDir, 'key.pem')) && fs.existsSync(path.join(sslDir, 'cert.pem'));
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT, 10) || 3001;
const HTTP_PORT = parseInt(process.env.HTTP_PORT, 10) || 3002;

if (hasSsl) {
    const httpsOptions = {
        key: fs.readFileSync(path.join(sslDir, 'key.pem')),
        cert: fs.readFileSync(path.join(sslDir, 'cert.pem'))
    };
    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server is running on https://localhost:${HTTPS_PORT}`);
    });
}

app.listen(HTTP_PORT, () => {
    console.log(`Server is running on http://localhost:${HTTP_PORT}`);
});
