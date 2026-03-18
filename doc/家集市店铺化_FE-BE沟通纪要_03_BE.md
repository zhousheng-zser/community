# 家集市店铺化 FE-BE 沟通纪要（后端视角·第 3 次）
（用于把“交易闭环已就绪”与“前端下一步联调清单/注意点”讲清楚）

---
## 0. 当前结论（可以交付前端开始联调）
家集市一期交易闭环（`/api/v1/market/**`）已完成并完成关键正确性验证：
- 订单创建：事务化扣库存（防超卖）+ 写订单明细快照
- 支付回调：验签 + 幂等落库 + 支付/订单状态更新
- 并发正确性：在客户端超时可能存在的情况下，使用 **DB 落库对账** 验证“库存扣减严格一致”

因此下一阶段建议：**先把这套 BE 能力交给前端同学开始联调**；前端跑通“页面链路”后再由 BE 补齐你们发现的字段/边界差异。

---
## 1. BE 本次更新点（已经做完）
### 1.1 并发正确性压测脚本增强
- `backend/market_stress_orders.js`
  - 增加：读取商品库存失败重试
  - 增加：`POST_WAIT_MS` 给服务端留出提交时间（避免客户端 abort 造成统计偏差）
  - 增加：**DB 对账**（按时间窗口统计 `market_order_items.quantity` 的落库扣减），用于最终一致性校验

### 1.2 下单扣库存链路的小幅优化
- `backend/src/controllers/marketOrderController.js`
  - 去掉 `create()` 中对 `MarketGood.findAll()` 的冗余行锁（`FOR UPDATE`）
  - 理由：库存扣减本身已经通过 `UPDATE ... WHERE stock >= q` 原子条件保证防超卖；额外叠加锁会放大等待导致客户端超时

---
## 2. 给前端同学的联调优先级（建议按顺序跑）
### 2.1 先把读链路打通（公共，无需 token）
你可以先把页面展示相关数据跑通：
- `GET /api/v1/market/shops?page=1&page_size=10`
- `GET /api/v1/market/shops/:shopId`
- `GET /api/v1/market/shops/:shopId/categories`
- `GET /api/v1/market/shops/:shopId/goods?page=1&page_size=20`
- `GET /api/v1/market/goods/:goodsId`

### 2.2 再跑购物车（登录态，JWT）
- `GET /api/v1/market/cart?shop_id=xxx`
- `POST /api/v1/market/cart/items`（`{shop_id, goods_id, quantity}`）
- `PUT /api/v1/market/cart/items/:itemId`（`{quantity}`；quantity=0 视为删除）
- `DELETE /api/v1/market/cart/items/:itemId`
- `DELETE /api/v1/market/cart?shop_id=xxx`

> 注意：后端仍保留了部分“短期兼容 POST 路由”，但建议你们尽快改回标准 REST 路由，降低后续改动成本。

### 2.3 下单（需要登录态）
- `POST /api/v1/market/orders/preview`
  - body：`{shop_id, items:[{goods_id, quantity}]}`（可附地址字段用于你们 UI）
  - 返回：金额分项 + `payable_amount`
- `POST /api/v1/market/orders`
  - body：`{shop_id, items, receiver_name, receiver_phone, receiver_address, remark?}`
  - 返回：`order_no`

### 2.4 支付（虚拟支付/回调模拟先联调）
- `POST /api/v1/market/payments/create`（登录态）
  - body：`{order_no}`
  - 返回：`out_trade_no`、金额等
- `GET /api/v1/market/payments/status?order_no=xxx`（登录态）
- `POST /api/v1/market/pay/callback`（不走 JWT）
  - 你们联调时先按后端脚本模拟回调，验签通过后订单应变为：
    - `order_status: paid`
    - `pay_status: paid`

---
## 3. 已验证的关键正确性证据（给你们作为“验收口径”）
### 3.1 幂等回调
- 同一个回调 payload（同一 `out_trade_no`）重复打两次：
  - 第一次：`SUCCESS`，订单更新为 `paid`
  - 第二次：`SUCCESS`，不重复记账/不重复更改状态（幂等命中）

### 3.2 防超卖并发正确性（DB 对账 PASS）
本次压测口径：按时间窗口统计 `market_order_items.quantity` 的真实落库扣减，并与 `stock` 差值对齐。

- 用例（示例）：`GOODS_ID=2, QTY=2, CONCURRENCY=10, REQUESTS=50`
  - `库存变化 stock0=72 -> stock1=4`
  - `落库扣减数量=68`
  - 一致性校验：PASS（包含“库存差值=落库扣减”与“扣减不超过初始库存”）

这说明：并发下“不会出现超卖导致的库存负数或扣减不一致”。

---
## 4. 前端需要重点关注/需要我们同步的点
你们在联调中如果发现差异，请优先回传以下信息（便于我们快速定位）：
- 请求体字段名是否与 BE 一致（`shop_id/items/receiver_*`、cart 的 `quantity/checked` 等）
- 对金额字符串/数字类型的约定（例如 `price`/`payable_amount` 是否以字符串返回）
- 错误码返回是否按约定：
  - `20012`：库存不足
  - `20021`：未达到起送价
  - `20031`：订单状态不允许取消
  - `20042`：回调验签失败

---
## 7. 前端同事问题答复（支付/订单/优惠券）
### 7.1 `POST /api/v1/market/payments/create` 示例返回 JSON（已 mask）
当前一期（未配置微信支付商户参数）后端返回的是“联调占位”，**不会直接包含** JSAPI 需要的字段：
- `timeStamp / nonceStr / package / signType / paySign`：不包含

示例（敏感字段已 mask，字段名保持不变）：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "order_no": "MK2026....",
    "out_trade_no": "MKPAY_MK2026....",
    "amount": "23.40",
    "need_wechatpay_config": true
  }
}
```

若不包含 JSAPI 参数：
- 返回里是 `out_trade_no`（不是其他业务号），并且带 `need_wechatpay_config: true`
- 当前版本**没有**再额外调用某个接口来拿可支付参数（因为商户配置未接入，后端暂时只返回占位）
- 你们用于联调的下一步是模拟支付回调并轮询状态：
  - 调用：`POST /api/v1/market/pay/callback`（不走 JWT）
  - 再调用：`GET /api/v1/market/payments/status?order_no=xxx` 确认订单进入已支付状态

### 7.2 `GET /api/v1/market/payments/status?order_no=xxx` 返回结构与“已支付”判定
接口返回 `data` 里主要状态字段名如下：
- `order_status`
- `pay_status`
- `tx_pay_status`
- 以及：`out_trade_no`、`paid_at`

字段名对照关系：
- “已支付”对应枚举值：
  - `order_status`：`paid`
  - `pay_status`：`paid`
  - `tx_pay_status`：`success`

（也就是说：订单已支付时，至少 `order_status=paid` 且 `pay_status=paid`；更严格可同时校验 `tx_pay_status=success`。）

### 7.3 `GET /api/v1/market/orders/:orderNo` 是否可用于前端展示订单详情
可以用于展示，返回结构为：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "order": { ... },
    "items": [ ... ]
  }
}
```

其中：
- `order`：包含金额、收货信息、订单状态字段（字段名在后端保持为 `order_status` / `pay_status` 等）
  - 金额：
    - `goods_amount`
    - `delivery_fee`
    - `discount_amount`
    - `payable_amount`
  - 收货：
    - `receiver_name`
    - `receiver_phone`
    - `receiver_address`
  - 订单状态：
    - `order_status`（例如 `pending_payment` / `paid` / `cancelled`）
    - `pay_status`（例如 `unpaid` / `paid`）
  - 还有：`remark`、`paid_at`、`cancel_reason`、`cancelled_at`、`expired_at` 等
- `items`：明细列表（字段名包含）
  - `goods_name_snapshot`、`goods_image_snapshot`
  - `unit_price_snapshot`、`quantity`、`amount`

### 7.4 优惠券/折扣（preview 与 create 是否支持优惠券输入）
当前一期实现：**不支持**通过优惠券输入来计算折扣。
- `market/orders/preview`：`discount_amount` 固定按 `0` 计算（请求体未接收优惠券字段）
- `market/orders`：订单创建计算同样使用 `discountAmount=0`

因此建议前端：
- 先关闭/隐藏优惠券减免展示，避免 UI 金额与后端入账/应付金额不一致

---
## 5. 交付后的 BE 下一阶段怎么做（可选，按你们联调反馈决定）
在你们前端页面链路跑通之后，如果还需要增强，我建议后续优先级是：
- 订单过期策略（`pending_payment` 到期自动回补库存）
- 真实微信支付接入（V3 回调验签与下单参数对齐）
- 性能/容量再评估（若你们需要更高并发、且要求超时率更低）

---
## 6. 建议的交付时点
现在就可以交付前端联调。
如果你希望我再补一句“你们这边联调完成后需要再让 BE 确认什么”，我也可以按你们的页面步骤再细化一版清单。
