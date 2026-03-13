# 前端当前进度、数据库缺口与待办事项

> 更新日期：2025-06-12
> 本文档记录最近一轮前端开发的完成情况、与后端接口/数据库的对接缺口，以及下一步待推进的工作。

---

## 一、本轮已完成工作

### 1.1 新增页面

| 页面路径 | 功能说明 |
|----------|----------|
| `pages/about/about` | 关于我们：App 介绍、核心功能、联系方式、法律条款 |
| `pages/join-worker/join-worker` | 技工入驻申请表单（picker 选行业/学历/城市，身份证/工作照上传）|
| `pages/join-service/join-service` | 服务商入驻申请（营业执照/门头/环境/证书多图上传，保存+发布双按钮）|
| `pages/join-market/join-market` | 家集市商家入驻（琥珀色背景，2 列证件照网格，选择小区独立按钮）|
| `pages/order-publish/order-publish` | 一键发布：邻里帮帮/一键发布双 Tab，地址弹窗，年月日时四列 picker |
| `pages/order-service/order-service` | 服务订单列表 |
| `pages/settings/settings` | 设置页 |
| `pages/feedback/feedback` | 帮助反馈 |
| `pages/address/address` | 地址管理 |
| `pages/my-follows/my-follows` | 我的关注 |
| `pages/my-activities/my-activities` | 参与活动 |

### 1.2 功能改进

- **社区页（community）**
  - 评论从 `wx.showModal` 升级为底部滑出面板，支持文字 + 最多 3 张图片
  - 底部悬浮"✏️ 发帖"按钮，跳转 `community-publish`
  - 顶部 Tab 区右侧加"一键发布"胶囊（红色角标"填需求 马上帮"），跳转 `order-publish`
  - 修复 `onLoad` 函数定义丢失导致的页面白屏

- **个人页（user）**
  - `joinMenus` 修复导航：原来全部绑定 `showToastWait`，改为有 `url` 走 `navigator`，无 `url` 才提示
  - 关于我们加跳转 URL

- **首页（index）**
  - 一键发布按钮补充 `bindtap="goPublish"` 及对应方法

### 1.3 图片资源迁移

- 新增 `utils/images.js`：统一管理服务器图片路径映射
- 新增 `utils/config.js → imageBaseUrl`：`http://114.55.167.14:3000`
- 改进 `utils/util.js → imgUrl()`：自动将本地占位图路径解析为服务器 URL
- 已上传 4 张占位图到服务器 `/uploads/`：

  | 语义名 | 服务器文件名 |
  |--------|-------------|
  | homeCleaning | `file-1773395942165-45947155.png` |
  | saleBanner | `file-1773395942500-585304598.png` |
  | avatarWorker | `file-1773395942842-959042242.png` |
  | defaultHead | `file-1773395943186-905167166.jpg` |

---

## 二、数据库缺口（前端已调用但后端接口不存在）

以下接口在前端代码中已发起请求，但在现有 API 文档中**未定义**，需要后端补充对应路由和数据表。

### 2.1 入驻申请类

| 前端调用 | HTTP 方法 | 说明 | 数据库需求 |
|----------|-----------|------|-----------|
| `worker/apply` | POST | 技工入驻提交 | 新增 `worker_applications` 表：姓名、手机、行业、学历、城市、简历、身份证图、工作照、证书图、状态(pending/approved/rejected) |
| `service-provider/apply` | POST | 服务商入驻提交 | 新增 `service_provider_applications` 表：店名、联系人、手机、营业执照、门头图、环境图、身份证、资质证书、状态 |
| `market/apply` | POST | 集市商家入驻提交 | 新增 `market_applications` 表：联系人、手机、店名、品类、地址、简介、推广员、统一社会信用代码、法人、经营场所照片、营业执照、所属小区、状态 |

### 2.2 社区评论图片

| 前端调用 | HTTP 方法 | 说明 | 数据库需求 |
|----------|-----------|------|-----------|
| `posts/:postId/comment` | POST | 评论接口已存在，但 body 中新增了 `image_urls` 字段 | `comments` 表需新增 `image_urls` JSON 字段存储评论图片 URL 数组 |

### 2.3 一键发布需求

| 前端调用 | HTTP 方法 | 说明 | 数据库需求 |
|----------|-----------|------|-----------|
| `orders/publish` | POST | 发布邻里帮帮需求 | 新增 `publish_orders` 表：user_id、category(代取/接送等)、address、time、content、images(JSON)、status(pending/accepted/completed) |
| `orders/recent` | GET | 获取近期发布需求列表 | 同上表，按 createdAt 倒序取最新 N 条 |

### 2.4 用户相关

| 前端调用 | HTTP 方法 | 说明 | 数据库需求 |
|----------|-----------|------|-----------|
| `user/profile` | GET | 获取用户详情含余额 | `users` 表需包含 `balance` 字段（已在 ER 图设计中有，确认服务器已建） |
| `wx/user/coupon/:userId` | GET | 获取用户优惠券列表 | 需确认 `coupons` / `user_coupons` 表是否已建 |
| `posts?category=xxx` | GET | 按分类拉取帖子 | `posts` 表需有 `category` 字段并建立索引，支持"热门话题/热门活动/邻里互动"过滤 |

### 2.5 管理后台（admin）缺口

入驻申请需要审核流程，需在管理后台（`admin/`）补充：
- `GET admin/worker-applications` 技工申请列表
- `PUT admin/worker-applications/:id` 审核通过/拒绝
- 服务商、集市商家同上

---

## 三、待推进工作

### 3.1 紧急（影响核心功能）

- [ ] **后端补充入驻申请接口**（2.1 节三张表 + 路由）
- [ ] **posts 表加 category 字段**，社区页三个 Tab 才能分类展示真实数据
- [ ] **comments 表加 image_urls 字段**，评论图片功能才能持久化
- [ ] **publish_orders 表建立**，一键发布功能才能存储

### 3.2 重要（用户体验）

- [ ] **首页数据真实化**：`index.js` 中大量 mock 数据（热门服务、技工列表、商家列表、商品瀑布流）需改为调用后端接口
  - 参考第四阶段文档的改写方案
  - 需后端提供：`/core/services/hot`、`/core/workers`、`/core/market-shops`、`/goods/feed` 等接口
- [ ] **图片资源升级**：当前占位图上传至服务器 `/uploads/` 目录（随机文件名），建议后续迁移到 OSS/CDN（参考 `01_database_and_cloud.md`）
- [ ] **微信真实登录**：当前 `app.js` 中登录流程需确认 `wx.login → /auth/login` 链路在线上环境可通
- [ ] **JWT Token 刷新机制**：Token 过期后需要静默续签，避免用户频繁被踢出登录

### 3.3 待完善页面（已建框架，内容未对接）

| 页面 | 缺少内容 |
|------|----------|
| `pages/settings/settings` | 退出登录、修改密码、通知设置等功能逻辑 |
| `pages/feedback/feedback` | 提交反馈接口 `feedback/submit` 未定义 |
| `pages/my-follows/my-follows` | 关注列表接口 `user/follows` 未定义 |
| `pages/my-activities/my-activities` | 活动列表接口 `activities/my` 未定义 |
| `pages/address/address` | 地址 CRUD 接口 `user/addresses` 未定义 |
| `pages/about/about` | 隐私政策/用户协议页面内容为空（`goPrivacy`、`goTerms` 显示 Toast） |

### 3.4 生产上线前必做

- [ ] **HTTPS**：微信小程序正式版强制要求 HTTPS，服务器需配置 SSL 证书（`utils/config.js` 中已预留注释）
- [ ] **域名备案**：将 IP 地址 `114.55.167.14` 替换为已备案域名
- [ ] **微信小程序后台**：在 MP 后台将服务器域名加入 `request 合法域名` 和 `uploadFile 合法域名` 白名单
- [ ] **OSS 迁移**：现阶段图片存本地服务器，正式版应迁至阿里云 OSS / 腾讯云 COS，参考 `01_database_and_cloud.md`
- [ ] **推客/佣金系统**：`Promotions` 表及分佣结算逻辑尚未实现

---

## 四、接口对照速查

> 已实现 ✅ | 前端已调用但后端未实现 ❌ | 部分实现 ⚠️

| 接口 | 状态 | 备注 |
|------|------|------|
| `POST /auth/login` | ✅ | 微信登录 |
| `GET /core/banners` | ✅ | 首页轮播图 |
| `GET /core/services/hot` | ✅ | 热门服务 |
| `GET /core/categories` | ✅ | 分类列表 |
| `GET /posts?category=xx` | ⚠️ | category 参数过滤未实现 |
| `POST /posts` | ✅ | 发布动态 |
| `POST /posts/:id/like` | ✅ | 点赞 |
| `POST /posts/:id/comment` | ⚠️ | 已有，但不支持 image_urls |
| `GET /orders/my` | ✅ | 我的订单 |
| `POST /orders` | ✅ | 下单 |
| `POST /orders/:id/pay` | ✅ | 模拟支付 |
| `GET /user/profile` | ✅ | 用户资料含余额 |
| `GET /wx/user/coupon/:id` | ⚠️ | 待确认是否已实现 |
| `POST /upload` | ✅ | 文件上传 |
| `POST /worker/apply` | ❌ | 技工入驻 |
| `POST /service-provider/apply` | ❌ | 服务商入驻 |
| `POST /market/apply` | ❌ | 集市商家入驻 |
| `POST /orders/publish` | ❌ | 一键发布需求 |
| `GET /orders/recent` | ❌ | 近期发布列表 |
| `GET /user/follows` | ❌ | 我的关注 |
| `GET /activities/my` | ❌ | 参与活动 |
| `GET/POST /user/addresses` | ❌ | 地址管理 |
| `POST /feedback/submit` | ❌ | 提交反馈 |
