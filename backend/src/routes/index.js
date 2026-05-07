/**
 * 路由统一挂载入口
 *
 * 所有业务模块路由在此集中注册，统一前缀为 /api/v1。
 * 新增模块时只需引入对应模块的 routes.js 并在下方 router.use() 中注册即可。
 */
const express = require('express');
const router = express.Router();

// ── 认证 ──────────────────────────────────────────────────────────────────
// 注意：使用实际实现的路由（src/routes/authRoutes.js）
// 而非模块中的 501 桩代码（src/modules/auth/routes.js）
const authRoutes = require('./authRoutes');

// ── 用户 ──────────────────────────────────────────────────────────────────
const userRoutes = require('../modules/user/routes');

// ── 核心功能 ──────────────────────────────────────────────────────────────
const coreRoutes = require('../modules/core/routes');

// ── 首页 ─────────────────────────────────────────────────────────────────
// const homeRoutes = require('../modules/home/routes');

// ── 本地集市 ─────────────────────────────────────────────────────────────
const marketRoutes = require('../modules/market/routes');

// ── 本地商城 ─────────────────────────────────────────────────────────────
// const shopRoutes = require('../modules/shop/routes');

// ── 惠民卡 / 福利联盟 ───────────────────────────────────────────────────
const benefitCardRoutes = require('../modules/benefit-card/routes');
const benefitAllianceRoutes = require('../modules/benefit-card/alliance.routes');
const benefitAllianceAdminRoutes = require('../modules/benefit-card/admin.routes');

// ── 优惠券 ───────────────────────────────────────────────────────────────
const couponRoutes = require('../modules/coupon/routes');

// ── 聊天 / 群聊 ──────────────────────────────────────────────────────────
const chatRoutes = require('../modules/chat/routes');

// ── 佣金 / 合伙人 / 推广员 ───────────────────────────────────────────────
const commissionRoutes = require('../modules/commission/commission.routes');
const partnerRoutes = require('../modules/commission/partner.routes');
const promoterRoutes = require('../modules/promoter/routes');

// ── 小程序配置 ───────────────────────────────────────────────────────────
const miniProgramRoutes = require('../modules/mini-program/routes');

// ── 邻里帮帮 ─────────────────────────────────────────────────────────────
const neighborAssistRoutes = require('../modules/neighbor-assist/routes');

// ── 技工工作台 ───────────────────────────────────────────────────────────
// 注意：使用实际实现的路由（src/routes/workerRoutes.js）
// 而非模块中的 501 桩代码（src/modules/worker/routes.js）
const workerRoutes = require('./workerRoutes');

// ── 商家后台 ─────────────────────────────────────────────────────────────
const merchantRoutes = require('../modules/merchant/routes');

// ── 服务商后台 ───────────────────────────────────────────────────────────
// 注意：使用实际实现的路由（src/routes/serviceProviderPortalRoutes.js）
// 而非模块中的 501 桩代码（src/modules/service-provider-portal/routes.js）
const serviceProviderRoutes = require('./serviceProviderPortalRoutes');
const serviceProviderWorkerRoutes = require('./serviceProviderWorkerRoutes');
const serviceProviderFinanceRoutes = require('./serviceProviderFinanceRoutes');

// ── 骑手端（预留） ───────────────────────────────────────────────────────
// const riderRoutes = require('../modules/rider/routes');

// ── 社区 ─────────────────────────────────────────────────────────────────
const communityRoutes = require('../modules/community/routes');

// ── 服务订单 ─────────────────────────────────────────────────────────────
// 注意：使用实际实现的路由（src/routes/serviceOrderRoutes.js）
// 而非模块中的 501 桩代码（src/modules/service-order/routes.js）
const serviceOrderRoutes = require('./serviceOrderRoutes');

// ── 消息通知 ─────────────────────────────────────────────────────────────
const messageRoutes = require('../modules/message/routes');

// ── 挂载 ─────────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/core', coreRoutes);
// router.use('/home', homeRoutes);
router.use('/market', marketRoutes);
// router.use('/shop', shopRoutes);
router.use('/benefit-coin', benefitCardRoutes);
router.use('/benefit-alliance', benefitAllianceRoutes);
router.use('/admin', benefitAllianceAdminRoutes);
router.use('/coupons', couponRoutes);
router.use('/chat', chatRoutes);
router.use('/commission', commissionRoutes);
router.use('/partner', partnerRoutes);
router.use('/promoter', promoterRoutes);
router.use('/mini-programs', miniProgramRoutes);
router.use('/neighbor-assist', neighborAssistRoutes);
router.use('/worker', workerRoutes);
router.use('/merchant', merchantRoutes);

// 服务商后台登录（独立端点，需放在 router.use('/service-provider-portal', ...) 之前）
const serviceProviderPortalController = require('../controllers/serviceProviderPortalController');
const workerPortalLoginController = require('../controllers/workerPortalLoginController');
const merchantPortalController = require('../controllers/merchantPortalController');
router.post('/service-provider-portal/login', serviceProviderPortalController.login);
router.post('/worker-portal/login', workerPortalLoginController.login);
router.post('/merchant-portal/login', merchantPortalController.login);

router.use('/service-provider-portal', serviceProviderRoutes);
router.use('/service-provider-portal/workers', serviceProviderWorkerRoutes);
router.use('/service-provider-portal/finance', serviceProviderFinanceRoutes);
// 兼容旧路径
router.use('/service-provider', serviceProviderRoutes);
router.use('/community', communityRoutes);
router.use('/service-orders', serviceOrderRoutes);
router.use('/message', messageRoutes);

// ── 文件上传（独立端点） ─────────────────────────────────────────────────
// 注：上传端点通常需要 multipart 解析，此处保留结构，
// 实际使用时需引入 multer 或对应 upload 中间件。
// router.post('/upload', authMiddleware, upload.single('file'), uploadHandler);

module.exports = router;
