# 社区 API 接口文档 (v1)

> [!IMPORTANT]  
> **重大 BUG 修复指引 (2026-03-12)**  
> 经诊断，当前后端发帖逻辑存在字段丢失问题，请后端开发人员按照以下说明修正：
> 1. **文件**：`backend/src/controllers/postController.js`
> 2. **函数**：`createPost` (约 180 行处)
> 3. **修复**：在 `Post.create` 方法中，增加接收并保存 `category` 字段。
>    ```javascript
>    const newPost = await Post.create({
>        user_id: userId,
>        content: content || '',
>        category: req.body.category || '邻里互动', // <-- 务必补上这一行，否则分类过滤会失效
>        images: imagePaths,
>        location: location || ''
>    });
>    ```
> 4. **完成后**：请重启后端 Node 服务。

## 社区小程序后端接口文档（v1）

**基础信息**

- **服务地址**：`http://114.55.167.14:3000`
- **统一前缀**：`/api/v1`
- **数据格式**：`Content-Type: application/json`（上传文件接口除外）
- **鉴权方式**：登录成功后返回 `token`（JWT），前端在需要登录的接口上通过：
  - HTTP 头：`Authorization: Bearer <token>`
  - 或根据实际实现使用 `token` 字段（若中间件有调整请一并更新文档）

---

### 0. 需求记录（变更追踪）

| 序号 | 需求时间       | 需求发起方 → 接收方          | 需求详情                                                                 | 相关接口 / 模块                          | 完成情况 |
| ---- | -------------- | ----------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- | -------- |
| 1    | 2026-03-12     | 前端（小程序） → 后端（社区） | 发帖接口需保存 `category` 分类字段，并支持通过 JSON 传递图片路径数组。 | 发帖：`POST /api/v1/posts/`、`createPost` | 已完成   |
| 2    | 2026-06-12     | 前端 → 后端                   | 商家入驻：技工/服务商/集市三表及提交接口。                              | `POST /api/v1/worker/apply`、`/service-provider/apply`、`/market/apply` | 已完成（全链路跑通） |
| 3    | 2026-06-12     | 前端 → 后端                   | 帮帮一键发布：需求单表、发布接口、近期列表。                             | `POST /api/v1/orders/publish`、`GET /api/v1/orders/recent` | 已完成（全链路跑通） |
| 4    | 2026-06-12     | 前端 → 后端                   | 帖子表增加 `category`、评论表增加 `image_urls`，评论接口支持图文。       | 迁移、`Comment` 模型、`POST /api/v1/posts/:postId/comment` | 已完成（全链路跑通） |
| 5    | 2026-06-12     | 前端 → 后端                   | 基础用户交互：我的关注、我参与的活动、地址 CRUD、意见反馈。             | `GET /api/v1/user/follows`、`GET /api/v1/activities/my`、`/user/addresses`、`POST /api/v1/feedback/submit` | 已完成   |
| 6    | 2026-06-12     | 前端 → 后端                   | 管理后台：技工入驻申请列表与审批接口预留。                               | `GET /api/v1/admin/worker-applications`、`PUT /api/v1/admin/worker-applications/:id` | 已完成   |
| 7    | 2026-03-15     | 前端 → 后端                   | 首页家推：微信小店推流商品库及“购买每单返”回调接口。 | 表 `rewards`、表 `shop_products`、`POST /api/v1/reward/trigger`、管理端 `shop-products` CRUD、`GET /api/v1/shop-products` | 已完成   |
| 8    | 2026-03-15     | 前端 → 后端                   | 首页家推：新增“视频号直播间”管理下发需求（含主播头像与爆品图）。 | 表 `live_streams`（含 `avatar_url`）、`GET /api/v1/lives/active`、管理端 CRUD | 已完成   |
| 9    | 2026-03-15     | 用户 → 架构师                 | 产品与直播运营位结构再完善：增加商品图片及多维价格标识、主播头像等 | `API接口文档.md` 9, 10节扩充 | 文档已更新 |

> 后续有新的需求或接口调整，请在此表中新增一行，并在下方对应接口说明里同步更新。

---

### 1. 认证 Auth（`/api/v1/auth`）

- **登录 / 注册并登录**
  - **URL**：`POST /api/v1/auth/login`
  - **请求体**：
    - `code`：微信登录临时 `code`（必填）
    - `nickname`：昵称（可选）
    - `avatar_url`：头像 URL（可选）
    - `phone`：手机号（可选）
  - **返回**：
    - `token`：登录后的 JWT
    - `user`：用户基础信息

- **兼容接口：获取 key（转发到 login）**
  - **URL**：`GET /api/v1/auth/wx/getkey/:code`
  - **说明**：为兼容旧小程序中写死的 `api/wx/getkey`，内部实际上复用 `login` 逻辑。

---

### 2. 社区帖子 Posts（`/api/v1/posts`）

- **获取帖子列表（公共）**
  - **URL**：`GET /api/v1/posts/`
  - **鉴权**：无
  - **说明**：获取首页/社区帖子列表。

- 以下接口 **均需登录（authMiddleware）**：

- **获取我发布的帖子**
  - **URL**：`GET /api/v1/posts/my/published`

- **获取我点赞过的帖子**
  - **URL**：`GET /api/v1/posts/my/liked`

- **获取我参与过的帖子（评论/互动）**
  - **URL**：`GET /api/v1/posts/my/participated`

- **发布帖子**
  - **URL**：`POST /api/v1/posts/`
  - **鉴权**：需要
  - **请求类型**：`application/json`
  - **JSON 字段**：
    - `content`：文字内容（如有）
    - `location`：地理位置（可选）
    - `images`：由上传接口获取的相对路径数组，如 `["/uploads/a.jpg", "/uploads/b.jpg"]`
  - **说明**：推荐先调用 `/upload` 接口逐个上传图片，再调用此接口下发最终帖子。

- **点赞 / 取消点赞**
  - **URL**：`POST /api/v1/posts/:postId/like`
  - **说明**：同一接口，若已点赞则取消，未点赞则点赞。

- **发表评论**
  - **URL**：`POST /api/v1/posts/:postId/comment`

---

### 3. 核心数据 Core Data（`/api/v1/core`）

- **获取 Banner 列表**
  - **URL**：`GET /api/v1/core/banners`
  - **鉴权**：无

- **获取服务类目列表**
  - **URL**：`GET /api/v1/core/categories`

- **获取热门服务**
  - **URL**：`GET /api/v1/core/services/hot`

- **按类目获取服务列表**
  - **URL**：`GET /api/v1/core/categories/:categoryId/services`

- **获取服务详情**
  - **URL**：`GET /api/v1/core/services/:id`

---

### 4. 订单 Orders（`/api/v1/orders`）

- 以下接口 **均需登录（authMiddleware）**：

- **创建订单**
  - **URL**：`POST /api/v1/orders/`

- **获取我的订单列表**
  - **URL**：`GET /api/v1/orders/my`

- **模拟支付订单**
  - **URL**：`POST /api/v1/orders/:id/pay`

---

### 5. 用户 User（`/api/v1/user` + 兼容接口）

> `/api/v1/user/*` 下的接口默认均需登录（authMiddleware）。

- **获取个人资料**
  - **URL**：`GET /api/v1/user/profile`

- **更新个人资料（含头像上传）**
  - **URL**：`POST /api/v1/user/profile`
  - **请求类型**：`multipart/form-data`
  - **字段**：
    - 文件字段：`avatar`（头像文件）
    - 其他文本字段：如昵称、电话等

- **兼容旧路径：更新用户信息**
  - **URL**：`POST /api/v1/user/api/user_info/update`
  - **说明**：为兼容前端旧写法，内部与 `POST /api/v1/user/profile` 逻辑一致。

- **兼容接口：个人中心信息**
  - **URL**：`GET /api/v1/acount/info`
  - **说明**：为匹配老前端写死路径而加的 mock 接口，返回用户账户信息。

- **兼容接口：用户优惠券**
  - **URL**：`GET /api/v1/wx/user/coupon/:id`
  - **说明**：根据前端老代码约定返回用户优惠券信息。

---

### 6. 消息 / 聊天 Messages（`/api/v1/messages`）

> 全部需要登录（authMiddleware）。

- **获取我的会话列表**
  - **URL**：`GET /api/v1/messages/conversations`

- **获取某个会话的历史消息**
  - **URL**：`GET /api/v1/messages/history/:conversationId`

- **删除（隐藏）某个会话**
  - **URL**：`DELETE /api/v1/messages/conversations/:conversationId`

- **发送私聊消息**
  - **URL**：`POST /api/v1/messages/send`

- **发送系统广播消息**
  - **URL**：`POST /api/v1/messages/broadcast`

---

### 7. 公共与上传接口

- **健康检查 / 欢迎页**
  - **URL**：`GET /`
  - **说明**：返回简单 JSON，确认服务是否在线。

- **文件上传（通用单文件）**
  - **URL**：`POST /api/v1/upload`
  - **请求类型**：`multipart/form-data`
  - **字段**：`file`
  - **返回**：`{ url: "/uploads/<filename>" }`

- **静态资源访问**
  - **URL 前缀**：`/uploads/**`
  - **说明**：映射到服务器本地的图片存储目录，用于访问已上传的图片。

---

### 8. 新增需求功能区 (2026-06 迭代)

> [!TIP]  
> **前端表单对接与多图上传安全指引 (2026-03-14)**  
> 经联调大考，为杜绝 500 序列化报错并保障前后端架构稳定，未来前端在开发复杂表单（如入驻申请、帮帮发布、多图帖子）时**务必严格遵循以下提交流程规范**：
> 1. **严禁直传微信临时路径**：以 `http://tmp/` 或 `wxfile://` 开头的图片绝对不可直接写入 Payload。必须在拦截提交事件后，运用类似于 `await util.uploadFile('upload', path)` 的封装方法，提前取得后端的正式相对路径（如 `/uploads/xxx.jpg`）。
> 2. **JSON 入库强清洗机制**：务必遍历剔除所有没填的空字符串 `""` 以及无文件的空数组 `[]`（通过 `delete payload[key]`）。以此截断发给后端的脏数据，从而完美触发 MySQL 的 `DEFAULT NULL`。

#### 8.1 商家入驻申请类 (亟需建表)

为了支撑 3 类角色的入驻，请后端在数据库（MySQL）中执行以下建表语句，并提供对应 POST 模型接口：

<details>
<summary>展开查看：入驻申请三表 SQL 结构</summary>

```sql
-- 1. 技工入驻申请表
CREATE TABLE `worker_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '申请人用户ID',
  `name` varchar(50) NOT NULL COMMENT '真实姓名',
  `phone` varchar(20) NOT NULL COMMENT '联系电话',
  `industry` varchar(50) NOT NULL COMMENT '所属行业分类',
  `education` varchar(50) DEFAULT NULL COMMENT '学历',
  `city` varchar(50) DEFAULT NULL COMMENT '所在城市',
  `resume` text COMMENT '个人简介/简历',
  `id_card_url` varchar(255) NOT NULL COMMENT '身份证照片URL',
  `work_photo_url` varchar(255) DEFAULT NULL COMMENT '工作照URL',
  `certificate_url` json DEFAULT NULL COMMENT '资质证书URL数组',
  `status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技工入驻申请表';

-- 2. 服务商入驻申请表
CREATE TABLE `service_provider_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '申请人ID',
  `shop_name` varchar(100) NOT NULL COMMENT '店铺名称',
  `contact_name` varchar(50) NOT NULL COMMENT '联系人有效称呼',
  `phone` varchar(20) NOT NULL COMMENT '联系电话',
  `license_url` varchar(255) NOT NULL COMMENT '营业执照',
  `shop_front_url` varchar(255) DEFAULT NULL COMMENT '门头照片',
  `environment_url` json DEFAULT NULL COMMENT '环境照片组',
  `id_card_url` varchar(255) NOT NULL COMMENT '法人/代理人身份证',
  `certificate_url` json DEFAULT NULL COMMENT '资质证书',
  `status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务商入驻申请表';

-- 3. 集市商家入驻申请表
CREATE TABLE `market_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `contact_name` varchar(50) NOT NULL COMMENT '联系人',
  `phone` varchar(20) NOT NULL,
  `shop_name` varchar(100) NOT NULL COMMENT '集市店铺名',
  `category` varchar(50) NOT NULL COMMENT '经营品类',
  `address` varchar(255) NOT NULL COMMENT '详细地址',
  `description` text COMMENT '简介',
  `promoter_id` int(11) DEFAULT NULL COMMENT '邀请人/推广员ID',
  `credit_code` varchar(100) DEFAULT NULL COMMENT '统一社会信用代码',
  `legal_person` varchar(50) DEFAULT NULL COMMENT '法人',
  `place_photo_url` json DEFAULT NULL COMMENT '经营场所多图',
  `license_url` varchar(255) DEFAULT NULL COMMENT '营业执照多图',
  `community_id` int(11) DEFAULT NULL COMMENT '所属小区ID',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='集市商家入驻申请表';
```
</details>

- **技工入驻前端提交地址**：`POST /api/v1/worker/apply`
  - **请求体示例 (JSON)**：
    ```json
    {
      "name": "张师傅",
      "phone": "13800001111",
      "industry": "家电维修",
      "education": "大专",
      "city": "杭州市",
      "resume": "从事空调维修10年...",
      "id_card_url": "/uploads/idcard.jpg",
      "work_photo_url": "/uploads/work.jpg",
      "certificate_url": ["/uploads/cert1.jpg"]
    }
    ```
  - **响应体示例 (JSON)**：
    ```json
    {
      "code": 0,
      "msg": "申请提交成功，请等待运营审核",
      "data": { "application_id": 101, "status": "pending" }
    }
    ```
- **服务商前端提交地址**：`POST /api/v1/service-provider/apply`
  - **请求体示例 (JSON)**：
    ```json
    {
      "shop_name": "杭州安心保洁",
      "contact_name": "李经理",
      "phone": "13900002222",
      "license_url": "/uploads/license.jpg",
      "shop_front_url": "/uploads/front.jpg",
      "environment_url": ["/uploads/env1.jpg", "/uploads/env2.jpg"],
      "id_card_url": "/uploads/idcard2.jpg"
    }
    ```
  - **响应体示例 (JSON)**：
    ```json
    {
      "code": 0,
      "msg": "申请提交成功"
    }
    ```
- **集市前端提交地址**：`POST /api/v1/market/apply`
  - **请求体示例 (JSON)**：
    ```json
    {
      "shop_name": "老鸭粉丝汤(滨江店)",
      "contact_name": "王老板",
      "phone": "18800003333",
      "category": "餐饮美食",
      "address": "滨江区某某路1号",
      "description": "十年老店，正宗口味",
      "credit_code": "91330108XXXXX",
      "legal_person": "王某某",
      "place_photo_url": ["/uploads/shop1.jpg"],
      "community_id": 12
    }
    ```
  - **响应体示例 (JSON)**：
    ```json
    {
      "code": 0,
      "msg": "申请提交成功",
      "data": null
    }
    ```

#### 8.2 帮帮一键发布需求 (亟需建表)

需要支撑前端首页的“填需求 马上帮”悬浮按钮。

<details>
<summary>展开查看：需求订单表 SQL 结构</summary>

```sql
CREATE TABLE `publish_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '发单人ID',
  `category` varchar(50) NOT NULL COMMENT '需求类别(如:代取/维修/接送)',
  `address` varchar(255) NOT NULL COMMENT '服务发生地址/上门地址',
  `expected_time` datetime DEFAULT NULL COMMENT '期望执行时间',
  `content` text NOT NULL COMMENT '具体文字需求说明',
  `images` json DEFAULT NULL COMMENT '上传附件多图URL',
  `status` enum('pending','accepted','completed','cancelled') DEFAULT 'pending' COMMENT '订单流转状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区帮帮发布需求单';
```
</details>

- **发布邻里帮帮接口**：`POST /api/v1/orders/publish` (提取校验数据写入库)
  - **请求体示例 (JSON)**：
    ```json
    {
      "category": "代客办事",
      "address": "滨江区某小区3幢",
      "expected_time": "2026-06-15 14:00:00",
      "content": "需要帮忙取一个大件快递，大概20公斤，希望带小推车。",
      "images": ["/uploads/package_box.jpg"]
    }
    ```
  - **响应体示例 (JSON)**：
    ```json
    {
      "code": 0,
      "msg": "发布成功",
      "data": {
        "order_id": 502,
        "status": "pending"
      }
    }
    ```
- **获取近期发布需求列表**：`GET /api/v1/orders/recent` (按创建时间倒序返回展示)

#### 8.3 社区旧表字段缺失改造 (极急修正)

前端社区发图片和发多媒体评论的功能已经做好并提交 JSON 数组。旧版数据库发生字段类型缺失报错，请后端立即执行增字段语句：

```sql
-- 给帖子表增加类别，供各种Tab列表页过滤
ALTER TABLE `posts` 
ADD COLUMN `category` varchar(50) DEFAULT '邻里互动' COMMENT '帖子所归属的主题分类' AFTER `content`;

-- 给评论表增加图片JSON列，支持图文评论功能
ALTER TABLE `comments` 
ADD COLUMN `image_urls` json DEFAULT NULL COMMENT '评论所附带的图片数组(至多3张)' AFTER `content`;
```

- **发表带有图片的评论接口映射**：`POST /api/v1/posts/:postId/comment` (记得同时取 `req.body.content` 和 `req.body.image_urls`)
  - **请求体示例 (JSON)**：
    ```json
    {
      "content": "这家店我昨天刚去过，味道确实不错，强烈推荐这道招牌菜！",
      "reply_to_user_id": null,
      "image_urls": [
        "/uploads/food1.jpg",
        "/uploads/food2.jpg"
      ]
    }
    ```
  - **响应体示例 (JSON)**：
    ```json
    {
      "code": 0,
      "msg": "评论成功",
      "data": {
        "comment_id": 8801,
        "image_urls": ["/uploads/food1.jpg", "/uploads/food2.jpg"],
        "created_at": "2026-06-12T10:00:00.000Z"
      }
    }
    ```

#### 8.4 基础用户交互补齐
- **获取我的关注列表**：`GET /api/v1/user/follows`
- **获取我参与的活动**：`GET /api/v1/activities/my`
- **地址管理 CRUD**：`/api/v1/user/addresses` (GET 获取列表、POST 新增、PUT 修改、DELETE 删除)
- **提交意见反馈**：`POST /api/v1/feedback/submit`

#### 8.5 管理后台审核流预留 (Admin UI)
未来供 PC 端操作的总管理接口预留规范（目前只需返回简单的待确认 JSON 数据结构）：
- `GET /api/v1/admin/worker-applications` 获取技工入驻申请列表
- `PUT /api/v1/admin/worker-applications/:id` 审批操作通过或驳回

#### 8.5 管理后台审核流预留 (Admin UI)
未来供 PC 端操作的总管理接口预留规范（目前只需返回简单的待确认 JSON 数据结构）：
- `GET /api/v1/admin/worker-applications` 获取技工入驻申请列表
- `PUT /api/v1/admin/worker-applications/:id` 审批操作通过或驳回

---

### 9. 微信小店“购买每单返”分销交易需求 (待研发)

> [!IMPORTANT]
> **前端已完成 `<store-product>` 组件接入及相关页面的改造。现向后端提出完整的建表与接口需求：**

由于前端在“家推”商品详情页点击购买时，不再走自有的订单支付体系，而是直接拉起微信官方的 `<store-product>` 微信小店组件完成闭环交易。我们需要后端做好 **返佣记录的登记** 以及 **接收微信小店服务端成功支付的回调监听**。

<details>
<summary>展开查看：返利记录表 Sql 结构建议</summary>

```sql
CREATE TABLE `rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL COMMENT '下拉人/推广人的微信openid',
  `product_id` varchar(100) NOT NULL COMMENT '微信小店的商品ID',
  `order_id` varchar(100) NOT NULL COMMENT '微信小店生成的唯一订单号',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '应返利金额',
  `status` enum('pending','paid','failed','refunded') DEFAULT 'pending' COMMENT '返利状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '确认返利到账时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_id` (`order_id`),
  KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信小店分销交易返利记录表';

CREATE TABLE `shop_products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL COMMENT '商品分类，如: 爆款专区、高佣专区',
  `product_id` varchar(100) NOT NULL COMMENT '微信小店真实商品ID (用于唤起交易)',
  `shop_appid` varchar(100) NOT NULL COMMENT '小店所属小程序AppId',
  `name` varchar(150) NOT NULL COMMENT '商品外显名称',
  `main_image` varchar(255) NOT NULL COMMENT '首页展示主图 (建议尺寸 1:1 或 800x800px)',
  `detail_images` json DEFAULT NULL COMMENT '详情页轮播图数组 (建议至少3张，比例 1:1)',
  `poster_image` varchar(255) DEFAULT NULL COMMENT '分享专属海报素材底图 (建议尺寸 750x1334px)',
  `pay_price` decimal(10,2) NOT NULL COMMENT '到手支付价',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '划线参考价',
  `rebate_amount` decimal(10,2) NOT NULL COMMENT '每单返利单价(或百分比值)',
  `sales_volume` int(11) DEFAULT '0' COMMENT '已售数量/基础销量基数',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '推流上下架状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='前端展示用: 家推商品推广信息管理表';
```
</details>

1. **商品管理需求**：必须通过后台手动（或接口抓取）维护 `shop_products` 表中的推流展示信息。前端会在诸如“每日上新”、“热卖TOP榜”直接拉取这些信息用于预展示，并在用户点击时真正用 `product_id` 呼叫出微信原生交易面板。
2. **前端触发返利记录的接口**：`POST /api/v1/reward/trigger`
   - **请求体 JSON 示例**：
     ```json
     {
       "openid": "o123456789xxxx",
       "productId": "PRODUCT_123456789",
       "orderId": "ORDER_123456789"
     }
     ```
   - **后端实现建议**：收到请求后，后端调用微信小店官方 API 验证该 `orderId`，确定真实有效后在 `rewards` 表里写入一条状态为 `pending` 的登记记录。

2. **接收微信小店回调接口（核心）**：`POST /api/v1/wechat/shop/callback`
   - **说明**：此接口的URL需要你登录微信商户后台（或优选联盟配置处）填入回调白名单中。该接口不可以加业务的 JWT Token 校验拦截。
   - **核心逻辑**：微信在订单支付成功、退款等节点会自动给此接口发 POST 请求。你必须用环境变量 `WECHAT_SHOP_SECRET` 先做 MD5（或SHA）签章验证防伪。当 `status` 等于 `"PAID"` 时，将 `rewards` 表中这笔订单定为 `"paid"` 并为对应用户的系统钱包增加这笔返利数值。
   - **Node.js (Express) 实现参考代码**：
     ```javascript
     const crypto = require('crypto');
     
     router.post('/api/wechat/shop/callback', async (req, res) => {
       const { orderId, status, timestamp, nonce, signature } = req.body;
       
       // 验签验证
       const calculatedSign = crypto.createHash('md5')
         .update(`orderId=${orderId}&status=${status}&timestamp=${timestamp}&nonce=${nonce}${process.env.WECHAT_SHOP_SECRET}`)
         .digest('hex');
       
       if (calculatedSign !== signature) {
         return res.status(401).send('Invalid signature');
       }
       
       if (status === 'PAID') {
         // 根据你实际的库调整更新语句
         await db.query('UPDATE rewards SET status = ?, paid_at = NOW() WHERE order_id = ?', ['paid', orderId]);
         // TODO: 并为对应 openid 用户余额增加奖励金额规则
       }
       res.send('SUCCESS'); //必须回复以防微信重试机制
     });
     ```

---

### 10. 家推-视频号直播推流管理 (待研发)

> [!IMPORTANT]  
> **需求背景与原理说明**：
> 前端“进入直播间”点击后，使用的是微信原生 API `wx.openChannelsLive({ finderUserName: "xxx" })` 以唤起视频号直播。
> 为了不将视频号 ID 锁死在前端代码中，我们需要后端管理并下发各个直播场次的数据配置。

<details>
<summary>展开查看：直播场次表结构建议</summary>

```sql
CREATE TABLE `live_streams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL DEFAULT '热推直播间' COMMENT '直播分类(如:热推直播间, 当地特产直播间)',
  `title` varchar(100) NOT NULL COMMENT '直播间外显标题(如:科尔沁食品官方直播)',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT '主播或品牌头像图 (圆图，建议尺寸 200x200px)',
  `brand_logo` varchar(255) DEFAULT NULL COMMENT '品牌/商家 Logo图',
  `cover_image` varchar(255) DEFAULT NULL COMMENT '直播封面图 (通常用于大卡片场景)',
  `rebate_info` varchar(50) DEFAULT '10%' COMMENT '外显最高返佣描述(如: 10% 或 ￥50)',
  `promoters_count` int(11) DEFAULT '0' COMMENT '目前推广人数',
  `hot_goods` json DEFAULT NULL COMMENT '直播间主推爆品的图片数组 [{"image":"url"}] (要求为正方形 400x400px，供详情页三宫格展示)',
  `finder_username` varchar(100) NOT NULL COMMENT '必须是视频号原始ID，通常以sph开头',
  `feed_id` varchar(100) DEFAULT NULL COMMENT '(可选)特定某场直播的ID',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '1为上架显示，0为下架',
  `sort_order` int(11) DEFAULT '0' COMMENT '显示排序，数字越大越靠前',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频号直播推广配置表';
```
</details>

1. **管理后台（运营操作）接口需求**：
   - 需实现针对 `live_streams` 表的增、删、改、查管理接口。
   - 运营上传数据时，除了录入封面和标题，还需要上传该场次对应的“爆品图片”到 `hot_goods` 列中。其中**爆品图片建议统一为 1:1 正方形（推荐分辨率不少于 400x400px）**以防止在前端变形。
   - 必须记录 `avatar_url`（主播头像），以便在直播详情页（`push-live-promo`）的左上角区域渲染圆形头像信息。
   - **关键告知点**：提醒运营录入时，核心字段 `finder_username` 必须填入该主播或品牌的**视频号原始ID**（并非微信号和名字，而是一串带 "sph" 的英文数字代码。获取方式需登录其视频号助手后台查看）。

2. **小程序端拉取接口**：`GET /api/v1/lives/active`
   - **查询参数**：`?category=热推直播间` (选填)
   - 前端通过此接口向后端请求在“家推”展示的活跃直播源。若传了 `category` 按照对应条件检索，如“当地特产直播间”。
   - 须返回按照 `sort_order` 排好序的活跃项目列表。前端除了需要 `finder_username` 用于跳转外，还需要后端下发展示元素如：`promoters_count` (推广人数)、`rebate_info` (返佣比例)、`brand_logo` 和 `hot_goods` (爆品JSON)。

---

### 11. 维护约定

- 如需 **新增 / 修改 / 下线接口**，请在修改对应 `routes/*.js` 或 `controllers` 后，
  同步更新本文件中对应章节，以保证前后端文档一致。
