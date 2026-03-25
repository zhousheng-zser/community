# 本地集市店铺化 FE-BE 沟通纪要（后端视角·第 8 次）

（本次聚焦：**收货地址地图选点、经纬度落库、本地集市「1km 收货地址吸附」与数据库迁移原则**。）

---

## 1. 背景与目标

- **地址管理**（我的 → 个人中心 → 地址管理 → 新增/编辑）：支持 **微信原生 `wx.chooseLocation` 地图选点**，回填省市区与详细地址，并保存 **GCJ-02 经纬度**（与 `wx.getLocation` 一致）。
- **本地集市定位（须严格遵守的四条规则）**：  
  1）**拿不到当前 GPS** → 使用 **默认收货地址** 的经纬度（`pickDefaultOrSingleAddress`：带默认标或仅一条地址）；  
  2）**拿不到 GPS 且无可用默认地址坐标** → `market/shops` **综合排序**，不传用户坐标；  
  3）**拿到 GPS** → 与 **全部已存收货地址**（有经纬度）比对，若 **距最近一条 &lt;1km** → 使用 **该条存储坐标**；  
  4）否则 → 使用 **当前 GPS**。  
  **自动定位**：**每次冷启动**（`App.onLaunch`）清空本地集市相关坐标与 `market_user_location_manual`，随后首页首次需要时 `wx.getLocation` **自动执行一次**；**同一次打开期间**复用已写入 storage 的坐标，**无定时、无 Tab 切换重打 GPS**。**首页「定位」** 地图选点写入 `market_user_location_manual`，本会话内后续列表/分类刷新不会用自动定位覆盖；**下次冷启动**会再次自动定位（手动选点不跨重启保留，除非产品另行约定）。
- **无 GPS 时的回退**：同规则 1–2；默认地址无坐标则无法作为 `user_lat`/`user_lng`。
- **首条地址**：用户 **新建的第一条收货地址** 前端强制 **`isDefault: true`**（弹窗上「设为默认」默认开启），便于与「无 GPS 用默认坐标」一致；后端应落库并保证仅一条默认。
- **与第 7 次纪要区分**：店铺列表 **5km 半径**（`radius_km`）是「店铺相对用户」的展示范围；**1km** 是「用户 GPS 相对收货地址」的吸附阈值，二者职责不同，文档与代码注释中需同时写清。

### 1.1 关于「美团外卖」类逻辑

- 外卖类 App 的 **精确策略未公开**，行业常见做法是：**优先使用用户明确选择的收货点**；在 **接近已保存地址** 时 **减少 GPS 漂移带来的体验问题**。
- **本期约定（GPS 成功时）**：用 **Haversine** 计算当前 GPS 与 **每条**带坐标收货地址的距离，取 **最近一条**；若 **&lt;1km** 则吸附到 **该条存储坐标**，否则用 **GPS**。**GPS 失败时** 才用 **默认地址** 坐标（规则见 §1，与「最近邻吸附」不同）。

---

## 2. 前端实现摘要（已实现于仓库）

| 能力 | 说明 |
|------|------|
| 地图选点 | `pages/address/address`：`chooseRegion` 弹出「地图选点 / 从微信地址导入」；独立入口「地图选点」直接 `wx.chooseLocation` |
| 工具 | `utils/geo.js`：`haversineKm`、`parseRegionFromAddress`、`findNearestAddressWithin`（GPS 成功 &lt;1km）、`getDefaultAddressCoords`（GPS 失败回退默认） |
| 本地集市定位 | `app.js` `onLaunch` 清坐标与 manual；`ensureMarketUserCoordsForList`：§1 四条规则 + 本会话内已有坐标则复用 |
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
