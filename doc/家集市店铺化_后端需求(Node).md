# 本地集市店铺化后端需求文档（Node）

## 1. 文档目的

面向后端 Node 同事，提供可直接开发的一期需求说明：
- 数据库表结构（MySQL）
- `market` 领域接口定义
- 订单与支付状态机
- 事务、幂等、回调验签规范

本文件与现有 `doc/API接口文档.md` 风格保持一致，统一 `code/msg/data` 返回结构。

## 2. 技术约束

- 服务前缀：`/api/v1`
- 语言框架：Node.js + Express（与现有项目一致）
- 数据库：MySQL 8.0+（utf8mb4）
- 鉴权：
  - 用户接口：JWT（`Authorization: Bearer <token>`）
  - 支付回调：不走 JWT，必须签名校验
- 上传：复用 `POST /api/v1/upload`

## 3. 数据库 DDL（一期建议）

> 说明：以下为建议结构，字段可按当前库规范微调，但主键、唯一键、状态字段与核心索引建议保留。

```sql
-- 1) 店铺主表
CREATE TABLE `market_shops` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `shop_no` VARCHAR(32) NOT NULL COMMENT '业务店铺号',
  `name` VARCHAR(120) NOT NULL COMMENT '店铺名称',
  `category` VARCHAR(50) NOT NULL COMMENT '店铺分类',
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `cover_url` VARCHAR(255) DEFAULT NULL,
  `notice` VARCHAR(255) DEFAULT NULL,
  `delivery_type` ENUM('platform','merchant','self_pickup') DEFAULT 'platform',
  `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `avg_delivery_minutes` INT DEFAULT 30,
  `rating` DECIMAL(3,2) DEFAULT 4.80,
  `sold_count` INT NOT NULL DEFAULT 0,
  `is_open` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '营业开关',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '上下架',
  `sort_order` INT NOT NULL DEFAULT 0,
  `address` VARCHAR(255) DEFAULT NULL,
  `contact_name` VARCHAR(50) DEFAULT NULL,
  `contact_phone` VARCHAR(30) DEFAULT NULL,
  `business_hours` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shop_no` (`shop_no`),
  KEY `idx_category_active` (`category`,`is_active`,`is_open`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='本地集市店铺主表';

-- 2) 店内分类
CREATE TABLE `market_shop_categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `shop_id` BIGINT NOT NULL,
  `category_key` VARCHAR(50) NOT NULL,
  `category_name` VARCHAR(50) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shop_category_key` (`shop_id`,`category_key`),
  KEY `idx_shop_sort` (`shop_id`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店内商品分类';

-- 3) 商品表
CREATE TABLE `market_goods` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `goods_no` VARCHAR(32) NOT NULL,
  `shop_id` BIGINT NOT NULL,
  `category_key` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `main_image` VARCHAR(255) DEFAULT NULL,
  `images` JSON DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `origin_price` DECIMAL(10,2) DEFAULT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `sold_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('on_sale','off_sale') NOT NULL DEFAULT 'on_sale',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_goods_no` (`goods_no`),
  KEY `idx_shop_category_status` (`shop_id`,`category_key`,`status`,`sort_order`),
  KEY `idx_shop_status` (`shop_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='本地集市商品表';

-- 4) 购物车
CREATE TABLE `market_cart_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `shop_id` BIGINT NOT NULL,
  `goods_id` BIGINT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `checked` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_shop_goods` (`user_id`,`shop_id`,`goods_id`),
  KEY `idx_user_shop` (`user_id`,`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车项';

-- 5) 订单主表
CREATE TABLE `market_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(40) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `shop_id` BIGINT NOT NULL,
  `order_status` ENUM('pending_payment','paid','delivering','completed','cancelled','closed') NOT NULL DEFAULT 'pending_payment',
  `pay_status` ENUM('unpaid','paid','refund_pending','refunded','pay_failed') NOT NULL DEFAULT 'unpaid',
  `goods_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payable_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `receiver_name` VARCHAR(50) DEFAULT NULL,
  `receiver_phone` VARCHAR(30) DEFAULT NULL,
  `receiver_address` VARCHAR(255) DEFAULT NULL,
  `remark` VARCHAR(255) DEFAULT NULL,
  `cancel_reason` VARCHAR(100) DEFAULT NULL,
  `paid_at` DATETIME DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT NULL,
  `expired_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_ctime` (`user_id`,`created_at`),
  KEY `idx_shop_ctime` (`shop_id`,`created_at`),
  KEY `idx_status` (`order_status`,`pay_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='本地购物订单主表';

-- 6) 订单明细（下单快照）
CREATE TABLE `market_order_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `order_no` VARCHAR(40) NOT NULL,
  `shop_id` BIGINT NOT NULL,
  `goods_id` BIGINT NOT NULL,
  `goods_name_snapshot` VARCHAR(150) NOT NULL,
  `goods_image_snapshot` VARCHAR(255) DEFAULT NULL,
  `unit_price_snapshot` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='本地购物订单明细';

-- 7) 支付流水表
CREATE TABLE `market_pay_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(40) NOT NULL,
  `out_trade_no` VARCHAR(64) NOT NULL COMMENT '业务支付单号',
  `channel` ENUM('wechat_jsapi') NOT NULL DEFAULT 'wechat_jsapi',
  `transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '三方支付流水号',
  `pay_status` ENUM('created','success','failed','closed','refunded') NOT NULL DEFAULT 'created',
  `amount` DECIMAL(10,2) NOT NULL,
  `notify_raw` JSON DEFAULT NULL COMMENT '回调原文',
  `notify_count` INT NOT NULL DEFAULT 0,
  `last_notify_at` DATETIME DEFAULT NULL,
  `paid_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_out_trade_no` (`out_trade_no`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_status` (`pay_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='本地集市支付交易流水';
```

## 4. 接口需求清单

## 4.1 店铺与商品（公共接口）

1) `GET /api/v1/market/shops`
- 用途：本地集市首页店铺流
- 查询参数：
  - `category` 可选
  - `sort` 可选（`comprehensive`/`sales`/`delivery_time`）
  - `page`、`page_size`
- 返回：
  - 店铺基础字段、配送信息、营业状态、最小起送价

2) `GET /api/v1/market/shops/:shopId`
- 用途：店铺详情顶部信息
- 返回：店铺详情 + 营业状态 + 商家信息（联系方式、地址、营业时间）

3) `GET /api/v1/market/shops/:shopId/categories`
- 用途：店铺左侧分类
- 返回：分类列表（按 `sort_order`）

4) `GET /api/v1/market/shops/:shopId/goods`
- 用途：店内商品列表
- 查询参数：`category_key`、`page`、`page_size`
- 返回：商品列表（仅 `on_sale`）

5) `GET /api/v1/market/goods/:goodsId`
- 用途：商品详情弹层/详情页

## 4.2 购物车（登录态）

1) `GET /api/v1/market/cart?shop_id=xxx`
- 用途：读取当前店铺购物车

2) `POST /api/v1/market/cart/items`
- 用途：加入购物车 / 累加
- body：
  - `shop_id`、`goods_id`、`quantity`

3) `PUT /api/v1/market/cart/items/:itemId`
- 用途：修改数量
- body：`quantity`

4) `DELETE /api/v1/market/cart/items/:itemId`
- 用途：删除单项

5) `DELETE /api/v1/market/cart?shop_id=xxx`
- 用途：清空当前店铺购物车

## 4.3 订单（登录态）

1) `POST /api/v1/market/orders/preview`
- 用途：预结算（验库存、验价格、验起送）
- 请求体：`shop_id` + `items[]` + 地址信息
- 返回：金额拆分（商品金额、配送费、应付金额）

2) `POST /api/v1/market/orders`
- 用途：创建订单（事务）
- 请求体：
  - `shop_id`
  - `items`（允许从购物车生成，后端再次核验）
  - `receiver_name`、`receiver_phone`、`receiver_address`
  - `remark`
  - `idempotency_key`（建议）

3) `GET /api/v1/market/orders/my`
- 用途：我的订单列表
- 查询参数：`status`、`page`、`page_size`

4) `GET /api/v1/market/orders/:orderNo`
- 用途：订单详情

5) `POST /api/v1/market/orders/:orderNo/cancel`
- 用途：取消订单（仅未支付状态）

## 4.4 支付（登录态 + 回调）

1) `POST /api/v1/market/payments/create`
- 用途：创建支付参数（微信 JSAPI）
- 请求体：`order_no`
- 返回：前端拉起支付所需参数（按微信 SDK 规范）

2) `GET /api/v1/market/payments/status?order_no=xxx`
- 用途：支付结果查询（前端轮询兜底）

3) `POST /api/v1/market/pay/callback`
- 用途：支付回调（微信服务端回调地址）
- 特点：
  - 不走 JWT
  - 必须验签
  - 必须幂等
  - 需返回平台要求的成功响应，避免重试风暴

## 5. 统一返回结构与错误码

建议统一：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {}
}
```

业务错误码建议（示例）：
- `10001` 未登录/令牌无效
- `20001` 店铺不存在或已下线
- `20002` 店铺休息中
- `20011` 商品不存在或已下架
- `20012` 库存不足
- `20021` 未达到起送价
- `20031` 订单状态不允许当前操作
- `20041` 支付创建失败
- `20042` 回调验签失败
- `20043` 回调重复（幂等命中）

## 6. 状态机定义

## 6.1 订单状态
- `pending_payment`：已创建待支付
- `paid`：支付成功待履约
- `delivering`：配送中（可选，后续扩展）
- `completed`：已完成
- `cancelled`：用户取消
- `closed`：超时关闭

状态流转：
- `pending_payment -> paid -> completed`
- `pending_payment -> cancelled`
- `pending_payment -> closed`

## 6.2 支付状态
- `created`：已创建支付单
- `success`：支付成功
- `failed`：支付失败
- `closed`：支付关闭
- `refunded`：已退款（后续可扩展）

## 7. 事务与幂等要求

## 7.1 创建订单事务
- 事务内动作：
  - 校验商品可售与库存
  - 锁定并扣减库存（建议 `UPDATE ... WHERE stock >= ?`）
  - 写订单主表 + 明细快照
  - 标记购物车项（清理或转已下单）
- 任一步失败即回滚。

## 7.2 支付回调幂等
- 唯一键：`out_trade_no` 或平台交易号
- 幂等逻辑：
  - 已处理成功的回调再次到达，直接返回成功，不重复改状态、不重复记账。
- 回调处理必须落库 `notify_raw`，便于审计与排障。

## 7.3 幂等键建议
- 下单接口支持 `idempotency_key`（header/body）
- 24 小时内同 key 重复请求返回首次创建结果

## 8. 支付回调安全要求

- 验签：使用平台密钥进行签名校验
- 防重放：校验时间戳窗口 + nonce
- 白名单：可选增加平台 IP 白名单
- 限流：回调接口限流与告警

## 9. 与现有接口文档的兼容要求

- 保持 `doc/API接口文档.md` 的章节风格和命名方式。
- 在现有文档中新增 `market` 章节，不覆盖旧业务章节。
- 旧接口 `POST /api/v1/market/apply` 保持可用。
- 上传接口继续复用 `POST /api/v1/upload`。

## 10. 最小联调样例

## 10.1 创建订单请求示例
```json
{
  "shop_id": 1001,
  "items": [
    { "goods_id": 9001, "quantity": 2 },
    { "goods_id": 9002, "quantity": 1 }
  ],
  "receiver_name": "张三",
  "receiver_phone": "13800001111",
  "receiver_address": "某某小区1幢101",
  "remark": "请放门口",
  "idempotency_key": "mk_odr_20260317_xxx"
}
```

## 10.2 创建订单响应示例
```json
{
  "code": 0,
  "msg": "订单创建成功",
  "data": {
    "order_no": "MK202603170001",
    "order_status": "pending_payment",
    "pay_status": "unpaid",
    "payable_amount": "49.80",
    "expired_at": "2026-03-17 15:30:00"
  }
}
```

## 10.3 支付回调处理要求
- 回调成功后：
  - `market_pay_transactions.pay_status = success`
  - `market_orders.pay_status = paid`
  - `market_orders.order_status = paid`
  - `market_orders.paid_at = NOW()`

## 11. 验收标准（后端）

- 可通过接口完成“店铺浏览 -> 加购 -> 下单 -> 支付回调 -> 订单完成”全链路。
- 重复回调不会导致订单重复更新或重复入账。
- 下单并发场景无超卖（库存扣减正确）。
- 错误码与返回结构统一，前端可稳定展示。
