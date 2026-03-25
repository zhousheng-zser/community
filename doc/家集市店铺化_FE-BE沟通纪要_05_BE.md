# 本地集市店铺化 FE-BE 沟通纪要（后端视角·第 5 次）

（本次聚焦：支付联调能力补齐，解决“订单一直 unpaid”问题）

---
## 1. 本次背景与目标
前端在联调中反馈：下单后可拿到 `order_no`，但轮询
`GET /api/v1/market/payments/status?order_no=xxx`
长期停留在：
- `order_status = pending_payment`
- `pay_status = unpaid`
- `tx_pay_status = created`

一期当前是“虚拟支付 + 回调模拟”策略，为了避免前端在签名拼接/回调触发上反复卡住，后端新增了一个**开发联调专用接口**，用于稳定把支付状态推进到 `paid`。

---
## 2. 后端新增接口（已上线）
### 2.1 开发联调专用：模拟支付成功
- **URL**：`POST /api/v1/market/payments/mock-success`
- **鉴权**：需要 JWT（`Authorization: Bearer <token>`）
- **环境限制**：生产环境禁用（`NODE_ENV=production` 返回 403）

请求体二选一：
```json
{ "order_no": "MK202603200143264050" }
```
或
```json
{ "out_trade_no": "MKPAY_MK202603200143264050_1773942206373_274275" }
```

成功返回示例：
```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "order_no": "MK202603200143264050",
    "out_trade_no": "MKPAY_MK202603200143264050_1773942206373_274275",
    "order_status": "paid",
    "pay_status": "paid",
    "tx_pay_status": "success",
    "paid_at": "2026-03-20T01:23:45.000Z"
  }
}
```

---
## 3. 联调推荐流程（前端可直接执行）
1. 正常下单：`POST /api/v1/market/orders`
2. 创建支付单：`POST /api/v1/market/payments/create`
3. 调用模拟支付成功：`POST /api/v1/market/payments/mock-success`
4. 前端继续轮询：
   - `GET /api/v1/market/payments/status?order_no=<order_no>`
5. 期望最终状态：
   - `order_status = paid`
   - `pay_status = paid`
   - `tx_pay_status = success`
   - `paid_at != null`

---
## 4. 幂等与安全说明
### 4.1 幂等
对同一 `order_no` / `out_trade_no` 重复调用 `mock-success`：
- 不会重复记账
- 仅保持已支付状态

### 4.2 安全与边界
- 接口需登录态，且校验订单归属（当前用户）
- 生产环境禁用，避免误用

---
## 5. 与正式支付的关系
该接口仅用于一期联调阶段，替代“手工构造签名回调”的复杂度。

后续接入真实微信支付（V3）时：
- 前端仍走 `payments/create`
- 后端改为返回真实 JSAPI 参数（`timeStamp/nonceStr/package/signType/paySign`）
- 状态变更由真实回调链路驱动

---
## 6. 前端同学需要确认的结果清单
- [ ] `payments/create` 后能拿到 `order_no/out_trade_no`
- [ ] 调 `payments/mock-success` 后返回 `paid/success`
- [ ] 轮询 `payments/status` 能稳定转为 `paid/paid/success`
- [ ] 订单详情页状态与支付状态一致
