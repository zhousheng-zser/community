# 首页「本地商城」— 商品列表请求与数据库表对照

> **BaseURL：** `https://114.55.167.14:3000/api/v1`
>
> **子分类说明（前端实际值）：**
> - 礼物专区子分类（`gift_sub_category`）：`送长辈` / `送朋友` / `送同事` / `送伴侣`
> - 商城甄选左侧类目（`sidebar_category`）：`食品生鲜` / `家居百货` / `美妆洗护` / `服装箱包` / `数码配件` / `母婴系列` / `传统工艺` / `其他`

| # | 商品列表名 | 对应数据库表 | 请求 URL 示例 |
|---|---|---|---|
| 1 | **爆款专区** | `lg_home_zones` + `lg_home_zone_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=1&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 2 | **礼物专区**（全量） | `lg_home_zones` + `lg_home_zone_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 3 | **礼物专区 > 送长辈** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送长辈&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 4 | **礼物专区 > 送朋友** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送朋友&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 5 | **礼物专区 > 送同事** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送同事&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 6 | **礼物专区 > 送伴侣** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送伴侣&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 7 | **本地商城甄选**（全量） | `lg_home_zones` + `lg_home_zone_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 8 | **商城甄选 > 食品生鲜** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=食品生鲜&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 9 | **商城甄选 > 家居百货** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=家居百货&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 10 | **商城甄选 > 美妆洗护** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=美妆洗护&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 11 | **商城甄选 > 服装箱包** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=服装箱包&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 12 | **商城甄选 > 数码配件** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=数码配件&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 13 | **商城甄选 > 母婴系列** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=母婴系列&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 14 | **商城甄选 > 传统工艺** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=传统工艺&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 15 | **商城甄选 > 其他** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=其他&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 16 | **高佣专区** | `lg_home_zones` + `lg_home_zone_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=4&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 17 | **品牌好货** | `lg_home_channels` + `lg_home_channel_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/channel-products?channel_key=brand_goods&page=1&page_size=80&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 18 | **寻找九州好物**（多Tab） | `lg_home_channels` + `lg_home_channel_tabs` + `lg_home_channel_tab_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/channel-products?channel_key=jiuzhou_haowu&page=1&page_size=80&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 19 | **秋冬好物** | `lg_home_channels` + `lg_home_channel_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/channel-products?channel_key=autumn_winter&page=1&page_size=80&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 20 | **每日上新**（首页展示） | `lg_home_daily_news_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `daily_news` |
| 21 | **热卖 TOP 榜**（首页展示） | `lg_home_top_sales_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `top_sales` |
| 22 | **周期榜单 > 今日主推** | `lg_home_periodic_modules` + `lg_home_periodic_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取 `periodic_modules` 中 `module_name=今日主推` |
| 23 | **周期榜单 > 本周甄选** | `lg_home_periodic_modules` + `lg_home_periodic_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取 `periodic_modules` 中 `module_name=本周甄选` |
| 24 | **Feed > 高佣推荐**（首屏） | `lg_home_feed_modules` + `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取 `feed_modules` 中 `module_name=高佣推荐` |
| 25 | **Feed > 热门好店**（首屏） | `lg_home_feed_modules` + `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取 `feed_modules` 中 `module_name=热门好店` |
| 26 | **Feed > 你可能喜欢**（首屏） | `lg_home_feed_modules` + `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取 `feed_modules` 中 `module_name=你可能喜欢` |
| 27 | **Feed > 高佣推荐**（翻页） | `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/feed-products?module_name=高佣推荐&page=2&page_size=10&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 28 | **Feed > 热门好店**（翻页） | `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/feed-products?module_name=热门好店&page=2&page_size=10&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 29 | **Feed > 你可能喜欢**（翻页） | `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/feed-products?module_name=你可能喜欢&page=2&page_size=10&user_lat=31.166564&user_lng=121.384776&distance_km=5` |

---

## 聚合接口前端分发逻辑（`loadLocalGoodsModules`）

> 第 20~26 行（每日上新 / 热卖榜 / 周期榜单 / Feed 首屏）共用同一次请求：
> ```
> GET /api/v1/local-goods-home/modules?user_lat=...&user_lng=...&distance_km=5
> ```
> 后端一次返回完整 JSON，前端按以下规则拆分到各区块：

### 1. 响应结构（后端需返回）

```json
{
  "data": {
    "daily_news":       [ ...商品数组... ],
    "top_sales":        [ ...商品数组... ],
    "periodic_modules": [
      { "module_name": "今日主推", "goods_list": [ ... ] },
      { "module_name": "本周甄选", "goods_list": [ ... ] }
    ],
    "feed_modules": [
      { "module_name": "高佣推荐", "goods_list": [ ... ], "page": 1, "has_more": true },
      { "module_name": "热门好店", "goods_list": [ ... ], "page": 1, "has_more": false },
      { "module_name": "你可能喜欢", "goods_list": [ ... ], "page": 1, "has_more": true }
    ]
  }
}
```

### 2. 前端分发规则

| 响应字段 | 前端取值方式 | 映射到页面变量 | 显示截取 |
|---|---|---|---|
| `daily_news` | `payload.daily_news \|\| payload.dailyNews` | `pushDailyNews` | **最多取前 4 条** |
| `top_sales` | `payload.top_sales \|\| payload.topSales` | `pushTopSales` | **最多取前 3 条** |
| `periodic_modules[].module_name` | 遍历数组，取每项的 `module_name` 作为 Tab 名 | `pushPeriodicTabs`（Tab 列表） | 全部 |
| `periodic_modules[].goods_list` | 按 `module_name` 存入字典 | `pushPeriodicGoodsDict[tabName]` | 全部 |
| `feed_modules[].module_name` | 遍历数组，取每项的 `module_name` 作为 Tab 名 | `pushFeedTabs`（Tab 列表） | 全部 |
| `feed_modules[].goods_list` | 按 `module_name` 存入字典 | `pushFeedGoodsDict[tabName]` | 全部（首屏） |
| `feed_modules[].has_more` | 按 `module_name` 存入字典 | `feedHasMoreByTab[tabName]` | 控制是否触底加载 |
| `feed_modules[].page` | 按 `module_name` 存入字典 | `feedPageByTab[tabName]` | 记录当前页码 |

### 3. 周期榜单 Tab 切换（不打新接口）

```
用户点击"本周甄选" Tab
  → switchPeriodicTab(idx)
  → tabName = pushPeriodicTabs[idx]           // "本周甄选"
  → newList = pushPeriodicGoodsDict[tabName]  // 从内存字典直接读，无网络请求
  → setData({ pushPeriodicGoods: newList, pushPeriodicActiveTab: idx })
```

### 4. Feed 触底翻页（单独打接口）

```
用户滑到页面底部 onReachBottom
  → activeTab === "本地商城" 且 feedHasMoreByTab[activeFeedTab] === true
  → loadMoreFeedGoods(activeFeedTab)
      → GET /local-goods-home/feed-products
             ?module_name=高佣推荐        ← 当前激活的 Feed Tab 名
             &page=feedPageByTab["高佣推荐"] + 1
             &page_size=10
             &user_lat=...&user_lng=...&distance_km=5
      → 返回 { list, has_more, page }
      → 追加到 pushFeedGoodsDict["高佣推荐"] 末尾
      → 更新 feedPageByTab / feedHasMoreByTab
```

### 5. 全流程所有接口汇总

```
页面 onLoad
  └─ loadLocalGoodsModules()
       └─ GET /local-goods-home/modules           ← 1 次请求，覆盖行 20~26

用户点击金刚区专区
  └─ navigateTo push-goods-list?id=<zone_id>
       └─ GET /local-goods-home/zone-products     ← 行 1~16，各带不同参数

用户点击导购窗频道
  └─ navigateTo push-channel?key=<channel_key>
       └─ GET /local-goods-home/channel-products  ← 行 17~19，各带不同参数

用户 Feed 触底
  └─ loadMoreFeedGoods(activeFeedTab)
       └─ GET /local-goods-home/feed-products     ← 行 27~29，带 module_name 翻页
```
# 首页「本地商城」— 商品列表请求与数据库表对照

> **BaseURL：** `https://114.55.167.14:3000/api/v1`
>
> **子分类说明（前端实际值）：**
> - 礼物专区子分类（`gift_sub_category`）：`送长辈` / `送朋友` / `送同事` / `送伴侣`
> - 商城甄选左侧类目（`sidebar_category`）：`食品生鲜` / `家居百货` / `美妆洗护` / `服装箱包` / `数码配件` / `母婴系列` / `传统工艺` / `其他`

| # | 商品列表名 | 对应数据库表 | 商品数据实际来源表（可查商品详情） | 请求 URL 示例 |
|---|---|---|---|---|
| 1 | **爆款专区** | `lg_home_zones` + `lg_home_zone_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=1&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 2 | **礼物专区**（全量） | `lg_home_zones` + `lg_home_zone_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 3 | **礼物专区 > 送长辈** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送长辈&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 4 | **礼物专区 > 送朋友** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送朋友&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 5 | **礼物专区 > 送同事** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送同事&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 6 | **礼物专区 > 送伴侣** | `lg_home_zone_products` + `lg_home_zone_gift_subcategories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=2&gift_sub_category=送伴侣&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 7 | **本地商城甄选**（全量） | `lg_home_zones` + `lg_home_zone_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 8 | **商城甄选 > 食品生鲜** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=食品生鲜&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 9 | **商城甄选 > 家居百货** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=家居百货&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 10 | **商城甄选 > 美妆洗护** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=美妆洗护&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 11 | **商城甄选 > 服装箱包** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=服装箱包&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 12 | **商城甄选 > 数码配件** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=数码配件&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 13 | **商城甄选 > 母婴系列** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=母婴系列&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 14 | **商城甄选 > 传统工艺** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=传统工艺&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 15 | **商城甄选 > 其他** | `lg_home_zone_products` + `lg_home_zone_sidebar_categories` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=3&sidebar_category=其他&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 16 | **高佣专区** | `lg_home_zones` + `lg_home_zone_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/zone-products?zone_id=4&page=1&page_size=50&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 17 | **品牌好货** | `lg_home_channels` + `lg_home_channel_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/channel-products?channel_key=brand_goods&page=1&page_size=80&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 18 | **寻找九州好物**（多Tab） | `lg_home_channels` + `lg_home_channel_tabs` + `lg_home_channel_tab_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/channel-products?channel_key=jiuzhou_haowu&page=1&page_size=80&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 19 | **秋冬好物** | `lg_home_channels` + `lg_home_channel_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/channel-products?channel_key=autumn_winter&page=1&page_size=80&user_lat=31.166564&user_lng=121.384776&distance_km=5` |
| 20 | **每日上新**（首页展示） | `lg_home_daily_news_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `daily_news` |
| 21 | **热卖 TOP 榜**（首页展示） | `lg_home_top_sales_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `top_sales` |
| 22 | **周期榜单**（首页多Tab） | `lg_home_periodic_modules` + `lg_home_periodic_module_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `periodic_modules` |
| 23 | **底部 Feed 分类**（首页首屏） | `lg_home_feed_modules` + `lg_home_feed_module_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `feed_modules` |
| 24 | **底部 Feed 分类**（翻页） | `lg_home_feed_module_products` + `market_shops` | `market_goods` | `https://114.55.167.14:3000/api/v1/local-goods-home/feed-products?module_name=高佣推荐&page=2&page_size=10&user_lat=31.166564&user_lng=121.384776&distance_km=5` |

---

> **注意：** 第 20~23 行（首页上新/热卖/周期/Feed首屏）共用同一个聚合接口 `/local-goods-home/modules`，后端一次返回所有模块数据，前端按字段名分发到各展示区块。
>
> **补充：** 当前后端 `localGoodsHomeController` 在组装各列表时，商品主数据统一从 `market_goods` 查询（并联查 `market_shops` 做门店状态/距离过滤）；`lg_home_*` 系列表主要用于“编排关系与排序”。
