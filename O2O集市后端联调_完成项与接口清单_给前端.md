# O2O 集市后端联调 - 完成项与接口清单（给前端）

更新时间：2026-04-22  
适用环境：`/api/v1/market/*`

## 1) 已完成内容总览

### A. 架构与状态机
- 已切换到 O2O 单店模型：订单创建/预览按 `shop_id` 单店处理。
- 订单状态机已改为：
  - `pending_payment`（待付款）
  - `pending_accept`（待接单）
  - `pending_service`（备货/出餐中）
  - `pending_receipt`（待收货）
  - `completed`（已完成）
  - `cancelled`（已取消）
  - `refunded`（已退款）
- 支付成功后状态：`pending_payment -> pending_accept`（不再写入旧 `paid`）。

### B. SKU 与商品能力
- 已新增 SKU 表：`market_good_skus`。
- 商品主表已扩展：`price_range`、`desc_html`。
- 订单明细已扩展：`market_sku_id`、`specs_snapshot`（下单快照规格）。
- 商品详情接口支持返回：`sku_tree` + `sku_list`。

### C. 入驻字段扩容
- 商家入驻新增并支持落库字段：`logo_url`、`background_url`、`entity_name`、`promoter_name`。
- 入驻校验已加强：公司资质与关键图片字段必填。

### D. 类目字典统一
- `marketCategoryMap` 已切换为 10 类：
  - `食品生鲜`、`美妆洗护`、`居家百货`、`服装箱包`、`母婴系列`、`家用电器`、`数码产品`、`珠宝饰品`、`旅游出行`、`传统工艺`

### E. 搜索与路由别名
- 已新增 `GET /api/v1/market/search`（goods/shop 双擎）。
- 已新增并兼容：
  - `GET /api/v1/market/goods/detail?id=...`
  - `POST /api/v1/market/order/create`
  - `GET /api/v1/market/order/detail?order_no=...`
  - `GET /api/v1/market/orders`（与 `orders/my` 等价）
  - `POST /api/v1/market/merchant/apply`（与 `apply` 等价）

### F. 管理端履约联动
- 管理端履约动作已对齐新状态流：
  - `accept: pending_accept -> pending_service`
  - `dispatch: pending_service -> pending_receipt`
  - `complete: pending_receipt -> completed`
  - `reject/close -> cancelled`

### G. 数据库迁移
- 已提供并执行迁移脚本：
  - `backend/src/migrations/20260422120000-market-o2o-sku-order-status.js`
- 脚本内容包括：建 SKU 表、补字段、历史状态迁移、默认 SKU 回填（给旧商品补一条空规格 SKU）。

---

## 2) 前端联调接口清单（已可用）

说明：除特别标注外，均需登录态（Bearer Token）。

### 2.1 搜索模块

#### `GET /api/v1/market/search`
- Query：
  - `keyword`（可空）
  - `type`：`goods` | `shop`
  - `sort`：`smart` | `rating` | `price_asc` | `sales`
  - `page`、`page_size`
  - 店铺搜索可附加：`category`、`user_lat`、`user_lng`
- 返回：`{ code, msg, data: { list, page, page_size, total, type } }`

---

### 2.2 商品详情（含 SKU）

#### `GET /api/v1/market/goods/detail?id={goodsId}`
#### `GET /api/v1/market/goods/{goodsId}`（兼容）
- 返回核心字段：
  - `id`, `shopId`, `shopName`, `name`
  - `main_images`
  - `price_range`
  - `sales`
  - `desc_html`
  - `sku_tree`: 规格树
  - `sku_list`: SKU 明细（`id` 形如 `sku_123`）

---

### 2.3 订单模块

#### `POST /api/v1/market/orders/preview`
- 用途：预结算
- 请求体：
  - `shop_id`
  - `delivery_mode`: `express` | `pickup`
  - `items`: `[{ goods_id, sku_id, quantity }]`
- 返回：`goods_amount`、`delivery_fee`、`discount_amount`、`payable_amount`

#### `POST /api/v1/market/order/create`
#### `POST /api/v1/market/orders`（兼容）
- 用途：创建订单
- 请求体：
  - `shop_id`
  - `delivery_mode`: `express` | `pickup`
  - `address`（对象；`express` 时必须有电话和地址）
  - `items`: `[{ goods_id, sku_id, quantity }]`
  - `remark`（可选）
  - `community_id`（可选）
- 返回：`orderNo`、`order_status`、`pay_status`、`payable_amount`

#### `GET /api/v1/market/orders`
#### `GET /api/v1/market/orders/my`（等价）
- Query：`status`、`page`、`page_size`
- 返回列表字段：
  - `orderNo`, `shopName`, `status`, `amount`, `refundStatus`, `goods[]`

#### `GET /api/v1/market/order/detail?order_no={orderNo}`
- 返回字段：
  - `orderNo`, `status`, `shopName`, `shopPhone`
  - `goods_amount`, `delivery_fee`, `discount_amount`, `payable_amount`
  - `receiver_name`, `receiver_phone`, `receiver_address`
  - `delivery_mode`
  - `goods[]`

#### `POST /api/v1/market/orders/{orderNo}/cancel`
- 仅 `pending_payment` 状态可取消。

---

### 2.4 支付模块

#### `POST /api/v1/market/payments/create`
- 请求体：`{ order_no }`
- 订单必须是：`order_status=pending_payment` 且 `pay_status=unpaid`
- 返回微信支付参数（未配微信商户时，联调模式下返回虚拟支付参数）

#### `GET /api/v1/market/payments/status?order_no={orderNo}`
- 查询支付状态与订单状态。

#### `POST /api/v1/market/payments/mock-success`（开发联调）
- 开发环境模拟支付成功；订单会更新为 `pending_accept`。

---

### 2.5 入驻申请

#### `POST /api/v1/market/merchant/apply`
#### `POST /api/v1/market/apply`（兼容）
- 必填：
  - 基础：`shop_name`, `contact_name`, `phone`, `category`, `address`
  - 资质：`entity_name`, `credit_code`, `legal_person`
  - 图片：`logo_url`, `background_url`, `license_url`
- 可选：
  - `description`, `promoter_id`, `promoter_name/promoter`, `place_photo_url[]`, `community_id`

---

## 3) 前端联调注意事项

- 路由前缀统一使用 ` /api/v1/market/* `。
- 下单优先传 `sku_id`；若某商品只有 1 个 SKU，可暂不传（服务端会兜底）。
- `express` 配送必须有收货电话和地址；`pickup` 可不传详细地址。
- 订单状态请按新枚举渲染，不再使用 `pending_shipment`、`paid`、`delivering` 等旧值。
- 详情页请优先走 `GET /goods/detail?id=...`（与文档第八章结构一致）。

---

## 4) 代码落点（便于后续追踪）

- 路由：`backend/src/routes/marketRoutes.js`
- 订单：`backend/src/controllers/marketOrderController.js`
- 支付：`backend/src/controllers/marketPaymentController.js`
- 搜索：`backend/src/controllers/marketSearchController.js`
- 商品详情：`backend/src/controllers/marketShopController.js`
- 入驻：`backend/src/controllers/applicationController.js`
- 状态机（管理端）：`backend/src/controllers/adminMarketController.js`
- 迁移：`backend/src/migrations/20260422120000-market-o2o-sku-order-status.js`

