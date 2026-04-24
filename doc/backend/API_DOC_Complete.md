# 社区小程序 API 接口文档 (v1) - 完整版

> **文档版本**: v1.0  
> **最后更新**: 2026-04-24  
> **基于**: 前端 API 定义文件 + 后端接口测试

**基础信息**

- **服务地址**: `http://192.168.110.50:3001`
- **统一前缀**: `/api/v1`
- **数据格式**: `Content-Type: application/json`（上传文件接口除外）
- **鉴权方式**: 登录成功后返回 `token`（JWT），前端在需要登录的接口上通过：
  - HTTP 头：`Authorization: Bearer <token>`

---

## 一、认证模块 (`/auth`)

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| POST | `/auth/wechat/login` | 微信小程序登录 | 无 |
| POST | `/auth/login_password` | 账号密码登录 | 无 |
| POST | `/auth/register` | 用户注册 | 无 |
| POST | `/auth/sms-code` | 发送短信验证码 | 无 |
| POST | `/auth/admin/login` | 管理员登录 | 无 |

---

## 二、用户模块 (`/user`)

> 以下接口均需登录鉴权

### 2.1 用户资料

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/user/profile` | 获取用户信息 |
| PATCH | `/user/profile` | 更新用户信息 |

### 2.2 地址管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/user/addresses` | 获取用户地址列表 |
| POST | `/user/addresses` | 添加用户地址 |
| POST | `/user/addresses/:id` | 更新用户地址 |
| DELETE | `/user/addresses/:id` | 删除用户地址 |

---

## 三、核心数据模块 (`/core`)

> 公共接口，无需鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/core/banners` | 获取轮播图 |
| GET | `/core/categories` | 获取服务分类 |
| GET | `/core/hot-services` | 获取热门服务 |
| GET | `/core/services` | 获取服务列表 |
| GET | `/core/services/:id` | 获取服务详情 |
| GET | `/core/workers` | 获取技工列表 |
| GET | `/core/workers/:id` | 获取技工详情 |
| GET | `/core/service-providers` | 获取服务商列表 |

---

## 四、服务订单模块 (`/service-orders`)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/service-orders` | 创建服务订单 |
| GET | `/service-orders/:id` | 获取订单详情 |
| GET | `/service-orders/my` | 获取我的订单列表 |
| POST | `/service-orders/:id/mock-pay` | 模拟支付 |
| POST | `/service-orders/:id/confirm` | 确认完成 |

---

## 五、邻里帮帮模块 (`/neighbor-assist`)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/neighbor-assist/orders` | 创建帮帮订单 |
| GET | `/neighbor-assist/orders/my` | 获取我的帮帮订单 |
| GET | `/neighbor-assist/orders/pool` | 获取待接单池 |
| POST | `/neighbor-assist/orders/:id/grab` | 抢单 |
| POST | `/neighbor-assist/orders/:id/complete` | 完成订单 |

---

## 六、本地集市模块 (`/market`)

### 6.1 商家入驻

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/market/apply` | 商家入驻申请 |

### 6.2 店铺和商品

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/search` | 搜索商品/店铺 |
| GET | `/market/shops` | 获取店铺列表 |
| GET | `/market/shops/:shopId` | 获取店铺详情 |
| GET | `/market/shops/:shopId/goods` | 获取店铺商品 |
| GET | `/market/goods/:goodsId` | 获取商品详情 |
| GET | `/market/shops/:shopId/contact` | 获取店铺联系方式 |

### 6.3 购物车

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/cart` | 获取购物车 |
| POST | `/market/cart/items` | 添加购物车 |
| PUT | `/market/cart/items/:itemId` | 更新购物车 |
| DELETE | `/market/cart/items/:itemId` | 删除购物车商品 |
| DELETE | `/market/cart` | 清空购物车 |

### 6.4 订单管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/market/orders/preview` | 订单预览 |
| POST | `/market/orders` | 创建订单 |
| GET | `/market/orders` | 获取我的订单 |
| GET | `/market/orders/:orderNo` | 获取订单详情 |
| POST | `/market/orders/:orderNo/cancel` | 取消订单 |
| DELETE | `/market/orders/:orderNo` | 删除订单 |
| POST | `/market/orders/:orderNo/buy-again` | 再次购买 |
| GET | `/market/orders/:orderNo/logistics` | 获取物流信息 |

### 6.5 支付

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/market/payments/create` | 创建支付 |
| GET | `/market/payments/status` | 查询支付状态 |
| POST | `/market/payments/mock-success` | 模拟支付成功 |

### 6.6 收货与退款

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/market/orders/:orderNo/confirm-receipt` | 确认收货 |
| POST | `/market/orders/:orderNo/refund` | 申请退款 |
| GET | `/market/orders/:orderNo/refund` | 获取退款详情 |
| POST | `/market/orders/:orderNo/refund/cancel` | 取消退款申请 |

---

## 七、商家后台模块 (`/market/merchant`)

> 需商家后台登录鉴权

### 7.1 仪表盘和店铺

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/merchant/dashboard` | 获取仪表盘数据 |
| GET | `/market/merchant/shop` | 获取店铺信息 |
| PATCH | `/market/merchant/shop` | 更新店铺信息 |

### 7.2 商品管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/merchant/goods` | 获取商品列表 |
| POST | `/market/merchant/goods` | 创建商品 |
| GET | `/market/merchant/goods/:id` | 获取商品详情 |
| PATCH | `/market/merchant/goods/:id` | 更新商品 |
| POST | `/market/merchant/goods/:id/restock` | 补货 |
| POST | `/market/merchant/goods/:id/shelf` | 上下架 |

### 7.3 订单管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/merchant/orders` | 获取订单列表 |
| GET | `/market/merchant/orders/:orderNo` | 获取订单详情 |
| POST | `/market/merchant/orders/:orderNo/action` | 订单操作(接单/发货等) |
| GET | `/market/merchant/payments` | 获取支付记录 |

### 7.4 客户管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/merchant/customers/list` | 获取客户列表 |
| GET | `/market/merchant/customers/:id/orders` | 获取客户订单 |
| GET | `/market/merchant/customers/:id/stats` | 获取客户统计 |

### 7.5 营销管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/merchant/marketing/coupons` | 获取优惠券列表 |
| POST | `/market/merchant/marketing/coupons` | 创建优惠券 |
| POST | `/market/merchant/marketing/coupons/:id` | 更新/删除优惠券 |
| GET | `/market/merchant/marketing/stats` | 获取营销统计 |

### 7.6 退款管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/market/merchant/refunds/list` | 获取退款列表 |
| GET | `/market/merchant/refunds/:id` | 获取退款详情 |
| POST | `/market/merchant/refunds/:id/approve` | 同意退款 |
| POST | `/market/merchant/refunds/:id/reject` | 拒绝退款 |
| GET | `/market/merchant/refunds/stats/summary` | 获取退款统计 |

---

## 八、服务商后台模块 (`/service-provider-portal`)

> 需服务商后台登录鉴权

### 8.1 个人信息

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/service-provider-portal/me` | 获取个人信息 |
| PATCH | `/service-provider-portal/profile` | 更新个人信息 |

### 8.2 仪表盘

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/service-provider-portal/dashboard` | 获取仪表盘数据 |

### 8.3 服务管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/service-provider-portal/categories` | 获取服务分类 |
| GET | `/service-provider-portal/services` | 获取服务列表 |
| POST | `/service-provider-portal/services` | 创建服务 |
| GET | `/service-provider-portal/services/:id` | 获取服务详情 |
| PATCH | `/service-provider-portal/services/:id` | 更新服务 |

### 8.4 订单管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/service-provider-portal/orders` | 获取订单列表 |
| GET | `/service-provider-portal/orders/:id` | 获取订单详情 |
| POST | `/service-provider-portal/orders/:id/accept` | 接单 |
| POST | `/service-provider-portal/orders/:id/check-in` | 打卡 |
| POST | `/service-provider-portal/orders/:id/evidence` | 上传凭证 |
| POST | `/service-provider-portal/orders/:id/complete` | 完成订单 |

### 8.5 技工管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/service-provider-portal/workers/list` | 获取技工列表 |
| GET | `/service-provider-portal/workers/:id` | 获取技工详情 |
| POST | `/service-provider-portal/workers/:id/status` | 更新技工状态 |
| GET | `/service-provider-portal/workers/:id/stats` | 获取技工统计 |

### 8.6 财务管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/service-provider-portal/finance/income/summary` | 收入汇总 |
| GET | `/service-provider-portal/finance/income/list` | 收入明细列表 |
| GET | `/service-provider-portal/finance/income/daily` | 每日收入统计 |
| GET | `/service-provider-portal/finance/balance` | 获取账户余额 |

---

## 九、技工端模块 (`/worker`)

> 需技工端登录鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/worker/orders` | 获取订单列表 |
| GET | `/worker/orders/:id` | 获取订单详情 |
| POST | `/worker/orders/:id/accept` | 接单 |
| POST | `/worker/orders/:id/reject` | 拒单 |
| POST | `/worker/orders/:id/check-in` | 打卡 |
| POST | `/worker/orders/:id/evidence` | 上传凭证 |
| POST | `/worker/orders/:id/complete` | 完成订单 |

---

## 十、消息模块 (`/messages`)

> 需登录鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/messages/conversations` | 获取会话列表 |
| GET | `/messages/conversations/:id` | 获取会话消息 |
| POST | `/messages/conversations/:id` | 发送消息 |
| POST | `/messages/conversations` | 创建会话 |

---

## 十一、聊天模块 (`/chat`)

> 需登录鉴权

### 11.1 群聊管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/chat/groups` | 获取群列表 |
| POST | `/chat/groups` | 创建群聊 |
| GET | `/chat/groups/:groupId` | 获取群详情 |
| GET | `/chat/groups/:groupId/members` | 获取群成员列表 |
| POST | `/chat/groups/:groupId/members` | 添加群成员 |
| POST | `/chat/groups/:groupId/members/:userId/remove` | 移除群成员 |
| POST | `/chat/groups/:groupId/quit` | 退出群聊 |
| POST | `/chat/groups/:groupId/dismiss` | 解散群聊 |
| GET | `/chat/groups/:groupId/messages` | 获取群消息历史 |
| POST | `/chat/groups/:groupId/messages` | 发送群消息 |

### 11.2 关注管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/chat/follow/:userId` | 关注用户 |
| POST | `/chat/unfollow/:userId` | 取关用户 |

---

## 十二、优惠券模块 (`/coupons`)

> 需登录鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/coupons/list` | 获取可领取优惠券列表 |
| POST | `/coupons/receive` | 领取优惠券 |
| GET | `/coupons/my` | 获取我的优惠券列表 |
| GET | `/coupons/:couponId` | 获取优惠券详情 |
| GET | `/coupons/available-for-order` | 获取订单可用优惠券 |

---

## 十三、家事币商城 (`/benefit-coin`)

> 需登录鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/benefit-coin/balance` | 获取家事币余额 |
| GET | `/benefit-coin/goods` | 获取可兑换商品列表 |
| GET | `/benefit-coin/goods/:goodsId` | 获取兑换商品详情 |
| POST | `/benefit-coin/exchange` | 兑换商品 |
| GET | `/benefit-coin/records` | 获取兑换记录 |

---

## 十四、推客模块 (`/promoter`)

> 需登录鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/promoter/commission` | 获取推客佣金信息 |
| GET | `/promoter/orders` | 获取推客订单列表 |
| GET | `/promoter/income-records` | 获取推客收益明细 |
| POST | `/promoter/withdraw` | 提现申请 |
| GET | `/promoter/share-link` | 获取推广链接 |

---

## 十五、第三方小程序模块 (`/mini-programs`)

> 需管理员权限

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/mini-programs` | 获取第三方小程序列表 |
| GET | `/mini-programs/:id` | 获取第三方小程序详情 |
| POST | `/mini-programs` | 创建第三方小程序配置 |
| PUT | `/mini-programs/:id` | 更新第三方小程序配置 |
| DELETE | `/mini-programs/:id` | 删除第三方小程序配置 |

---

## 十六、惠民卡联盟模块

> 公共接口，无需鉴权

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/benefit/display` | 联盟顶栏展示 |
| GET | `/jd/benefit/goods` | 京东联盟商品列表 |
| GET | `/jd/promotion/spread-url` | 京东推广链查询 |
| GET | `/pdd/benefit/goods` | 拼多多进宝商品列表 |
| GET | `/pdd/promotion/spread-url` | 拼多多推广信息 |

---

## 十七、社区帖子模块 (`/posts`)

> 部分接口需登录鉴权

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| GET | `/posts` | 获取帖子列表 | 无 |
| GET | `/posts/my/published` | 获取我发布的帖子 | 需要 |
| GET | `/posts/my/liked` | 获取我点赞过的帖子 | 需要 |
| GET | `/posts/my/participated` | 获取我参与过的帖子 | 需要 |
| POST | `/posts` | 发布帖子 | 需要 |
| POST | `/posts/:postId/like` | 点赞/取消点赞 | 需要 |
| POST | `/posts/:postId/comment` | 发表评论 | 需要 |

---

## 十八、公共接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/` | 健康检查 |
| POST | `/upload` | 文件上传（multipart/form-data） |

---

## 接口统计

| 模块 | 接口数量 |
|------|----------|
| 认证模块 | 5 |
| 用户模块 | 6 |
| 核心数据模块 | 8 |
| 服务订单模块 | 5 |
| 邻里帮帮模块 | 5 |
| 本地集市模块 | 24 |
| 商家后台模块 | 23 |
| 服务商后台模块 | 21 |
| 技工端模块 | 7 |
| 消息模块 | 4 |
| 聊天模块 | 12 |
| 优惠券模块 | 5 |
| 家事币商城 | 5 |
| 推客模块 | 5 |
| 第三方小程序模块 | 5 |
| 惠民卡联盟模块 | 5 |
| 社区帖子模块 | 7 |
| 公共接口 | 2 |
| **总计** | **149** |

---

## 与旧版文档的差异

### 已废弃的接口（前端不再调用）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/auth/wx/getkey/:code` | 兼容旧接口，前端已使用 `/auth/wechat/login` |
| POST | `/user/api/user_info/update` | 兼容旧接口，前端已使用 `PATCH /user/profile` |
| GET | `/acount/info` | 兼容旧接口 |
| GET | `/wx/user/coupon/:id` | 兼容旧接口 |
| GET | `/messages/history/:conversationId` | 前端已使用 `/messages/conversations/:id` |
| DELETE | `/messages/conversations/:conversationId` | 前端未使用 |
| POST | `/messages/send` | 前端已使用 `/messages/conversations/:id` |
| POST | `/messages/broadcast` | 前端未使用 |
| POST | `/orders/` | 旧版订单接口，前端已使用 `/service-orders` |
| GET | `/orders/my` | 旧版订单接口 |
| POST | `/orders/:id/pay` | 旧版订单接口 |

### 新增接口（前端已调用但旧文档未记录）

1. **本地集市完整模块** - 24个接口
2. **商家后台完整模块** - 23个接口
3. **服务商后台完整模块** - 21个接口
4. **技工端完整模块** - 7个接口
5. **聊天模块** - 12个接口
6. **优惠券模块** - 5个接口
7. **家事币商城** - 5个接口
8. **推客模块** - 5个接口
9. **第三方小程序模块** - 5个接口

---

## 维护说明

- 本文档基于前端 `api/` 目录下的 API 定义文件自动生成
- 所有接口路径均为 `/api/v1` 后的相对路径
- 接口状态标记：✅ 已测试可用
- 更新时间：2026-04-24
