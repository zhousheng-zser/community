# 本地集市店铺化 FE-BE 沟通纪要（后端视角·第 6 次）

（本次聚焦：**从虚拟/联调支付切换为微信小程序真实支付**，并明确后端任务、**接口响应约定**与验收标准；**可直接转发后端同事**。）

---

## 1. 背景与目标

第 5 次纪要中，为联调方便增加了 `POST /api/v1/market/payments/mock-success` 等能力，解决了「订单长期 unpaid」的阻塞问题。

**现产品与技术决策：本地集市正式链路必须走微信真实收银台**，用户完成付款后由微信支付回调驱动订单状态，不再依赖「仅创建支付单 + 前端空轮询等待模拟成功」的方式。

**目标：**

- 小程序端使用 `wx.requestPayment` 拉起**微信支付官方收银台**。
- 后端在 `payments/create` 返回**真实 JSAPI 调起参数**；支付结果以**服务端回调验签 + 幂等更新**为准。
- 开发/测试环境可保留 `mock-success` 做辅助；**生产环境不得以 mock 替代真实支付**。

---

## 2. 前端侧已对齐的行为（供后端对照）

> 更细的字段说明见：`doc/本地集市_真实微信支付接入说明.md`  
> 支付公共逻辑实现：`utils/marketPay.js`（含**递归解析**嵌套的 `wx_pay_params` / `payment` 等）。

1. 下单成功后调用：`POST /api/v1/market/payments/create`，body：`{ "order_no": "<订单号>" }`。
2. 若 `code !== 0`：前端提示 `msg`，必要时跳转订单详情。
3. **临时虚拟支付**（与 `API_DOC.md` **12.4** 一致）：若 `virtual_pay === true`，或 `pay_mode` 为 `virtual` / `mock`：前端 **不调用** `wx.requestPayment`（占位五参不能调起真收银台）；提示「开发联调：虚拟支付（未调起微信收银台）」并轮询 `payments/status` 直至确认或超时。
4. **真实支付**：`virtual_pay === false` 且 `pay_mode` 为 `wechat`（或非虚拟）时，从 `data` 解析五参数后调用 `wx.requestPayment`；成功/失败后再轮询 `payments/status` 兜底。
5. 若**非虚拟**且**未解析到**完整 JSAPI 五参数：提示「未获取到微信支付参数，请检查后端支付配置」。

**结论：** 真支付场景下，后端须返回可拉起收银台的五参数；无商户配置时的虚拟模式由后端返回 `virtual_pay: true`，前端走轮询完成联调展示（详见 12.4）。

---

## 3. 重要：订单查询接口 ≠ 支付参数（易混淆）

| 接口 | 是否包含 JSAPI 五参数 |
|------|------------------------|
| `GET /api/v1/market/orders/:orderNo` | **否**，仅订单与明细，用于展示。 |
| `POST /api/v1/market/payments/create` | **是**，此处才应返回调起微信支付所需字段。 |

**联调排查时**：若用户只贴了「订单详情 JSON」，无法判断支付问题；请后端用 **curl / Postman / 日志** 自查 `payments/create` 的响应体。

---

## 4. `POST /api/v1/market/payments/create` 响应约定（请后端严格对齐）

### 4.1 统一外层结构

建议与项目现有风格一致：

```json
{
  "code": 0,
  "msg": "ok",
  "data": { }
}
```

- `code !== 0` 时：必须带明确 `msg`（如统一下单失败、未配置微信支付、openid 缺失、金额不合法等）。

### 4.2 `data` 内必须能被前端解析出的「五参数」

以下字段名 **大小写/蛇形** 前端均做了兼容；**五元组必须齐全**：

| 字段 | 说明 |
|------|------|
| `timeStamp` | 字符串 |
| `nonceStr` | 随机串 |
| `package` | 形如 `prepay_id=...`；若仅返回 `prepay_id`，前端会尝试拼接为 `prepay_id=xxx` |
| `signType` | 如 `RSA` |
| `paySign` | 签名 |

### 4.3 推荐放置位置（任选其一，前端已递归兼容多层嵌套）

为减少歧义，**推荐优先**把五参数放在 **`data.wx_pay_params`** 下（或与贵司已在 `marketPaymentController` 中实现的 `wx_pay_params` / `jsapi` 等保持一致）。

**示例 A（推荐）：`wx_pay_params` 在 `data` 下一层**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "order_no": "MK202603211514325779",
    "out_trade_no": "MKPAY_xxx",
    "virtual_pay": false,
    "pay_mode": "wechat",
    "wx_pay_params": {
      "timeStamp": "1711000000",
      "nonceStr": "xxxx",
      "package": "prepay_id=wx...",
      "signType": "RSA",
      "paySign": "xxxxx"
    }
  }
}
```

**示例 B：蛇形别名（与示例 A 等价，前端同样支持）**

```json
"wx_pay_params": {
  "time_stamp": "1711000000",
  "nonce_str": "xxxx",
  "package": "prepay_id=wx...",
  "sign_type": "RSA",
  "pay_sign": "xxxxx"
}
```

**示例 C：若业务上多包一层（前端会递归查找）**

```json
"data": {
  "payment": {
    "wx_pay_params": { "timeStamp": "...", "nonceStr": "...", "package": "...", "signType": "RSA", "paySign": "..." }
  }
}
```

请后端在定稿后把 **真实联调通过的一例 JSON**（可打码 `paySign`）发给前端，写入联调用例。

### 4.4 业务错误码（与当前后端实现对齐，供前端展示）

| code | 含义（示例） |
|------|----------------|
| 20045 | 统一下单失败等（`msg` 说明原因） |
| 20046 | 金额 ≤ 0 等当前不允许发起支付（与产品「0 元是否免支付」待定一致） |

（具体以贵司 `API_DOC.md` / 实现为准；**务必返回可读 `msg`**。）

---

## 5. 生产环境变量（后端配置，前端仓库不存放密钥）

以下由**部署环境**配置，与微信小程序 **AppID**、商户平台 **支付授权目录/回调 URL** 一致：

| 变量 | 说明 |
|------|------|
| `WX_PAY_APPID` 或 `WECHAT_APPID` | 小程序 AppID（须与小程序工程 `appid` 一致） |
| `WX_PAY_MCHID` | 商户号 |
| `WX_PAY_SERIAL_NO` | 商户 API 证书序列号 |
| `WX_PAY_API_V3_KEY` | 32 位 APIv3 密钥 |
| `WX_PAY_PRIVATE_KEY_PATH` 或 `WX_PAY_PRIVATE_KEY` | 商户 API 私钥 PEM |
| `WX_PAY_NOTIFY_URL` | **HTTPS**，与微信商户平台配置的回调一致，如 `https://域名/api/v1/market/pay/callback` |

**说明：** `mock-success` 仍为**非生产**可用；生产 **403** 策略不变。0 元订单若返回 `20046`，与纪要「需产品确认」一致。

---

## 6. 请后端同事完成的任务（任务清单）

### 任务 A：微信支付商户与小程序配置（基础设施）

| 序号 | 工作项 | 说明 |
|------|--------|------|
| A1 | 确认商户号、小程序 AppID 绑定关系 | 与财务/运营确认收款主体；小程序与商户号需在商户平台完成关联。 |
| A2 | API 证书与密钥 | 若使用微信支付 **V3**：配置商户 API 证书、平台证书拉取/更新策略、APIv3 密钥。 |
| A3 | 支付回调 URL | 在微信商户平台配置「支付回调通知」地址，与后端实际路由一致（如 `POST /api/v1/market/pay/callback`），**外网可访问、HTTPS**（按微信要求）。 |
| A4 | 沙箱/正式环境区分 | 开发联调可用测试商户；上线前切生产商户号与正式回调。 |

**产出：** 环境变量或配置清单（不落库密钥到代码仓库），以及「回调 URL」已配置的确认。

---

### 任务 B：`POST /api/v1/market/payments/create` 接入真实 JSAPI

| 序号 | 工作项 | 说明 |
|------|--------|------|
| B1 | 统一下单（JSAPI） | 使用微信支付 V3「小程序下单」`/v3/pay/transactions/jsapi`，传入：`out_trade_no`、金额（分）、`openid`、商品描述等，获取 `prepay_id`。 |
| B2 | 生成调起支付参数 | 生成小程序调起支付所需字段（V3 一般为 RSA：`timeStamp`、`nonceStr`、`package`、`signType`、`paySign`）。 |
| B3 | 响应体 | 成功时 `code === 0`，且 `data` 内按 **第 4 节** 返回五参数；建议同时返回 `virtual_pay: false`、`pay_mode: wechat`。 |

**产出：** 真机出现**微信官方支付弹窗**，且能支付成功；**请勿仅返回 `out_trade_no` 而无五参数**。

---

### 任务 C：支付回调 `POST /api/v1/market/pay/callback`

| 序号 | 工作项 | 说明 |
|------|--------|------|
| C1 | 验签 | 带 `Wechatpay-Signature` 等头时按 **V3** 验签；`express.raw` 保留原文避免验签失败。 |
| C2 | 解密 | AES-256-GCM 解密 `resource`（按微信文档）。 |
| C3 | 幂等 | 同一笔支付多次通知只更新一次。 |
| C4 | 落库 | `market_orders` / `market_pay_transactions` 等与约定状态机一致。 |
| C5 | 应答 | HTTP 200 + 微信要求的成功体（如 `{"code":"SUCCESS","message":"成功"}`）。 |
| C6 | 联调兼容 | 无微信头时可保留 `PAY_CALLBACK_SECRET` HMAC 等旧联调方式（按现实现）。 |

**产出：** 真机支付后**不依赖** `mock-success`，订单与流水为已支付。

---

### 任务 D：查询类接口与错误码

| 序号 | 工作项 | 说明 |
|------|--------|------|
| D1 | `GET /api/v1/market/payments/status` | 与回调结果一致；前端轮询兜底。 |
| D2 | `payments/create` 失败 | 返回明确 `code` + `msg`。 |

---

### 任务 E：联调专用与文档

| 序号 | 工作项 | 说明 |
|------|--------|------|
| E1 | `mock-success` | **仅非生产**；生产 403。 |
| E2 | 文档 | 更新 `API_DOC.md` 本地集市支付相关章节（如 12.4）；与 **第 4 节** 响应示例一致。 |
| E3 | `.env.example` | 已补充 `WX_*` 的，保持与线上一致说明。 |

---

## 7. 建议排期

1. **P0**：任务 A + B（否则小程序无法真实付款）。  
2. **P0**：任务 C（否则支付成功但订单不更新）。  
3. **P1**：任务 D、E 与监控对账。

---

## 8. 联调验收清单（后端自检 + 与前端共同确认）

- [ ] `POST /payments/create` 在 `code === 0` 时，`data` 内（含允许嵌套）可解析出完整 JSAPI 五参数。  
- [ ] 用 curl/日志核对响应，**不要仅用** `GET /orders/:id` 判断支付是否配置成功。  
- [ ] 真机能拉起微信支付并完成付款。  
- [ ] 支付完成后，不调用 `mock-success`，`payments/status` 与订单详情均为已支付。  
- [ ] 用户取消支付：订单仍为待支付。  
- [ ] 回调重复投递：不产生重复记账。  
- [ ] 生产：`mock-success` 不可用；`WX_PAY_NOTIFY_URL` 与商户平台一致。

---

## 9. 后端自助排查（当前「未获取到微信支付参数」时）

1. 查 **`POST /api/v1/market/payments/create`** 的响应：是否为 `code:0`？`data` 下是否有五参数或 `wx_pay_params`？  
2. 查服务端日志：统一下单是否成功、`openid` 是否有效、商户号/AppID 是否匹配。  
3. 查环境变量是否已在**运行环境**生效（非仅本地 `.env`）。  
4. 将 **一则成功响应的 JSON 样例**（打码签名）发给前端归档。

---

## 10. 需要后端回复前端的确认项

1. 真实支付上线**目标日期**或迭代。  
2. `payments/create` **最终响应 JSON 示例**（含嵌套路径），与线上一致。  
3. **0 元订单**是否免调支付：最终业务规则与接口约定（当前前端对 0 元未默认跳过支付；若返回 `20046` 为预期）。  

---

## 11. 与前序纪要的关系

- **第 5 次**：联调补洞（`mock-success`、轮询）。  
- **第 6 次（本文）**：正式链路 = **V3 真实 JSAPI + 回调验签**；并补充 **响应体嵌套约定**与排查说明。  

前端侧说明：`doc/本地集市_真实微信支付接入说明.md`。

---

*文档维护：前端发起 · 第 6 次 · 主题：本地集市切换真实微信支付（可直接转发后端）*
