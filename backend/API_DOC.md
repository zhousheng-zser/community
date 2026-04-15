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
| 7    | 2026-03-15     | 前端 → 后端                   | 首页家推：微信小店推流商品库及“购买每单返”回调接口。 | 旧：`rewards`、`shop_products`、`/reward/trigger`、`/shop-products`、`/wechat/shop/callback` | **已下线（2026-03-28）** |
| 8    | 2026-03-15     | 前端 → 后端                   | 首页家推：新增“视频号直播间”管理下发需求（含主播头像与爆品图）。 | 表 `live_streams`（含 `avatar_url`）、`GET /api/v1/lives/active`、管理端 CRUD | 已完成   |
| 9    | 2026-03-15     | 用户 → 架构师                 | 产品与直播运营位结构再完善：增加商品图片及多维价格标识、主播头像等 | `API接口文档.md` 9, 10节扩充 | 文档已更新 |
| 10   | 2026-03-17     | 前端 → 后端                   | 本地集市一期：店铺/商品/购物车/下单/支付回调，完整交易闭环子系统。 | `market_*` 7表、`/api/v1/market/**` | 已完成（MVP闭环） |
| 11   | 2026-03-17     | 前端 → 后端                   | 收货地址：地图选点经纬度落库；本地集市首页 GPS 与**默认**收货地址 &lt;1km 时吸附该默认地址坐标（与店铺 5km 半径区分）；用户可地图重新选点覆盖；**默认地址字段** `is_default` / `isDefault` 与唯一性规则。 | `user/addresses`、`scripts/backfill_address_default.js` | 已完成 |

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
  - **默认地址标识**：每条地址持久化「是否默认」；库字段 **`is_default`**（0/1）；接口响应同时提供 **`is_default`** 与 **`isDefault`**（boolean），便于前端。同一用户**至多一条**默认；**该用户首条新增地址**服务端强制为默认；新增非首条时仅当请求体 **`is_default` / `isDefault` 为真** 时设为默认并自动取消其他默认；**PUT** 仅当 body **显式包含** `is_default` 或 `isDefault` 时更新默认状态（可设为默认或取消）；**DELETE** 后若仍有地址则自动 `ensure` 保证仍有一条默认。历史数据可执行 `node scripts/backfill_address_default.js` 对齐规则。详见项目根目录 **`收货地址_默认字段_前端对后端需求.md`**。
  - **收货地址扩展字段（地图选点 / 本地集市吸附依赖）**：
    - `latitude` / `longitude`：number，**GCJ-02**（与微信小程序 `wx.getLocation` / `wx.chooseLocation` 一致）；未地图选点可为 `null`。
    - `location_poi_name`：string，可选，地图 POI 名称。
  - **列表 GET**：返回上述字段及默认标识；首页「1km 吸附」当前在小程序端用 **默认收货地址** 坐标与实时 GPS 计算（距默认地址 &lt;1km 时用默认地址点；用户可地图重选覆盖）。**无 GPS 时** 若默认地址有坐标则用作请求位置；**仅一条地址**时服务端已保证其为默认；**既无 GPS 又无可用地址坐标** 时，`market/shops` 仅按 **综合排序**（不传 `user_lat`/`user_lng` 或按后端约定）。**首条新增地址** 服务端强制默认，客户端亦可传 **`is_default: true`**。
  - **库表变更原则**：对所有表字段 **先检查是否存在 → 不存在则新增 → 已存在则审视语义与类型 → 合理则保留（文档注明覆盖含义）、不合理则修改并评估迁移**；详见 `doc/本地集市店铺化_FE-BE沟通纪要_08_BE.md` §3.2。
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

### 9. 微信小店链路（已下线）

> [!IMPORTANT]
> 自 **2026-03-28** 起，微信小店相关后端接口与数据模型已移除，不再对外提供：
> - `GET /api/v1/shop-products`
> - `POST /api/v1/reward/trigger`
> - `POST /api/v1/wechat/shop/callback`
> - 管理端 `/api/v1/admin/shop-products` CRUD
> - 相关模型：`shop_products`、`rewards`

当前首页“本地好物”统一改为从 **本地集市真实商品** 获取，见下方 **12. 本地集市 Market** 章节与 `local-goods-home` 接口说明。

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

### 12. 本地集市 Market（一期交易闭环）

> 本地集市为独立 `market` 领域，交易逻辑不混入 `core`。所有接口返回统一结构：`{ code, msg, data }`。

#### 12.0 首页本地好物聚合（集市商品来源）

- **首页模块聚合**：`GET /api/v1/local-goods-home/modules`
  - Query：`user_lat`、`user_lng`、`distance_km`（默认 5）
  - 返回：`daily_news`、`top_sales`、`periodic_modules`、`feed_modules`
  - 商品来源：`market_goods` + `market_shops`（仅上架商品 + 有效店铺 + 距离范围内）
- **Feed 分页**：`GET /api/v1/local-goods-home/feed-products`
  - Query：`module_name`（必填）、`page`、`page_size`、`user_lat`、`user_lng`、`distance_km`
  - 返回：`{ list, has_more }`
- **金刚区专区列表**：`GET /api/v1/local-goods-home/zone-products`
  - Query：`zone_id`（1～4）、`page`、`page_size`、`user_lat`、`user_lng`、`distance_km`；礼物专区可选 `gift_sub_category`；甄选可选 `sidebar_category`
  - 返回：`{ list, sub_categories?, sidebar_categories? }`（仅对应专区返回子分类/侧栏，否则空数组）
- **导购频道**：`GET /api/v1/local-goods-home/channel-products`
  - Query：`channel_key`（`brand_goods` | `jiuzhou_haowu` | `autumn_winter`）、分页与坐标同上
  - 返回：`{ list }` 或 `{ tab_groups }`（九州等多 Tab 频道用 `tab_groups`）
- **字段约定（最小）**：`id`、`name`、`pay_price`、`rebate_amount`、`main_image`、`shop_id`、`distance_km`
- **无坐标策略**：返回空列表（不回退全量商品）。

#### 12.1 店铺与商品（公共接口）

- **店铺列表**：`GET /api/v1/market/shops`
  - **查询参数**：
    - `category`（可选）：分类编码（如 `AAAA`～`AAAJ`）。
    - `page`、`page_size`：分页。
    - `sort`（可选）：`comprehensive` / `sales` / `delivery_time` / **`distance`**（有用户坐标时按距离升序，详见《本地集市店铺化_FE-BE沟通纪要_07_BE》）。
    - **`user_lat`、`user_lng`**（可选，GCJ-02）：用户纬度/经度；与 `radius_km` 联用时可限制只返回**方圆 X 公里内**店铺。
    - **`radius_km`**（可选）：半径（公里）；未传时由服务端默认（产品约定 **X=5km**，见纪要 07）。
  - **返回**：`data.list` + 分页信息；列表项可含 **`distance_km`**、`rating` 等。
  - **图片字段（列表左侧封面）**：库表持久化 **`cover_url`**、**`logo_url`**；接口在 `cover_url` 非空时同时下发 **`cover_image`**、**`list_cover_url`**（与 `cover_url` 同值），并下发 **`cover`/`logo`** 别名（与 `cover_url`/`logo_url` 同值），便于与前端多字段兜底逻辑对齐。均为**相对路径**时形如 `/uploads/market/{店铺分类}/{shop_no}/shop_media/...` 或 `.../goods/{category_key}/{goods_no}.jpg`，由静态服务 **`GET /uploads/*`** 映射到 `backend/data/uploads/images/`；历史扁平路径可用脚本 `node scripts/restructure_market_images.js` 迁移（见 `data/uploads/images/market/README.md`）。
  - **说明**：未传 `user_lat`/`user_lng` 时，兼容旧行为（不按距离筛选）；店铺需在库中维护 `latitude`/`longitude` 与 `address` 等（见纪要 07）。
- **店铺详情**：`GET /api/v1/market/shops/:shopId`
  - 返回地址、营业时间、联系电话、**封面/门面/内景/证照**图片 URL 等；**不返回联系人**（`contact_name` 已废弃，见纪要 07）。字段名：**`cover_url`**（或别名 **`cover`**）、**`logo_url`**（或 **`logo`**）、**`facade_image`**、**`interior_image`**、**`license_image`**。
  - **联调**：设置环境变量 **`LOG_MARKET_IMAGE_DEBUG=1`** 后访问详情可在服务端日志打印上述字段及按 **`PUBLIC_API_BASE`**（或 **`API_PUBLIC_URL`**）拼接的预览绝对 URL；或用脚本 `node scripts/print_market_shop_image_urls.js "店铺名"` 导出完整 URL 并检查本地文件是否存在。
- **店铺评价列表（建议）**：`GET /api/v1/market/shops/:shopId/reviews?page=&page_size=`（无评价时 `list` 为空；见纪要 07）。
- **店内分类**：`GET /api/v1/market/shops/:shopId/categories`
- **店内商品**：`GET /api/v1/market/shops/:shopId/goods`
  - **查询参数**：`category_key`（可选）、`page`、`page_size`
  - **图片**：库字段 **`main_image`**；接口同时下发别名 **`image`**（与 `main_image` 同值）。
- **商品详情**：`GET /api/v1/market/goods/:goodsId`

#### 12.2 购物车（登录态）

> 需登录：`Authorization: Bearer <token>`

- `GET /api/v1/market/cart?shop_id=xxx`
- `POST /api/v1/market/cart/items`（加购/累加）
- `PUT /api/v1/market/cart/items/:itemId`（改数量，`quantity=0` 视为删除）
- `DELETE /api/v1/market/cart/items/:itemId`
- `DELETE /api/v1/market/cart?shop_id=xxx`（清空店铺购物车）

#### 12.3 订单（登录态）

- **预结算**：`POST /api/v1/market/orders/preview`
- **创建订单（事务扣库存 + 写快照）**：`POST /api/v1/market/orders`
- **我的订单**：`GET /api/v1/market/orders/my?status=&page=&page_size=`
- **订单详情**：`GET /api/v1/market/orders/:orderNo`
- **取消订单（仅待支付）**：`POST /api/v1/market/orders/:orderNo/cancel`

#### 12.4 支付（登录态 + 回调）

> **注意**：`GET /api/v1/market/orders/:orderNo` **不返回** JSAPI 五参数（仅订单展示）；调起支付字段**仅**来自 `POST /api/v1/market/payments/create`（与《本地集市店铺化_FE-BE沟通纪要_06_BE》第 3、4 节一致）。

- **创建支付**：`POST /api/v1/market/payments/create`
  - **Body**：`{ "order_no": "<订单号>" }`
  - **成功**（`code === 0`）：外层 `{ code:0, msg:"ok", data:{...} }`；`data` 含 `virtual_pay: false`、`pay_mode: wechat`、`order_no`、`out_trade_no`、`amount`。
  - **五参数**（与微信 `wx.requestPayment` 一致）：`data` 根级提供驼峰五字段；**推荐解析路径**为 `data.wx_pay_params`（内含驼峰 + 蛇形别名：`time_stamp`、`nonce_str`、`sign_type`、`pay_sign`）；另提供 `data.payment.wx_pay_params`（嵌套示例 C）、`data.jsapi`（与 `wx_pay_params` 等价），便于前端递归解析。
  - **环境变量（不落库）**：`WX_PAY_APPID`（或 `WECHAT_APPID`）、`WX_PAY_MCHID`、`WX_PAY_SERIAL_NO`、`WX_PAY_API_V3_KEY`（32 位）、`WX_PAY_PRIVATE_KEY_PATH`（商户 API 私钥 PEM 路径）或 `WX_PAY_PRIVATE_KEY`（PEM 内容，`\n` 可写成 `\\n`）、`WX_PAY_NOTIFY_URL`（须与商户平台配置的**支付回调 URL**一致，HTTPS 可公网访问）。
  - **常见错误码**：`20043` 用户无 openid；`20044` 未配置微信参数且已设置 `MARKET_PAY_VIRTUAL_SUCCESS=false`（严格模式）；`20045` 统一下单失败；`20046` 订单金额为 0。
  - **临时虚拟支付（无商户配置时）**：若未配置完整 `WX_PAY_*` 且**未**设置 `MARKET_PAY_VIRTUAL_SUCCESS=false`，`payments/create` 返回 `code:0`，`virtual_pay: true`、`pay_mode: virtual`，并返回占位 JSAPI 五参数；**同时将订单与支付流水直接记为已支付**（不可用于真实收款）。配置真支付后请补齐 `WX_PAY_*` 并建议设 `MARKET_PAY_VIRTUAL_SUCCESS=false`。
- **支付状态查询**：`GET /api/v1/market/payments/status?order_no=xxx`
- **支付回调（不走 JWT；验签+幂等+落库）**：`POST /api/v1/market/pay/callback`
  - **微信支付 V3**：校验 `Wechatpay-*` 头 + 拉取平台证书验签，解密 `resource`，幂等更新 `market_pay_transactions` / `market_orders`；**成功应答体**为：`{"code":"SUCCESS","message":"成功"}`（HTTP 200）。
  - **联调兼容**：若请求**无** `Wechatpay-Signature` 头，仍可使用环境变量 `PAY_CALLBACK_SECRET` 做 HMAC-SHA256 验签（与一期自定义 body 字段一致）。
- **模拟支付成功（仅非生产）**：`POST /api/v1/market/payments/mock-success`

### 11. 维护约定

- 如需 **新增 / 修改 / 下线接口**，请在修改对应 `routes/*.js` 或 `controllers` 后，
  同步更新本文件中对应章节，以保证前后端文档一致。
