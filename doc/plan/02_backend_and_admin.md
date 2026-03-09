# 第二阶段：后端架构与管理系统开发指导

目前小程序内部充斥的 `index.js` 等所有的商品展示、达人推介视频，全部采用硬编码（Hardcode）的假数据数组实现。
在此全栈进阶阶段，我们将由 **Node.js (如 Express/Koa 或 NestJS 框架)** 接管一切内容的分发。

## 1. Node.js API 网关重构路线

1. **项目模块化分离**
   - 建立 `routes`：分类划分如 `/api/user/*`、`/api/goods/*`、`/api/feed/*`、`/api/order/*`。
   - 建立 `controllers`：处理来自小程序的网络请求，进行参数验证。
   - 建立 `services`：专门写连库 SQL 或 ORM 逻辑（如 Sequelize / Prisma 的读写查询）。
2. **鉴权机制 (Token JWT)**
   - 后端切不可信任前端传来的用户 ID。所有涉及买卖、提款的接口（如 `/api/order/create`）均应当要求拦截校验 `Authorization: Bearer <token>`。
   - 这里的 Token 是在“微信静默登录”环节换取生成的。

## 2. 小程序前端 Request 改造

- 在微信小程序的 `utils/util.js` 或封单独的 `request.js` 工具：
  ```javascript
  // 伪代码示例：
  wx.request({
    url: 'https://您的域名.com/api/goods/list?page=1&type=hot',
    header: { 'Authorization': wx.getStorageSync('token') },
    success: (res) => { ... }
  })
  ```
- **核心任务**：把首页、各个列表页中的 `data: { pushFeedGoods: [...] }` 这种假变量通通干掉！替换成 `onLoad` 时去 `util.request('/api/goods')` 把真实的数据库商品拉到本页 `setData` 渲染。

## 3. Web 后台管理系统 (Admin UI) 开发

此管理系统主要供运营与店长使用（PC 端浏览器登陆）。建议采用 **Vue3 + Element Plus** 或 **React + Ant Design** 框架构建。

### 必做后台模块：
1. **控制面板 Dashboard**：查看今日流水、新增买家、待提现审核。
2. **商品与库存管理中心**：发布一个新商品，设定其总价格与`佣金比例（如 10%）`，并上传头图至云端（OSS）。点击上架后，即刻展示在小程序的瀑布流中。
3. **资金下发审核面板 (财务)**：带货达人申请体现100元，财务在此点同意并利用支付 API 完成放款。
4. **视频动态审查平台**：对用户发在社区的 UGC 视频进行内容风控与展示开关。
