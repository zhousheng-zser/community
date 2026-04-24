# 后端已实现功能列表

此文档总结了当前后端已实现的功能，主要基于前端联调需求文档。

## 1. 首页模块

### 1.1 Banner 接口

- **API**: `GET /api/v1/core/banners`
- **说明**: 获取首页 Banner 列表，支持多场景预留。返回 Banner 图片 URL、跳转类型和跳转值。

### 1.2 服务分组接口

- **API**: `GET /api/v1/core/service-groups/:key`
- **说明**: 根据不同的 `key`（如 `tidy`, `urgent_fix` 等）获取服务分组信息，包括分组标题、价格单位、类目 Tab 和服务列表。

### 1.3 小区热卖榜接口

- **API**: `GET .../community/hot` (具体路径待定，但已规划)
- **说明**: 根据用户所属小区或选定小区，统计最近一段时间内下单量最多的服务 SKU 和/或集市店铺信息。

### 1.4 直约技工接口

- **API**: `GET /api/v1/core/workers`
- **说明**: 获取审核通过且上架的技工列表，支持按排序、接单数、评分等排序。
- **API**: `GET /api/v1/core/workers/:id`
- **说明**: 获取指定 ID 技工的详细信息。

### 1.5 管家精选接口

- **API**: `GET /api/v1/core/goods/featured`
- **说明**: 返回精选商品列表。

## 2. 订单模块

### 2.1 到家服务订单

- **API**: `POST /api/v1/service-orders`
- **说明**: 创建到家服务订单。
- **API**: `GET /api/v1/service-orders/my`
- **说明**: 获取当前用户的服务订单列表。

### 2.2 邻里帮帮订单

- **API**: `POST /api/v1/neighbor-assist/orders`
- **说明**: 创建邻里帮帮订单，支持双地址采集。
- **API**: `GET /api/v1/neighbor-assist/orders/my`
- **说明**: 获取当前用户的邻里帮帮订单列表。

## 3. 管理后台接口

### 3.1 服务订单管理

- **API**: `GET /api/v1/admin/service-orders`
- **说明**: 管理员获取待派单等服务订单列表。
- **API**: `POST /api/v1/admin/service-orders/:id/assign`
- **说明**: 管理员指派技工给指定服务订单。

### 3.2 邻里帮帮订单管理

- **API**: `GET /api/v1/admin/neighbor-assist/orders`
- **说明**: 管理员获取邻里帮帮订单列表。
- **API**: `POST /api/v1/admin/neighbor-assist/orders/:id/assign`
- **说明**: 管理员指派技工给指定邻里帮帮订单。

## 4. 用户相关接口

- **API**: `GET /api/v1/user/profile`
- **说明**: 获取用户余额信息。
- **API**: `GET /api/v1/wx/user/coupon/:id`
- **说明**: 获取用户优惠券数量。

## 5. 入驻申请接口

- **API**: `POST /api/v1/worker/apply`
- **说明**: 技工入驻申请。
- **API**: `POST /api/v1/service-provider/apply`
- **说明**: 服务商入驻申请。
