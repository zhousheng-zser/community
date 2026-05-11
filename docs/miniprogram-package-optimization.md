# 微信小程序包体积优化指南

> 上次问题时间：2026-05-11  
> 主包从 ~2MB 降至 1.36MB

---

## 一、微信小程序包大小限制

| 类型 | 硬限制 | 代码质量建议 |
|------|--------|-------------|
| 主包 | ≤ 2MB（超过无法上传） | ≤ 1.5MB |
| 单个子包 | ≤ 2MB | - |
| 总包 | ≤ 20MB | - |

---

## 二、常见报错与检查项

代码质量扫描中以下三项必须通过才能上传：

1. **主包大小** — 主包尺寸（不含插件）应小于 1.5M
2. **组件按需注入** — 需在 `app.json` 中启用 `lazyCodeLoading`
3. **图片/音频资源** — 单个文件不超过 200K，建议使用 CDN

---

## 三、解决方案清单

### 3.1 启用组件按需注入

在 `app.json` 末尾添加：

```json
{
  "lazyCodeLoading": "requiredComponents"
}
```

效果：未使用的自定义组件不会在页面初始化时加载，减少运行时内存占用。

---

### 3.2 将低频页面移入子包

**原则：** tabBar 页面必须留在主包，其他页面尽量移入子包。

**操作步骤：**

1. 创建子包目录，如 `package-push/pages/push-xxx/`
2. 将页面文件（js/json/wxml/wxss）移入子包目录
3. 从 `app.json` 的 `pages` 数组中移除该页面
4. 在 `app.json` 的 `subPackages` 中注册：

```json
{
  "root": "package-push",
  "name": "push",
  "pages": [
    "pages/push-channel/push-channel",
    "pages/push-goods-list/push-goods-list"
  ]
}
```

5. **修正所有导航路径**：全局搜索 `/pages/push-xxx` 替换为 `/package-push/pages/push-xxx`
6. **修正 require 路径**：子包页面引用根目录模块需多一层 `../`
   - 主包页面：`../../utils/util.js`（2 层到根）
   - 子包页面：`../../../utils/util.js`（3 层到根）

7. 在 `project.config.json` 的 `packOptions.ignore` 中排除旧目录：

```json
{ "type": "folder", "value": "pages/push-channel" }
```

**注意事项：**
- 子包页面可通过绝对路径访问主包资源（如 `/img/xxx.png`）
- 子包之间**不能**互相访问资源
- `wx.navigateTo` 可跨包跳转，无需特殊处理

---

### 3.3 排除非必要文件

在 `project.config.json` → `packOptions.ignore` 中添加不需要打包的文件：

```json
{
  "packOptions": {
    "ignore": [
      { "type": "file", "value": "package-lock.json" },
      { "type": "file", "value": "features.json" },
      { "type": "file", "value": "*.py" },
      { "type": "file", "value": "*.ps1" },
      { "type": "file", "value": "*.sh" },
      { "type": "file", "value": "*.xlsx" },
      { "type": "folder", "value": "scripts" },
      { "type": "folder", "value": "backend" },
      { "type": "folder", "value": "market-portal" },
      { "type": "folder", "value": "service-portal" },
      { "type": "folder", "value": "node_modules" },
      { "type": "folder", "value": ".git" }
    ]
  }
}
```

**易遗漏的大文件类型：**
- `.json` 分析报告（features.json 115KB）
- `.xlsx` 文档
- `.html` 测试页面
- `package-lock.json`（75KB）

---

### 3.4 图片资源优化

| 策略 | 适用场景 |
|------|---------|
| 使用 CDN 网络图片 | 商品图、Banner、用户头像 |
| 本地保留小图标 | tabBar 图标、功能入口 icon（通常 <5KB） |
| 将图片移入使用它的子包 | 仅被某个子包页面引用的图片 |
| 排除未使用的图片目录 | `img/icons`、`img/undraw` 等 |

检查某个图片目录被谁引用：
```bash
rg "market_icons" --glob "*.wxml" --files-with-matches
```

如果只有子包页面引用，可将图片移入该子包目录。

---

## 四、开发阶段预防措施

1. **新增页面前先评估**：主包页面数量应尽量控制在 20 个以内
2. **图片一律用 CDN**：本地只保留 tabBar 图标等必要小文件
3. **定期检查包大小**：上传前在开发者工具"详情→本地设置"中查看各包体积
4. **根目录保持干净**：测试脚本、文档、分析文件放在已排除的目录中（如 `scripts/`、`docs/`）
5. **新建子包模板**：

```
package-xxx/
  pages/
    page-name/
      page-name.js    → require('../../../utils/util.js')
      page-name.json
      page-name.wxml  → 图片用绝对路径 /img/xxx.png
      page-name.wxss
```

---

## 五、快速排查命令

```powershell
# 查看主包中最大的页面目录
Get-ChildItem "pages" -Directory | ForEach-Object {
  $s = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum
  [PSCustomObject]@{Name=$_.Name; KB=[math]::Round($s/1KB,1)}
} | Sort-Object KB -Descending | Select-Object -First 15

# 查找未被 packOptions 排除的大文件
Get-ChildItem "." -File | Where-Object { $_.Length -gt 10KB } |
  Sort-Object Length -Descending | Select-Object Name, @{N="KB";E={[math]::Round($_.Length/1KB,1)}}

# 查找 >200KB 的图片
Get-ChildItem "." -Recurse -Include *.png,*.jpg -File |
  Where-Object { $_.Length -gt 200KB } | Select-Object FullName, Length
```

---

## 六、本项目当前包结构

| 包名 | 大小 | 包含内容 |
|------|------|---------|
| main | 1.36MB | 4 个 tabBar 页 + 核心页面 + utils/api/img |
| package-push | 74KB | 推品/商品浏览相关 9 个页面 |
| package-merchant | 154KB | 商家端管理页面 |
| package-service-provider | 93KB | 服务商端管理页面 |
| package-customer | 405KB | 优惠券/活动页面 |
| package-worker | 58KB | 技工端页面 |
| package-commission | 23KB | 佣金/合伙人页面 |
| package-account | 12KB | 钱包/通知页面 |
| package-market | 17KB | 集市首页 |
| package-rider | 18KB | 骑手端页面 |
