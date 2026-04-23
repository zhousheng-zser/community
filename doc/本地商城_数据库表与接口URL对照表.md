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
| 22 | **周期榜单**（首页多Tab） | `lg_home_periodic_modules` + `lg_home_periodic_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `periodic_modules` |
| 23 | **底部 Feed 分类**（首页首屏） | `lg_home_feed_modules` + `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/modules?user_lat=31.166564&user_lng=121.384776&distance_km=5` → 取返回字段 `feed_modules` |
| 24 | **底部 Feed 分类**（翻页） | `lg_home_feed_module_products` + `shop_products` + `market_shops` | `https://114.55.167.14:3000/api/v1/local-goods-home/feed-products?module_name=高佣推荐&page=2&page_size=10&user_lat=31.166564&user_lng=121.384776&distance_km=5` |

---

> **注意：** 第 20~23 行（首页上新/热卖/周期/Feed首屏）共用同一个聚合接口 `/local-goods-home/modules`，后端一次返回所有模块数据，前端按字段名分发到各展示区块。
