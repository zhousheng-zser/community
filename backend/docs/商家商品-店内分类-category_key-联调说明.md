# 商家商品 · 店内分类（category_key）前后端联调说明

> 线上已部署，**未新增任何数据库表**。商品归属店内分类使用既有字段与表。

## 一、数据模型（既有，无需迁移）

| 表 | 作用 |
|----|------|
| `market_shop_categories` | 店铺内分类定义（`category_key` + `category_name`） |
| `market_goods` | 商品；每条商品通过 **`category_key`** 挂在某一店内分类下 |

关系：同一 `shop_id` 下，`market_goods.category_key` 应等于 `market_shop_categories.category_key` 之一（未配置分类时可用默认值 `local`）。

**不要**使用 `merchant_goods` 表（与本需求无关，线上也不应建该表）。

---

## 二、商家工作台 · 商品接口（已支持 category_key）

基础路径：`/api/v1/market/merchant`  
鉴权：Header `Authorization: Bearer <merchant_token>`（或联调环境约定方式）

统一响应：`{ code: 0, msg: 'ok', data: ... }`（失败时 `code`/`errno` 非 0）

### 1. 新建商品

`POST /market/merchant/goods`

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` 或 `title` | 是 | 商品名称 |
| `price` | 是 | 售价，数字 |
| `category_key` | 否 | 店内分类 key，默认 **`local`**；兼容传 `category`（同义） |
| `stock` / `safe_stock` | 否 | 库存、安全库存 |
| `main_image` / `image` | 否 | 主图 URL |
| `description` | 否 | 描述 |
| `sort_order` | 否 | 排序，默认 0 |
| `on_shelf` / `published` / `is_published` / `status` | 否 | 是否上架；`status=on_sale` 表示上架 |

**请求示例**

```json
{
  "name": "土鸡蛋 30枚",
  "category_key": "local",
  "price": 39.9,
  "stock": 100,
  "safe_stock": 10,
  "on_shelf": true
}
```

**响应 `data.goods` 含** `category_key`（及 `id`、`name`、`price`、`stock`、`status` 等）。

### 2. 编辑商品

`PATCH /market/merchant/goods/:id`

可更新字段含：`title`/`name`、`price`、`stock`、`safe_stock`、`main_image`、`description`、`sort_order`、**`category_key`**（或 `category`）。

### 3. 商品详情 / 列表

- `GET /market/merchant/goods/:id` → `data.goods.category_key`
- `GET /market/merchant/goods` → `data.list[].category_key`
- 列表筛选：`GET /market/merchant/goods?category_key=snack&page=1&limit=20`

---

## 三、用户端 · 店内分类与商品（只读，供下拉/Tab）

获取某店店内分类列表：

`GET /api/v1/market/shops/:shopId/categories`

返回数组项示例：`{ category_key, category_name, sort_order, ... }`

按分类拉商品（C 端店铺页）：

`GET /api/v1/market/shops/:shopId/goods?category_key=snack&page=1&page_size=20`

---

## 四、前端对接建议

1. **发布/编辑页**：先调 `GET /market/shops/{当前 shopId}/categories` 渲染分类下拉；选中项的 `category_key` 写入创建/更新 body。
2. **未配置分类的店**：`category_key` 传 `local` 或不传（后端默认 `local`）。
3. **编辑页**：`GET /market/merchant/goods/:id` 回填 `category_key`；保存时 `PATCH` 带上 `category_key`。
4. **商品列表 Tab**：工作台列表可用 `?category_key=` 筛选；展示名称需用 categories 接口把 key 映射为 `category_name`。
5. **字段别名**：创建/更新时 `category` 与 `category_key` 等价，推荐统一用 **`category_key`**。

---

## 五、与运营后台的差异

运营后台商品维护若走 `admin` 侧接口，字段名同为 `category_key`（表仍为 `market_goods`）。商家工作台仅操作本店 `shop_id` 下数据。

---

## 六、常见问题

| 现象 | 说明 |
|------|------|
| 传了 category_key 但 C 端分类 Tab 无商品 | 确认 `market_shop_categories` 中已有同 key，且商品 `status=on_sale` |
| 详情里没有 category_key | 需后端已重启；确认请求的是 `/market/merchant/goods` 而非旧 mock |
| 是否需要改表 | **不需要**；`market_goods.category_key` 线上已存在 |

---

文档版本：2026-05-17（商家工作台 `merchantPortalController` + `market_goods`）
