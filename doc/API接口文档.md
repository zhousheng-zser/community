# 社区小程序后端 API 文档

**Base URL:** `http://localhost:3000/api/v1`

**通用说明：**
*   除了 `/core` 开头的只读接口外，大部分需要登录的接口都需要在 HTTP 请求头中带上 Token。
*   **Header 格式**: `Authorization: Bearer <您的Token>`
*   所有的 POST 请求体如无特殊说明均使用 `application/json` 格式，上传图片的除外 (`multipart/form-data`)。

---

## 1. 认证与登录 (Auth)

### 1.1 微信快捷登录
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Auth Required**: No
*   **RequestBody**:
    ```json
    {
      "code": "微信wx.login获取的临时凭证", // 必填
      "nickname": "张三", // 可选（授权获取的用户昵称）
      "avatar_url": "https://...", // 可选（授权获取的用户头像）
      "phone": "13800000000" // 可选
    }
    ```
*   **Response**: 成功后会返回 JWT `token` 和用户信息对象，前端需自行保存此 `token` 到 `wx.setStorageSync`。

---

## 2. 核心数据服务 (Core Data) 
*无需 Token，可直接供游客访问*

### 2.1 获取首页轮播图
*   **URL**: `/core/banners`
*   **Method**: `GET`

### 2.2 获取热门服务 (首页推荐)
*   **URL**: `/core/services/hot`
*   **Method**: `GET`

### 2.3 获取全部分类
*   **URL**: `/core/categories`
*   **Method**: `GET`

### 2.4 查看某个分类下的服务/商品列表
*   **URL**: `/core/categories/:categoryId/services`
*   **Method**: `GET`
*   **Query**: `?page=1&limit=10` (可选)

### 2.5 获取服务/商品详情
*   **URL**: `/core/services/:id`
*   **Method**: `GET`

---

## 3. 社区动态 (Community / Posts)

### 3.1 获取朋友圈/社区信息流
*   **URL**: `/posts`
*   **Method**: `GET`
*   **Auth Required**: No (可公开访问)
*   **Query**: `?page=1&limit=10` (可选)
*   **Response**: 返回包含楼主、多图、点赞列表、嵌套评论的完整聚合数据。

### 3.2 发表新动态 (发朋友圈)
*   **URL**: `/posts`
*   **Method**: `POST`
*   **Auth Required**: Yes
*   **ContentType**: `multipart/form-data`
*   **Body**:
    *   `content` (text): 动态文字说明字段
    *   `location` (text): 可选的位置字段
    *   `images` (file[]): 选择的文件对象（小程序中需使用 `wx.uploadFile` 循环上传或支持多选的上传库，字段名必须是 `images`）

### 3.3 点赞 / 取消点赞 (Toggle)
*   **URL**: `/posts/:postId/like`
*   **Method**: `POST`
*   **Auth Required**: Yes

### 3.4 发表评论
*   **URL**: `/posts/:postId/comment`
*   **Method**: `POST`
*   **Auth Required**: Yes
*   **RequestBody**:
    ```json
    {
      "content": "好文帮扩！",
      "reply_to_user_id": null // 若为空代表直接评论帖子；若带具体的 userId，代表是在他人的评论下回复他。
    }
    ```

---

## 4. 交易与订单 (Orders)

### 4.1 直接下单购买
*   **URL**: `/orders`
*   **Method**: `POST`
*   **Auth Required**: Yes
*   **RequestBody**:
    ```json
    {
      "service_id": 1 // 你要购买的有效服务/商品的库内 ID
    }
    ```

### 4.2 查看我（当前登录者）的订单
*   **URL**: `/orders/my`
*   **Method**: `GET`
*   **Auth Required**: Yes
*   **Query**: `?page=1&limit=10`

### 4.3 (测试用) 单击模拟支付已下单的订单
*   **URL**: `/orders/:id/pay`
*   **Method**: `POST`
*   **Auth Required**: Yes
