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

- **服务地址**：`https://ancientscrolllibrary.cn`
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

### 7.1 惠民卡 · 联盟（`/api/v1/benefit`、`/jd`、`/pdd`）

> [开发阶段] 以下内容仅供参考，当前开发阶段请以 doc/项目开发参考.md 为准。详细表结构、种子与素材同步见 ~~`doc/惠民卡_联盟数据与同步.md`~~。

- **联盟顶栏展示（头图 + 可选标题）**
  - **URL**：`GET /api/v1/benefit/display`
  - **Query**：`scene`（默认 `benefit_card`）
  - **鉴权**：无
  - **返回 `data`**：
    - `jd`：`{ heroImage, heroTitle, heroSubtitle }`（后两项可为空字符串）
    - `pdd`：同上

- **京东联盟商品列表**
  - **URL**：`GET /api/v1/jd/benefit/goods`
  - **Query**：`scene`（默认 `benefit_card`）
  - **返回 `data`**：`{ list: [{ id, skuId, title, image, price, rebateAmount, spreadUrl }] }`
  - **说明**：`skuId` 对应京挑客短链 path（`u.jd.com` 路径段）。

- **京东推广链查询（跳转前可选用）**
  - **URL**：`GET /api/v1/jd/promotion/spread-url`
  - **Query**：`sku_id`、`scene`

- **拼多多进宝商品列表**
  - **URL**：`GET /api/v1/pdd/benefit/goods`
  - **Query**：`scene`
  - **返回 `data`**：`{ list: [{ id, goodsId, title, image, price, couponPrice, rebateAmount, spreadUrl, miniPath }] }`

- **拼多多推广信息**
  - **URL**：`GET /api/v1/pdd/promotion/spread-url`
  - **Query**：`goods_id`、`scene`

---

### 8. 维护约定

- 如需 **新增 / 修改 / 下线接口**，请在修改对应 `routes/*.js` 或 `controllers` 后，
  同步更新本文件中对应章节，以保证前后端文档一致。
