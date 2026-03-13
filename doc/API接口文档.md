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

---

### 9. 维护约定

- 如需 **新增 / 修改 / 下线接口**，请在修改对应 `routes/*.js` 或 `controllers` 后，
  同步更新本文件中对应章节，以保证前后端文档一致。
