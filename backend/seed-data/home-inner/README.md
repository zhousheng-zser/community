# 内层「首页」Tab 样例数据包

本目录 JSON 与小程序 `pages/index`、`pages/tidy-service` 中**曾使用的假数据**一一对应，供主社区 Node 服务（含 `sequelize`、`Categories`/`Services`/`Banners` 等表）导入。

## 使用方式

1. 在**已配置 MySQL 且存在 `src/models`** 的社区后端根目录执行（路径按实际仓库调整）：
   ```bash
   node seed_service_groups.js
   ```
2. `seed_service_groups.js` 会合并本目录下的 **`service_groups_extra.json`**（6 个分组），与脚本内建的 `tidy` / `urgent_fix` / `beauty_home` 共 9 类对齐 `tidy-service?key=`。

## 文件列表

| 文件 | 用途 |
|------|------|
| `service_groups_extra.json` | 家电清洗、开荒保洁、除螨、家具养护、宝宝家事、房屋修缮 → `Categories` + `Services` |
| `banners_home_inner.json` | 内层首页轮播 → `Banners`（需配合 `seed_banners_example.sql` 或后续脚本） |
| `neighborhood_assist.json` | 邻里帮帮入口 → 暂无固定表，见映射文档 |
| `home_category_nav.json` | 九宫格导航元数据（图标路径）→ 可运营表或继续前端静态 |
| `workers_seed.json` | 直约技工演示 → `Workers` 表（若存在） |
| `featured_goods_seed.json` | 管家精选演示 → `Goods` / `shop_products`（按主站商品模型选一种） |
| `hot_rank_sales_hint.json` | 热卖榜排序建议（`sales_count`）→ 更新已有 `Services` 行 |

详细字段级映射见：`doc/内层首页_样例数据包与数据库映射.md`。
