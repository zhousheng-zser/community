# wx-jzfw
一个基于微信小程序开发的家政服务平台
## 应用技术
微信小程序
## 主要功能
- 用户：登录、下单、订单、优惠券、支付、地址管理、推荐
- 零工：登录、接单、订单、提现、推荐
- 管理员：登录、派单、订单

## 后端部署到 114 服务器（惠民卡接口）

1. 项目根目录执行 `npm install`（已含 `deploy:backend` 所需依赖）。
2. PowerShell 示例：

```powershell
$env:DEPLOY_SSH_PASSWORD = "你的SSH密码"
$env:DEPLOY_RESTART_CMD = "pm2 restart all"   # 按你服务器实际进程改
# 可选：灌库
# $env:DEPLOY_RUN_SEED = "1"
npm run deploy:backend
```

3. 若远端目录不是默认的 `/root/community-backend/backend`，设置 `REMOTE_BACKEND_DIR`。
4. 首次需在服务器 MySQL 执行 `backend/sql/seed_benefit_bootstrap.sql` 或 `npm run seed:benefit`（在服务器 `backend` 目录）。

**安全说明**：`deploy_img.js` 已改为使用环境变量 `DEPLOY_SSH_PASSWORD`，勿把密码写进仓库。

<!-- [开发阶段] 以下内容仅供参考，当前开发阶段请以 doc/项目开发参考.md 为准
线上若仍为 `Cannot GET /api/v1/jd/...`：当前 3000 端口是**另一套社区主 API**（本仓库无其源码）。请按 **`doc/惠民卡_线上对接.md`**：Nginx 反代到 **`backend` + `pm2 start ecosystem.benefit.pm2.cjs`（3001）**，或在主 `app` 中 `require` **`backend/src/mountBenefitAlliance.js`**。
-->

