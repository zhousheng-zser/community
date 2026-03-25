# 本地集市店铺化 FE-BE 沟通纪要（前端视角）  
（供前端 & 后端协同用，后续可持续补充）

## 一、当前整体进度（简要）

- 后端已完成：
  - `MARKET` 相关 7 张核心表的 Model + `db:sync` 建表。
  - 店铺/商品读接口：
    - `GET /api/v1/market/shops`
    - `GET /api/v1/market/shops/:shopId`
    - `GET /api/v1/market/shops/:shopId/categories`
    - `GET /api/v1/market/shops/:shopId/goods`
    - `GET /api/v1/market/goods/:goodsId`
  - 返回统一格式：`{ code, msg, data }`，其中列表接口的 `data` 下包含 `list + 分页信息`。
- 前端已完成：
  - 首页「本地集市」Tab：
    - 已接入 `GET /api/v1/market/shops`，**优先用真实接口数据**，接口异常时自动兜底本地 mock。
  - 店铺详情页 `market-shop`：
    - 已接入：
      - `GET /api/v1/market/shops/:id`
      - `GET /api/v1/market/shops/:id/categories`
      - `GET /api/v1/market/shops/:id/goods`
    - 左右联动分类/商品列表从真实数据构建，接口异常时兜底本地 `SHOP_MAP`。
  - 店铺内购物车：
    - 逻辑为「**优先走服务端购物车接口，失败则自动降级本地购物车**」，待后端补齐购物车接口。
  - 确认页 `goods-confrim`：
    - 从店铺页缓存 `shopId + 选中商品 + 本地总价`。
    - 已预接 `POST /api/v1/market/orders/preview` / `POST /api/v1/market/orders`：
      - **优先走 `market` 新链路**，失败时自动回退到老的 `api/wx/goods_order` 支付流程。

---

## 二、后端当前读接口：前端需要验证的关键点

> 目的：让前端能稳定消费接口，不需要在代码里“猜字段”。

### 1. 列表：`GET /api/v1/market/shops`

**期望结构示例：**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "list": [
      {
        "id": 1001,
        "name": "家家悦连锁超市",
        "category": "超市便利",
        "logo_url": "...",
        "cover_url": "...",
        "delivery_type": "platform",     // or 显示文案
        "delivery_type_text": "邻工秒送",
        "min_order_amount": 20.0,
        "delivery_fee": 3.0,
        "avg_delivery_minutes": 30,
        "sold_count": 890,
        "notice": "欢迎光临..."
      }
    ],
    "page": 1,
    "page_size": 10,
    "total": 50
  }
}
```

**前端会用到的字段：**
- `id`：店铺 ID（跳店铺页用）
- `name`：店铺名（卡片主标题）
- `category`：店铺分类（本地集市顶部类目）
- `delivery_type_text` 或 `delivery_type`：显示「邻工秒送 / 商家自送」等角标
- `min_order_amount` + `delivery_fee`：组装卡片上的「起送￥X 配送费￥Y」
- `sold_count`：显示「已售 N」

> 若实际字段名不同，请在本文第三部分的「字段映射表」处补充/更正。

### 2. 详情：`GET /api/v1/market/shops/:shopId`

**前端依赖字段：**
- `cover_url` / `cover`：顶部大图
- `logo_url` / `logo`：店铺头像
- `name`：店铺名称
- `rating`：评分
- `sold_count`：已售
- `delivery_type_text` / `delivery_type`：配送方式文案
- `business_hours`：营业时间
- `notice`：公告
- `address`：店铺地址
- `contact_phone`：电话
- `contact_name`：联系人
- （选填）`facade_image` / `interior_image` / `license_image`：店铺照片、证照

### 3. 店内分类：`GET /api/v1/market/shops/:shopId/categories`

**期望字段：**
- `category_key`：分类 key（英文 key，用于与商品对应）
- `category_name`：展示文案

前端会映射为：
- `key = category_key`
- `name = category_name`

### 4. 店内商品列表：`GET /api/v1/market/shops/:shopId/goods`

**前端依赖字段：**
- `id` 或 `goods_id`：商品 ID
- `category_key`：所属类目，用于和左侧分类联动
- `name` 或 `goods_name`：商品名称
- `description`：简要描述
- `main_image` / `image`：商品主图
- `price`：现价
- `origin_price` / `old_price`：划线价（可选）
- `sold_count`：销量，用于拼「已售 N」
- `status`：是否在售（前端只展示 `on_sale`）

---

## 三、当前前端使用的字段映射表（需要和后端对齐）

> 若后端字段和下表不一致，建议**按实际返回更新此表**，然后前端一起改映射函数即可。

### 1. 首页「本地集市」店铺卡片（`GET /market/shops`）

| 前端含义          | 当前前端使用字段                         | 建议后端字段（可对照调整）           |
|-------------------|------------------------------------------|--------------------------------------|
| 店铺 ID           | `item.id`                                | `id`                                 |
| 店铺名            | `item.name || item.shop_name`           | `name`                               |
| 店铺分类          | `item.category`                          | `category`                           |
| 配送文案          | `item.delivery_type_text \|\| delivery_type` | `delivery_type_text`（推荐）  |
| 起送价 + 配送费   | `min_order_amount` + `delivery_fee`      | 同左                                 |
| 已售              | `sold_count`                             | 同左                                 |
| 封面图（可选）    | `cover_url`                              | `cover_url`                          |

### 2. 店铺详情头部（`GET /market/shops/:id`）

| 前端含义       | 当前前端使用字段                                        | 建议后端字段       |
|----------------|---------------------------------------------------------|--------------------|
| 店铺封面       | `cover_url \|\| cover`                                 | `cover_url`        |
| 店铺 Logo      | `logo_url \|\| logo`                                   | `logo_url`         |
| 店铺名         | `name \|\| shop_name`                                  | `name`             |
| 评分           | `rating`                                                | `rating`           |
| 已售           | `sold_count`                                           | `sold_count`       |
| 配送方式文案   | `delivery_type_text \|\| delivery_type`               | `delivery_type_text` |
| 营业时间       | `business_hours`                                       | `business_hours`   |
| 公告           | `notice`                                                | `notice`           |
| 地址           | `address`                                               | `address`          |
| 联系人         | `contact_name`                                          | `contact_name`     |
| 联系电话       | `contact_phone`                                         | `contact_phone`    |
| 店铺照片       | `facade_image` / `interior_image`                       | 同左               |
| 证照           | `license_image`                                         | 同左               |

### 3. 店内分类 & 商品（`GET /shops/:id/categories` & `/shops/:id/goods`）

**分类：**

| 前端含义 | 当前使用 | 建议后端字段    |
|----------|----------|-----------------|
| key      | `category_key \|\| key` | `category_key` |
| name     | `category_name \|\| name` | `category_name` |

**商品：**

| 前端含义     | 当前使用字段                                      | 建议后端字段         |
|--------------|---------------------------------------------------|----------------------|
| 商品 ID      | `id \|\| goods_id`                               | `id` 或 `goods_id`   |
| 分类 key     | `category_key \|\| categoryKey`                  | `category_key`       |
| 名称         | `name \|\| goods_name`                           | `name`               |
| 描述         | `description \|\| desc`                          | `description`        |
| 主图         | `main_image \|\| image`                          | `main_image`         |
| 现价         | `price`                                          | `price`              |
| 划线价       | `origin_price \|\| old_price`                    | `origin_price`       |
| 销量         | `sold_count`                                     | `sold_count`         |
| 在售状态     | `status`（前端只展示 `on_sale`）                 | `status`             |

---

## 四、后端建议马上做的优先事项（配合前端已预埋逻辑）

### 1. 购物车接口（T3）

> 前端在 `market-shop` 页已预埋「优先走接口，失败降级本地」逻辑，后端补齐后可无缝接上。

建议接口（REST 版本）：
- `GET /api/v1/market/cart?shop_id=xxx`
- `POST /api/v1/market/cart/items`（加购）
- `PUT /api/v1/market/cart/items/:itemId`（改数量）
- `DELETE /api/v1/market/cart/items/:itemId`（删单条）
- `DELETE /api/v1/market/cart?shop_id=xxx`（清空店铺购物车）

**前端当前占位写法（为兼容早期实现）：**
- 更新数量：`POST market/cart/items/:itemId`（未来希望改为 `PUT`）
- 删除单项：`POST market/cart/items/:itemId/delete`（未来希望改为 `DELETE`）
- 清空：`POST market/cart/clear`（未来希望改为 `DELETE /market/cart?shop_id=`）

> 一旦后端敲定最终接口设计，前端可统一切换到标准 REST 写法，并删除这些兼容分支。

### 2. 预结算 & 创建订单（T4）

> 前端在确认页 `goods-confrim` 已优先尝试走 `market/orders/preview` + `market/orders`，失败时自动回退旧的 `goods_order` 流程。

建议接口：
- `POST /api/v1/market/orders/preview`
  - 入参：`shop_id、items[{goods_id, quantity}]、收货信息（可选）`
  - 出参：`goods_amount、delivery_fee、payable_amount`。
- `POST /api/v1/market/orders`
  - 入参：`shop_id、items[{goods_id, quantity}]、receiver_*、remark、idempotency_key（可选）`
  - 出参：`order_no、order_status（pending_payment）、payable_amount、expired_at`。

**关键点：**
- 在 `orders` 接口内部，要 **再次校验库存和价格**，并在事务里做：
  - 扣库存（防超卖）
  - 写订单主表
  - 写订单明细快照
- 下单失败要整体回滚。

---

## 五、前后端需要一起对齐的约定（请确认）

1. **字段命名是否按上述映射表执行**  
   - 若后端已有字段命名，请在本纪要第三部分直接改为「实际命名」，前端统一跟随。

2. **购物车接口最终形式**
   - 决定是用标准 REST（GET/POST/PUT/DELETE），还是为兼容旧框架全部 `POST`。
   - 确认后，前端一次性改掉当前占位的 `POST .../delete` 之类写法。

3. **订单/支付状态机**
   - 订单状态：`pending_payment / paid / delivering / completed / cancelled / closed`
   - 支付状态：`created / success / failed / closed / refunded`
   - 确认后，前端展示和按钮状态（“去支付”“取消订单”）会严格按这套来。

4. **错误码约定**
   - 建议至少统一以下几类错误码，方便前端做文案：
     - 店铺休息中（例如：`20002`）
     - 商品库存不足（例如：`20012`）
     - 未达到起送价（例如：`20021`）
     - 订单状态不允许当前操作（例如：`20031`）

---

## 六、后续协作方式（建议）

- `backend/MARKET_PROGRESS.md` 继续作为后端进度单一来源。
- 每次接口字段有变更：
  - 后端在 `MARKET_PROGRESS.md` 或本纪要对应表格中补充说明；
  - 前端根据说明调整映射函数（`normalizeMarketShop`、`buildGoodsGroups`、购物车/订单入参等）。
- 联调阶段优先按 `doc/本地集市店铺化_前后端联调测试用例.md` 执行测试用例。
