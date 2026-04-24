# 社区小程序后端API接口文档

> **版本**: v1.0  
> **基础URL**: `http://your-domain:3001/api/v1`  
> **更新日期**: 2026-04-22

---

## 通用说明

### 响应格式

所有接口统一返回JSON格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {}
}
```

### 认证方式

需要认证的接口需在请求头中携带Token：

```
Authorization: Bearer <token>
```

### 分页参数

列表接口统一使用以下分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 20 | 每页数量 |

---

## 一、认证模块

### 1.1 用户登录（微信小程序）

**POST** `/auth/wechat/login`

**请求参数**：
```json
{
  "code": "微信登录code",
  "nickname": "用户昵称",
  "avatar_url": "头像URL"
}
```

### 1.2 用户登录（账号密码）

**POST** `/auth/login`

**请求参数**：
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

### 1.3 用户注册

**POST** `/auth/register`

### 1.4 发送短信验证码

**POST** `/auth/sms-code`

### 1.5 管理员登录

**POST** `/auth/admin/login`

### 1.6 服务商后台登录

**POST** `/service-provider-portal/login`

### 1.7 商家后台登录

**POST** `/merchant-portal/login`

### 1.8 技工端登录

**POST** `/worker-portal/login`

---

## 二、用户模块

### 2.1 获取用户信息

**GET** `/user/profile`

### 2.2 更新用户信息

**PATCH** `/user/profile`

### 2.3 获取用户地址列表

**GET** `/user/addresses`

### 2.4 添加用户地址

**POST** `/user/addresses`

---

## 三、核心数据模块

### 3.1 获取轮播图

**GET** `/core/banners`

### 3.2 获取服务分类

**GET** `/core/categories`

### 3.3 获取热门服务

**GET** `/core/hot-services`

### 3.4 获取服务列表

**GET** `/core/services`

### 3.5 获取服务详情

**GET** `/core/services/:id`

### 3.6 获取技工列表

**GET** `/core/workers`

### 3.7 获取技工详情

**GET** `/core/workers/:id`

### 3.8 获取服务商列表

**GET** `/core/service-providers`

---

## 四、服务订单模块

### 4.1 创建服务订单

**POST** `/service-orders`

**请求参数**：
```json
{
  "service_id": 1,
  "worker_id": 1,
  "community_id": 1,
  "address_snapshot": {},
  "appointment_time": "2026-04-23 10:00:00",
  "remark": "请准时上门",
  "qty": 1
}
```

### 4.2 获取订单详情

**GET** `/service-orders/:id`

### 4.3 获取我的订单列表

**GET** `/service-orders/my`

### 4.4 模拟支付

**POST** `/service-orders/:id/mock-pay`

### 4.5 确认完成

**POST** `/service-orders/:id/confirm`

---

## 五、邻里帮帮模块

### 5.1 创建帮帮订单

**POST** `/neighbor-assist`

**请求参数**：
```json
{
  "assist_type": "take",
  "title": "帮忙取快递",
  "description": "帮忙去菜鸟驿站取快递",
  "address_snapshot": {},
  "reward_amount": 5.00,
  "community_id": 1
}
```

**assist_type 可选值**：`take`(代取)、`child`(看护)、`escort`(陪护)、`trash`(代扔垃圾)、`pet`(宠物照看)

### 5.2 获取我的帮帮订单

**GET** `/neighbor-assist/my`

### 5.3 获取待接单池

**GET** `/neighbor-assist/pool`

### 5.4 抢单

**POST** `/neighbor-assist/:id/grab`

### 5.5 完成订单

**POST** `/neighbor-assist/:id/complete`

---

## 六、本地集市模块

### 6.1 商家入驻申请

**POST** `/market/apply`

### 6.2 搜索商品/店铺

**GET** `/market/search`

### 6.3 获取店铺列表

**GET** `/market/shops`

### 6.4 获取店铺详情

**GET** `/market/shops/:shopId`

### 6.5 获取店铺商品

**GET** `/market/shops/:shopId/goods`

### 6.6 获取商品详情

**GET** `/market/goods/:goodsId`

### 6.7 购物车操作

- **GET** `/market/cart` - 获取购物车
- **POST** `/market/cart/items` - 添加购物车
- **PUT** `/market/cart/items/:itemId` - 更新购物车
- **DELETE** `/market/cart/items/:itemId` - 删除购物车商品
- **DELETE** `/market/cart` - 清空购物车

### 6.8 订单操作

- **POST** `/market/orders/preview` - 订单预览
- **POST** `/market/orders` - 创建订单
- **GET** `/market/orders` - 获取我的订单
- **GET** `/market/orders/:orderNo` - 获取订单详情
- **POST** `/market/orders/:orderNo/cancel` - 取消订单

### 6.9 支付操作

- **POST** `/market/payments/create` - 创建支付
- **GET** `/market/payments/status` - 查询支付状态
- **POST** `/market/payments/mock-success` - 模拟支付成功

---

## 七、九州中台管理模块

> 所有接口需要管理员认证

### 7.1 统计概览

**GET** `/admin/stats/overview`

### 7.2 系统健康状态

**GET** `/admin/system/health`

### 7.3 用户管理

- **GET** `/admin/users` - 获取用户列表
- **GET** `/admin/users/:id` - 获取用户详情

### 7.4 技工申请管理

- **GET** `/admin/worker-applications` - 获取技工申请列表
- **PUT** `/admin/worker-applications/:id` - 审核技工申请

### 7.5 服务商申请管理

- **GET** `/admin/service-provider-applications` - 获取服务商申请列表
- **PUT** `/admin/service-provider-applications/:id` - 审核服务商申请
- **POST** `/admin/service-provider-portal-accounts` - 创建服务商后台账户

### 7.6 家政订单管理

- **GET** `/admin/housekeeping/orders` - 获取订单列表
- **GET** `/admin/housekeeping/workers` - 获取技工列表
- **POST** `/admin/housekeeping/orders/:id/dispatch` - 派单

### 7.7 派单管理

- **GET** `/admin/dispatch-queue` - 获取派单队列
- **GET** `/admin/service-orders` - 获取服务订单列表
- **POST** `/admin/service-orders/:id/assign` - 分配服务订单
- **GET** `/admin/neighbor-assist/orders` - 获取邻里帮帮订单列表
- **POST** `/admin/neighbor-assist/orders/:id/assign` - 分配邻里帮帮订单

### 7.8 本地集市管理

- **GET** `/admin/market-shops` - 获取店铺列表
- **POST** `/admin/market-shops` - 创建店铺
- **PUT** `/admin/market-shops/:id` - 更新店铺
- **GET** `/admin/market-goods` - 获取商品列表
- **POST** `/admin/market-goods` - 创建商品
- **PUT** `/admin/market-goods/:id` - 更新商品
- **GET** `/admin/market-applications` - 获取集市入驻申请列表
- **PUT** `/admin/market-applications/:id` - 审核集市入驻申请

### 7.9 退款管理

- **GET** `/admin/refunds` - 获取退款列表
- **GET** `/admin/refunds/:id` - 获取退款详情
- **POST** `/admin/refunds/apply` - 申请退款
- **POST** `/admin/refunds/:id/review` - 审核退款
- **POST** `/admin/refunds/:id/execute` - 执行退款

### 7.10 结算对账

- **GET** `/admin/reconcile/summary` - 获取对账汇总
- **GET** `/admin/settlements` - 获取结算账单列表
- **POST** `/admin/settlements/generate` - 生成结算账单

### 7.11 商家账户管理

- **GET** `/admin/merchant-accounts` - 获取商家账户列表
- **POST** `/admin/merchant-accounts` - 创建商家账户
- **PUT** `/admin/merchant-accounts/:id` - 更新商家账户
- **POST** `/admin/merchant-accounts/:id/reset-password` - 重置密码

### 7.12 投诉工单管理

- **GET** `/admin/complaint-tickets` - 获取投诉列表
- **POST** `/admin/complaint-tickets` - 创建投诉工单
- **PUT** `/admin/complaint-tickets/:id` - 处理投诉

### 7.13 优惠券管理

- **GET** `/admin/coupon-templates` - 获取优惠券模板列表
- **POST** `/admin/coupon-templates` - 创建优惠券模板
- **POST** `/admin/coupon-issues/issue` - 发放优惠券
- **GET** `/admin/coupon-issues` - 获取发放记录

### 7.14 活动管理

- **GET** `/admin/activities` - 获取活动列表
- **POST** `/admin/activities` - 创建活动

### 7.15 数据报表

**GET** `/admin/reports`

### 7.16 权益商品管理

- **GET** `/admin/jd-benefit-goods` - 获取京东权益商品列表
- **POST** `/admin/jd-benefit-goods` - 创建京东权益商品
- **GET** `/admin/pdd-benefit-goods` - 获取拼多多权益商品列表
- **GET** `/admin/community-featured-goods` - 获取社区精选商品列表

### 7.17 社区管理（新增）

- **GET** `/admin/communities/list` - 获取社区列表
- **GET** `/admin/communities/:id` - 获取社区详情
- **POST** `/admin/communities` - 创建社区
- **PUT** `/admin/communities/:id` - 更新社区
- **DELETE** `/admin/communities/:id` - 删除社区
- **GET** `/admin/communities/:id/stats` - 获取社区统计

### 7.18 公告管理（新增）

- **GET** `/admin/announcements/list` - 获取公告列表
- **GET** `/admin/announcements/:id` - 获取公告详情
- **POST** `/admin/announcements` - 创建公告
- **PUT** `/admin/announcements/:id` - 更新公告
- **DELETE** `/admin/announcements/:id` - 删除公告
- **POST** `/admin/announcements/:id/publish` - 发布公告

---

## 八、服务商后台模块

> 所有接口需要服务商认证

### 8.1 个人信息

- **GET** `/service-provider-portal/me` - 获取个人信息
- **PATCH** `/service-provider-portal/profile` - 更新个人信息

### 8.2 仪表盘

**GET** `/service-provider-portal/dashboard`

### 8.3 服务管理

- **GET** `/service-provider-portal/categories` - 获取服务分类
- **GET** `/service-provider-portal/services` - 获取服务列表
- **POST** `/service-provider-portal/services` - 创建服务
- **GET** `/service-provider-portal/services/:id` - 获取服务详情
- **PATCH** `/service-provider-portal/services/:id` - 更新服务

### 8.4 订单管理

- **GET** `/service-provider-portal/orders` - 获取订单列表
- **GET** `/service-provider-portal/orders/:id` - 获取订单详情
- **POST** `/service-provider-portal/orders/:id/accept` - 接单
- **POST** `/service-provider-portal/orders/:id/check-in` - 打卡
- **POST** `/service-provider-portal/orders/:id/evidence` - 上传凭证
- **POST** `/service-provider-portal/orders/:id/complete` - 完成订单

### 8.5 员工管理（新增）

- **GET** `/service-provider-portal/workers/list` - 获取技工列表
- **GET** `/service-provider-portal/workers/:id` - 获取技工详情
- **PUT** `/service-provider-portal/workers/:id/status` - 更新技工状态
- **GET** `/service-provider-portal/workers/:id/stats` - 获取技工统计

### 8.6 财务中心（新增）

- **GET** `/service-provider-portal/finance/income/summary` - 收入汇总
- **GET** `/service-provider-portal/finance/income/list` - 收入明细列表
- **GET** `/service-provider-portal/finance/income/daily` - 每日收入统计
- **GET** `/service-provider-portal/finance/balance` - 获取账户余额

---

## 九、商家后台模块

> 所有接口需要商家认证

### 9.1 仪表盘

**GET** `/market/merchant/dashboard`

### 9.2 店铺管理

- **GET** `/market/merchant/shop` - 获取店铺信息
- **PATCH** `/market/merchant/shop` - 更新店铺信息

### 9.3 商品管理

- **GET** `/market/merchant/goods` - 获取商品列表
- **POST** `/market/merchant/goods` - 创建商品
- **GET** `/market/merchant/goods/:id` - 获取商品详情
- **PATCH** `/market/merchant/goods/:id` - 更新商品
- **POST** `/market/merchant/goods/:id/restock` - 补货
- **POST** `/market/merchant/goods/:id/shelf` - 上下架

### 9.4 订单管理

- **GET** `/market/merchant/orders` - 获取订单列表
- **GET** `/market/merchant/orders/:orderNo` - 获取订单详情
- **POST** `/market/merchant/orders/:orderNo/action` - 订单操作

### 9.5 支付记录

**GET** `/market/merchant/payments`

### 9.6 客户管理（新增）

- **GET** `/market/merchant/customers/list` - 获取客户列表
- **GET** `/market/merchant/customers/:id/orders` - 获取客户订单
- **GET** `/market/merchant/customers/:id/stats` - 获取客户统计

### 9.7 营销中心（新增）

- **GET** `/market/merchant/marketing/coupons` - 获取优惠券列表
- **POST** `/market/merchant/marketing/coupons` - 创建优惠券
- **PUT** `/market/merchant/marketing/coupons/:id` - 更新优惠券
- **DELETE** `/market/merchant/marketing/coupons/:id` - 删除优惠券
- **GET** `/market/merchant/marketing/stats` - 获取营销统计

### 9.8 售后管理（新增）

- **GET** `/market/merchant/refunds/list` - 获取退款列表
- **GET** `/market/merchant/refunds/:id` - 获取退款详情
- **POST** `/market/merchant/refunds/:id/approve` - 同意退款
- **POST** `/market/merchant/refunds/:id/reject` - 拒绝退款
- **GET** `/market/merchant/refunds/stats/summary` - 获取退款统计

---

## 十、技工端模块

### 10.1 订单操作

- **GET** `/worker/orders` - 获取订单列表
- **GET** `/worker/orders/:id` - 获取订单详情
- **POST** `/worker/orders/:id/accept` - 接单
- **POST** `/worker/orders/:id/reject` - 拒单
- **POST** `/worker/orders/:id/check-in` - 打卡
- **POST** `/worker/orders/:id/evidence` - 上传凭证
- **POST** `/worker/orders/:id/complete` - 完成订单

---

## 十一、消息模块

### 11.1 会话操作

- **GET** `/messages/conversations` - 获取会话列表
- **GET** `/messages/conversations/:id` - 获取会话消息
- **POST** `/messages/conversations/:id` - 发送消息
- **POST** `/messages/conversations` - 创建会话

---

## 十二、通用接口

### 12.1 文件上传

**POST** `/upload`

**Content-Type**: `multipart/form-data`

**请求参数**：`file` - 文件

**响应示例**：
```json
{
  "url": "/uploads/abc123.jpg"
}
```

### 12.2 反馈

**POST** `/feedback`

---

## 附录：错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| -1 | 通用错误 |
| 401 | 未授权/Token失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 422 | 参数验证失败 |
| 500 | 服务器内部错误 |

---

**文档版本**: v1.0  
**最后更新**: 2026-04-22
