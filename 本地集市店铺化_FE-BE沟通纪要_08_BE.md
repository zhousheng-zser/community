# 本地集市店铺化 FE-BE 沟通纪要（后端视角·第 8 次）

（本次聚焦：**收货地址地图选点、经纬度落库、本地集市「1km 收货地址吸附」与数据库迁移原则**。）

---

## 1. 背景与目标

- **地址管理**（我的 → 个人中心 → 地址管理 → 新增/编辑）：支持 **微信原生 `wx.chooseLocation` 地图选点**，回填省市区与详细地址，并保存 **GCJ-02 经纬度**（与 `wx.getLocation` 一致）。
- **本地集市定位**：用户首次进入首页需 `wx.getLocation` 取当前位置；若该位置与 **默认收货地址** 的直线距离 **&lt; 1 公里**，则本地集市用于 `market/shops` 请求的 **`user_lat` / `user_lng` 切换为该默认地址坐标**（「吸附」），并在顶部展示简短文案（如区名·标签）。**用户可随时点击首页定位**，通过地图重新选点，覆盖本次吸附结果。
- **无定位时的回退**：若 **未获取到 GPS**（拒绝授权、失败等），则尝试使用 **默认收货地址的经纬度**（若已保存）作为 `user_lat`/`user_lng`。**若既无定位也无带坐标的默认地址**，则请求 **不传用户坐标**，`sort` 固定为 **`comprehensive`（综合排序）**；筛选条在无坐标时不可切到「距离优先」（前端会提示）。
- **与第 7 次纪要区分**：店铺列表 **5km 半径**（`radius_km`）是「店铺相对用户」的展示范围；**1km** 是「用户 GPS 相对收货地址」的吸附阈值，二者职责不同，文档与代码注释中需同时写清。

### 1.1 关于「美团外卖」类逻辑

- 外卖类 App 的 **精确策略未公开**，行业常见做法是：**优先使用用户明确选择的收货点**；在 **接近已保存地址** 时 **减少 GPS 漂移带来的体验问题**。
- **本期约定**：在小程序端用 **Haversine 球面距离** 计算当前 GPS 与 **默认收货地址**（`isDefault` / `is_default`）的距离；若 **&lt; 1km** 且默认地址带经纬度，则吸附到 **该默认地址** 坐标。无默认、默认无坐标、或距离 ≥ 1km → **不吸附**，仍用 GPS。**手动点首页定位选地图** 始终可覆盖当前用于本地集市的坐标。

---

## 2. 前端实现摘要（已实现于仓库）

| 能力 | 说明 |
|------|------|
| 地图选点 | `pages/address/address`：`chooseRegion` 弹出「地图选点 / 从微信地址导入」；独立入口「地图选点」直接 `wx.chooseLocation` |
| 工具 | `utils/geo.js`：`haversineKm`、`parseRegionFromAddress`（粗解析）、`findDefaultAddressWithin` |
| 本地集市吸附 | `pages/index/index.js`：`ensureMarketUserCoordsForList` 内在写入 `market_user_lat/lng` 前调用 `maybeSnapMarketToDefaultAddress` |
| 本地缓存 | `market_snap_address_id`、`market_snap_distance_km`、`market_location_label`（可选） |
| 隐私 | `app.json`：`requiredPrivateInfos` 含 `getLocation`、`chooseLocation` |

---

## 3. 数据库：`user_addresses`（或等价表）

### 3.1 字段（先检查是否存在，再按下方原则处理）

| 字段 | 类型建议 | 说明 |
|------|-----------|------|
| `province` / `city` / `district` | varchar | 省市区 |
| `detail` | varchar | 门牌、楼栋等 |
| `name` / `phone` | varchar | 收货人、手机 |
| `tag` | varchar | 家/公司/学校/其他 |
| `is_default` | tinyint | 是否默认 |
| **`latitude`** | decimal(10,7) 等 | **GCJ-02 纬度**，地图选点写入；无选点可为 NULL |
| **`longitude`** | decimal(10,7) 等 | **GCJ-02 经度** |
| **`location_poi_name`** | varchar(128) 可选 | 地图返回的 POI 名称，便于展示与客服 |

### 3.2 迁移 / 变更原则（写入所有库表变更说明）

1. **先检查字段是否存在**（`INFORMATION_SCHEMA` 或 ORM 迁移脚本中的 `hasColumn` 等价逻辑）。
2. **不存在** → **新增字段**，并补默认值 / NULL 约束说明。
3. **已存在** → **核对语义与类型**是否与本期一致：
   - **合理** → 保留；若仅命名差异，可在 API 层做别名映射，并在文档标注「覆盖含义」。
   - **不合理**（类型错误、坐标系混用等）→ **修改**（需评估线上数据迁移与回滚）。

---

## 4. 接口约定（与 `API_DOC.md` 同步）

- **`GET/POST /api/v1/user/addresses`**：列表与创建/更新 body 需支持 `latitude`、`longitude`、`location_poi_name`（可选）。
- **列表返回**：每条地址若曾地图选点，应带回经纬度，供首页吸附计算（亦可仅服务端算，本期小程序本地算）。

---

## 5. 后端任务清单

| 序号 | 任务 | 验收 |
|------|------|------|
| B1 | `user_addresses` 按 §3 检查并补 `latitude/longitude/location_poi_name` | 迁移可执行、符合 §3.2 原则 |
| B2 | 地址 CRUD 读写上述字段 | 小程序保存后 DB 有值 |
| B3 | 与 `API_DOC.md` 第 8 节地址说明一致 | 文档可查 |

---

## 6. 前端任务清单

| 序号 | 任务 | 验收 |
|------|------|------|
| F1 | 地址页地图选点 + 保存传经纬度 | 真机可选点、Network 可见字段 |
| F2 | 首页无缓存定位时：仅当距「默认地址」&lt;1km 时吸附 | 默认地址有坐标且人在附近时，`market_user_lat/lng` 与默认地址一致 |
| F3 | 用户手动点首页地图选点后覆盖吸附缓存 | `handleLocationTap` 写入坐标并清空 snap 标记 |

---

## 7. 联调要点

- 仅 **默认收货地址** 且 **带有效经纬度** 时可能参与吸附；若用户未设默认或默认无坐标，行为退化为纯 GPS。
- **5km** 店铺筛选与 **1km** 地址吸附 **勿混写** 在同一参数上。

---

*文档维护：前端发起 · 第 8 次 · 主题：地址地图选点 / 收货地址吸附 / 库表与迁移原则*
