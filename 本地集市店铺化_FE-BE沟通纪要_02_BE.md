# 本地集市店铺化 FE-BE 沟通纪要（后端视角·第 2 次）  
（给前端同事看的说明书，方便联调与后续扩展）

## 一、这次我们后端到底在做什么

先把话说明白：这次后端做的不是“帮前端凑几个接口”，而是把 **「本地集市」当成一个独立的交易子系统** 来建设：

- 有自己完整的一套领域表（7 张）
- 有自己的订单状态机、支付流水、回调日志
- 有事务化的下单扣库存、防超卖
- 有验签 + 幂等的支付回调，不会因为重试把订单/钱包搞乱

统一接口前缀是：`/api/v1/market/**`，所有返回统一结构：

```json
{ "code": 0, "msg": "ok", "data": { ... } }
```

后续你在前端里，只要看到 `market` 域的接口，都可以认为是在走“本地集市子系统”的读/写能力。

---

## 二、当前后端已经完成的内容

### 1. 数据层（7 张核心表 + Model）

数据库建表已通过 `npm run db:sync` 同步，Sequelize Model 已就位：

- `market_shops` → `MarketShop`
- `market_shop_categories` → `MarketShopCategory`
- `market_goods` → `MarketGood`
- `market_cart_items` → `MarketCartItem`
- `market_orders` → `MarketOrder`
- `market_order_items` → `MarketOrderItem`
- `market_pay_transactions` → `MarketPayTransaction`

表结构完全按《本地集市店铺化_后端需求(Node).md》里的 DDL 来做：

- `order_no / out_trade_no` 均有唯一键，为后续幂等打基础
- 列表/订单/支付流水都按 DDL 上的索引新增（避免后面查慢）

### 2. 基础读链路（店铺 & 商品）

已上线接口（公共，无需登录）：

- `GET /api/v1/market/shops`
- `GET /api/v1/market/shops/:shopId`
- `GET /api/v1/market/shops/:shopId/categories`
- `GET /api/v1/market/shops/:shopId/goods`
- `GET /api/v1/market/goods/:goodsId`

关键字段与前端纪要中的「字段映射表」对齐：

- 店铺：`id/name/category/logo_url/cover_url/min_order_amount/delivery_fee/avg_delivery_minutes/sold_count/notice/is_open/is_active/...`
- 商品：`id/category_key/name/description/main_image/price/origin_price/stock/sold_count/status`

**说明一下 `delivery_type_text`：**

当前表里字段是：

- `delivery_type`: `'platform' | 'merchant' | 'self_pickup'`

前端预期有一个更友好的展示字段：

- `delivery_type_text`：例如：
  - `'platform' -> '平台配送'（或 邻工秒送）`
  - `'merchant' -> '商家自送'`
  - `'self_pickup' -> '到店自取'`

目前接口里会在返回时根据 `delivery_type` 衍生出一个 `delivery_type_text` 给你，不需要前端自己拼。

### 3. 示例数据（方便你直接联调）

在 `backend/` 目录下有一个造数脚本：

- `seed_market_data.js`

执行：

```bash
cd backend
node seed_market_data.js
```

会在 `market_shops / market_shop_categories / market_goods` 中插入若干示例：

- 3 家店：生鲜超市 / 便民小吃 / 土特产馆
- 每店多分类、多商品（含价格、库存、划线价、销量、排序）

你当前联调看到的店铺/商品，就是来自这些数据。

### 4. 购物车接口（已按 REST + 兼容模式接好）

正式接口（**登录态，带 JWT**）：

- `GET /api/v1/market/cart?shop_id=xxx`
  - 返回：`{ code, msg, data: { list: [ { id, shop_id, goods_id, quantity, checked, ... } ] } }`
- `POST /api/v1/market/cart/items`
  - body：`{ shop_id, goods_id, quantity }`
  - 行为：
    - 若该用户在该店铺已存在此 `goods_id`，则数量累加
    - 否则新建一条 `market_cart_items` 记录
- `PUT /api/v1/market/cart/items/:itemId`
  - body：`{ quantity }`，`quantity = 0` 视为删除该项
- `DELETE /api/v1/market/cart/items/:itemId`
- `DELETE /api/v1/market/cart?shop_id=xxx`

短期兼容你当前的占位写法（**仍然可用，但建议改掉**）：

- `POST /api/v1/market/cart/items/:itemId` → 内部走 `updateItem`
- `POST /api/v1/market/cart/items/:itemId/delete` → 内部走 `deleteItem`
- `POST /api/v1/market/cart/clear`（body 或 query 带 `shop_id`）→ 内部走 `clearCart`

你可以先逐步把前端改回标准 REST 形式，上述 3 个 POST 兼容路由后面会在你完成切换后去掉。

---

## 三、接下来后端要补齐的重点（和前端强相关）

### 1. 预结算 & 创建订单（T4）

接口：

- `POST /api/v1/market/orders/preview`
  - 入参：`shop_id` + `items[{goods_id, quantity}]`（可携带地址信息）
  - 出参：`goods_amount`、`delivery_fee`、`discount_amount`、`payable_amount`
  - 主要做校验：
    - 店铺是否存在 & 是否营业
    - 商品是否在售、库存是否足够
    - 是否达到起送价

- `POST /api/v1/market/orders`
  - 入参：
    - `shop_id`
    - `items[{goods_id, quantity}]`
    - 收货信息：`receiver_name/receiver_phone/receiver_address`
    - `remark`
    - （可选）`idempotency_key`
  - 服务端会在**一个事务里做四件事**：
    1. 再次校验库存和价格
    2. 扣减库存（`UPDATE ... WHERE stock >= ?` 方式防超卖）
    3. 写 `market_orders` 主表
    4. 写 `market_order_items` 明细快照（固化下单时的名称/价格/图片）
  - 任一步失败则整体回滚。

### 2. 订单查询 & 取消（T5）

- 我的订单列表：`GET /api/v1/market/orders/my?status=&page=&page_size=`
- 订单详情：`GET /api/v1/market/orders/:orderNo`
- 取消订单：`POST /api/v1/market/orders/:orderNo/cancel`

约束：

- 仅允许 **当前用户自己的订单** 取消 / 查看
- 仅 `pending_payment` 状态可以取消
- 取消时要在事务里：订单状态改为 `cancelled` + 回补库存

### 3. 支付创建 & 回调（T6/T7）

接口：

- `POST /api/v1/market/payments/create`
  - 入参：`order_no`
  - 行为：
    - 校验订单归属/状态
    - 生成 `out_trade_no`（唯一）
    - 写入 `market_pay_transactions`（`pay_status=created`）
    - 调起微信支付统一下单（这部分会按 V3 协议对齐，但需要你们后续提供商户配置后才能上线真支付）

- `GET /api/v1/market/payments/status?order_no=xxx`

- `POST /api/v1/market/pay/callback`（不走 JWT）
  - 按微信支付 V3 验签：时间戳 + nonce + 签名头 + 回调 body
  - 幂等逻辑：
    - 按 `out_trade_no` 查流水，若已经是成功状态，直接返回成功（`notify_count++`），不重复更新订单/余额
    - 首次成功时：
      - 更新 `market_pay_transactions` 为 `success`，写 `transaction_id/paid_at/notify_raw/notify_count/last_notify_at`
      - 更新 `market_orders`：`pay_status=paid`、`order_status=paid`、`paid_at` 写入

> 现阶段由于微信支付商户配置还没给，我们会先把骨架写好，并提供一个“开发环境模拟回调”的工具/脚本，方便你验证状态流转和幂等。真机支付等你们配置好商户信息之后再一起打通。

---

## 四、字段与错误码约定（再强调一遍）

### 1. 重要字段（和前端映射直接相关）

- 店铺卡片：
  - `id/name/category/logo_url/cover_url/min_order_amount/delivery_fee/avg_delivery_minutes/sold_count/notice/delivery_type_text`
- 店铺详情：
  - `cover_url/logo_url/name/rating/sold_count/delivery_type_text/business_hours/notice/address/contact_name/contact_phone`
- 分类：
  - `category_key/category_name`
- 商品：
  - `id/category_key/name/description/main_image/price/origin_price/stock/sold_count/status`

### 2. 错误码（建议统一使用）

- `20001`：店铺不存在或已下线
- `20002`：店铺休息中
- `20011`：商品不存在或已下架
- `20012`：库存不足
- `20021`：未达到起送价
- `20031`：订单状态不允许当前操作
- `20041`：支付创建失败
- `20042`：支付回调验签失败
- `20043`：支付回调重复（幂等命中）

如你有更希望的错误码/文案，也可以直接在这份纪要下补充，我们后端这边可以按你给的编码来实现。

---

## 五、我们这边的进度跟踪方式

- `backend/MARKET_PROGRESS.md`：后端这边会把每一块（T1~T7）完成情况、接口自测记录写里面。
- 若后续某个接口字段需要调整，会：
  - 在本纪要相应表格里更新「建议后端字段」一列
  - 在 `MARKET_PROGRESS.md` 中附一条简要备注（例如：`shops.list 增加 delivery_type_text`）。

你这边如果在联调中发现“字段名/含义”和这里写的不一致，直接在这份纪要上标记出来即可，我们后端会优先按这份 BE 纪要与 FE 纪要保持一致，避免你那边来回改代码。  

