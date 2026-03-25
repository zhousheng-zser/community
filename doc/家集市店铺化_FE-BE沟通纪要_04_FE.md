# 本地集市店铺化 FE-BE 沟通纪要（前端视角·第 4 次）

（用于记录：前端已做了哪些接入、联调现象是什么、后端需要补齐什么、如何验证、以及最终约定。）

---

## 1. 前端已做的接入 & 当前联调状态

### 1.1 本地集市首页：切分类 -> 请求店铺列表
- 前端在 `pages/index/index.js + pages/index/index.wxml` 中完成了“分类 code 映射”，避免后端按 `AAAA~AAAJ` 过滤时，前端误把中文展示名当作 `category` 入参导致 `list: []`。
- 切分类时前端请求：
  - `GET /api/v1/market/shops?category=<code>&page=1&page_size=30`
- 若接口失败，前端会兜底使用本地 mock 数据（仅用于展示不中断）。

### 1.2 店铺页：购物车（已对齐 REST）
- `pages/market-shop/market-shop.js`
- 购物车读取/写入走 REST 标准：
  - `GET /api/v1/market/cart?shop_id=xxx`
  - `POST /api/v1/market/cart/items`
  - `PUT /api/v1/market/cart/items/:itemId`（quantity=0 视为删除）
  - `DELETE /api/v1/market/cart/items/:itemId`
  - `DELETE /api/v1/market/cart?shop_id=xxx`

### 1.3 确认页：禁用优惠券 + 临时填充地址
- `pages/goods-confrim/goods-confrim.js + .wxml`
- 市场（market）交易流程不支持优惠券输入（BE 纪要已说明），因此前端在 market 路径下：
  - 不拉取/不展示优惠券
  - `discountMoney = 0.00`
  - `realPayMoney = totle`
- 为了联调快速跑通：
  - `from=local` 调试入口里临时填充 `address`，避免被“请选择服务地址”拦截。

### 1.4 下单 & 支付轮询 & 订单详情展示
- 下单：
  - `POST /api/v1/market/orders`
  - 若后端返回 `{ code: 20012, msg: '库存不足...', data: null }` 等错误，前端会弹 `msg` 并中断流程（已修复）。
- 支付联调（一期策略）：
  - `POST /api/v1/market/payments/create` 可能为占位，不一定返回 JSAPI 参数
  - 前端统一轮询：
    - `GET /api/v1/market/payments/status?order_no=<order_no>`
  - 一旦满足“已支付判定”，前端会：
    - `redirectTo` 到订单详情页
- 新增订单详情页（用于联调证据直观展示）：
  - `pages/market-order-detail/market-order-detail`
  - 展示：
    - `GET /api/v1/market/orders/:orderNo` 返回的 `data.order + data.items`
  - 并对 `order_status/pay_status` 做“状态自动刷新”（减少回调稍晚造成页面滞留问题）。

---

## 2. 联调中出现的现象（关键证据）

### 2.1 下单成功（有 order_no），但支付状态一直是 unpaid
你前端观测到的最新 `payments/status` 返回如下（已确认字段名）：

`GET /api/v1/market/payments/status?order_no=MK202603200143264050`

返回：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "order_no": "MK202603200143264050",
    "order_status": "pending_payment",
    "pay_status": "unpaid",
    "tx_pay_status": "created",
    "out_trade_no": "MKPAY_MK202603200143264050_1773942206373_274275",
    "paid_at": null
  }
}
```

结论：
1. 后端创建订单成功：`order_no` 存在
2. 但回调链路没有把这单置为 paid：`order_status=pending_payment`、`pay_status=unpaid`、`paid_at=null`
3. `tx_pay_status=created` 表示支付流水仍处在 created 状态

### 2.2 大量 304 Not Modified 不影响结论
- 你抓到的请求状态里多次出现 `304 Not Modified` 是缓存行为；
- 但返回 JSON 中明确仍是 `unpaid/pending_payment`，因此不是前端“读不到新数据”的问题，而是后端未更新。

---

## 3. 后端需要做什么（必须补齐的点）

请后端针对上面这单（至少针对一笔联调单）确认并补齐以下能力：

### 3.1 确保回调处理能正确命中这笔订单/流水
回调应该按一期模拟回调策略把以下字段转为 paid：
- `market_pay_transactions.pay_status` -> `success`（或与 BE 口径的 success 一致）
- `market_orders.order_status` -> `paid`
- `market_orders.pay_status` -> `paid`
- 写入 `market_orders.paid_at`

并且保证：
- 同一 `out_trade_no` 的回调重复触发：幂等短路，不会重复改状态。

### 3.2 如果目前还没有“可验证的模拟回调触发方式”，请提供
前端目前策略是“轮询等待状态变为 paid”。
为了让联调推进，请后端提供一种可触发方式（任一即可）：
1. 提供脚本/工具：用 `out_trade_no` 触发回调处理
2. 提供一个开发环境专用接口（或文档里明确 `POST /api/v1/market/pay/callback` 的 body 模板）
3. 在 BE 的 `MARKET_PROGRESS.md / 市场回调模拟脚本` 中给出可执行命令和参数

联调使用的 `out_trade_no`（以本次证据中的为例）：
- `MKPAY_MK202603200143264050_1773942206373_274275`

后端只要在回调执行后，确认再次请求：
- `GET /api/v1/market/payments/status?order_no=MK202603200143264050`
必须看到：
- `order_status=paid`
- `pay_status=paid`
- `tx_pay_status=success`
- `paid_at!=null`

---

## 4. 如何验证（FE 可执行 & BE 自检）

### 4.1 FE 联调验证步骤（建议按顺序）
1. 首页点击某店铺 -> 店铺页加购 -> 去结算 -> goods-confrim 提交订单
2. 观察前端轮询：
   - `GET /api/v1/market/payments/status?order_no=<order_no>` 最终应转为 paid
3. 若跳到订单详情页（market-order-detail）：
   - 展示 `order_status/pay_status` 必须与 BE 状态一致

### 4.2 BE 自检步骤（建议）
1. 订单创建成功后，拿到：
   - `order_no`
   - `out_trade_no`
2. 触发模拟回调（按 BE 目前提供的方式）
3. 回调后立刻再查：
   - `GET /api/v1/market/payments/status?order_no=<order_no>`
4. 若仍是 unpaid：
   - 检查回调里查找 `market_pay_transactions` 的唯一键是 `out_trade_no` 还是其他字段
   - 检查是否写入了正确的字段枚举值（paid/success/unpaid/created 等）

---

## 5. 最终约定（双方统一口径，减少反复改动）

### 5.1 分类 code 映射约定
- 前端切分类使用 `code`（`AAAA~AAAJ`）
- 前端展示用 `name`（中文）
- 后端接口过滤使用 `category` 的 code 值
- 若后端 code->name 映射顺序与前端不同：
  - 请在 BE/FE 文档或种子数据里明确映射表
  - FE 将按表更新 `marketTopCats` 的 code 分配

### 5.2 市场交易优惠券约定
- market 路径 preview/create 不接优惠券计算
- 前端 market 流程隐藏优惠券 UI，避免 UI 与入账金额不一致

### 5.3 支付状态判定约定（前端轮询依据）
- 前端判定“已支付”的最小条件：
  - `order_status=paid` 且 `pay_status=paid`
- 更严格（建议 BE 确保一致）：
  - `tx_pay_status=success` 且 `paid_at!=null`

---

## 6. 本次需要 BE 确认/补齐的结论清单（可逐项勾）
- [ ] 使用本次证据中的 `order_no` / `out_trade_no` 触发回调
- [ ] 回调后 `payments/status` 结果能变为 `paid/paid/success`
- [ ] 回调幂等：重复触发不会重复更新/重复记账
- [ ] 提供明确的模拟回调触发方式或脚本命令（用于联调）
