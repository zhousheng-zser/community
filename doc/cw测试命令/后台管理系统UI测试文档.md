# 后台管理系统UI测试文档

> **文档版本**: v1.0  
> **创建日期**: 2026-04-22  
> **适用范围**: 九州运营中台、服务商门户、商家门户、技工门户  
> **阅读对象**: AI编程工具

---

## 一、测试概述

### 1.1 测试目标

本文档用于指导AI编程工具检查以下后台管理系统的UI美观性：

1. **九州运营中台** (admin) - 路径: `/root/community-backend/admin`
2. **服务商门户** (service-provider-portal) - 路径: `/root/community-backend/service-provider-portal`
3. **商家门户** (merchant-portal) - 路径: `/root/community-backend/merchant-portal`
4. **技工门户** (worker-portal) - 路径: `/root/community-backend/worker-portal`

### 1.2 测试标准

- **组件大小**: 所有组件尺寸符合设计规范
- **表格排版**: 表格列宽合理，内容不溢出
- **响应式布局**: 适配不同屏幕尺寸
- **视觉一致性**: 颜色、字体、间距保持一致
- **交互友好**: 按钮、表单、弹窗交互流畅

### 1.3 技术栈

- Vue 3 + Composition API
- Element Plus UI框架
- CSS3 + Flexbox/Grid布局

---

## 二、九州运营中台UI测试

### 2.1 整体布局测试

**测试文件**: `/root/community-backend/admin/src/layout/index.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| LAYOUT-001 | 侧边栏宽度 | 固定200px，不随内容变化 | 检查CSS中 `.sidebar` 的 `width` 属性 |
| LAYOUT-002 | 顶部导航栏高度 | 固定60px | 检查CSS中 `.header` 的 `height` 属性 |
| LAYOUT-003 | 内容区域padding | 20px内边距 | 检查CSS中 `.main-content` 的 `padding` 属性 |
| LAYOUT-004 | 布局响应式 | 小屏幕时侧边栏可折叠 | 检查媒体查询 `@media` |

#### 检查命令

```bash
# 检查布局文件
cat /root/community-backend/admin/src/layout/index.vue | grep -E "(width|height|padding|margin):"

# 检查CSS样式
cat /root/community-backend/admin/src/layout/index.vue | grep -E "\.(sidebar|header|main-content)"
```

---

### 2.2 Dashboard页面测试

**测试文件**: `/root/community-backend/admin/src/views/Dashboard.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| DASH-001 | 数据卡片布局 | 4列等宽，间距20px | 检查 `.data-cards` 的 `display: grid` |
| DASH-002 | 卡片高度 | 统一高度160px | 检查 `.data-card` 的 `height` |
| DASH-003 | 卡片内边距 | 20px | 检查 `.data-card` 的 `padding` |
| DASH-004 | 数值字体大小 | 28px加粗 | 检查 `.card-value` 的 `font-size` |
| DASH-005 | 标签颜色 | 蓝/紫/绿/橙四色 | 检查 `.highlight-tag` 的颜色定义 |
| DASH-006 | 图标大小 | 24px | 检查 `.card-icon` 的 `font-size` |
| DASH-007 | 响应式布局 | 小屏幕2列或1列 | 检查媒体查询 |

#### 检查命令

```bash
# 检查Dashboard组件
cat /root/community-backend/admin/src/views/Dashboard.vue | grep -E "(grid|flex|width|height|padding|font-size)"

# 检查数据卡片样式
grep -A 20 "\.data-cards" /root/community-backend/admin/src/views/Dashboard.vue

# 检查数据卡片样式
grep -A 20 "\.data-card" /root/community-backend/admin/src/views/Dashboard.vue
```

---

### 2.3 表格页面测试

**测试文件**: 
- `/root/community-backend/admin/src/views/MarketOrders.vue`
- `/root/community-backend/admin/src/views/WorkerApplications.vue`
- `/root/community-backend/admin/src/views/MarketShops.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| TABLE-001 | 表格边框 | 1px solid #ebeef5 | 检查 `el-table` 的 `border` 属性 |
| TABLE-002 | 表头背景色 | #f5f7fa | 检查表头样式 |
| TABLE-003 | 行高 | 48px | 检查表格行高 |
| TABLE-004 | 列宽设置 | 关键列固定宽度，其他自适应 | 检查 `el-table-column` 的 `width` |
| TABLE-005 | 操作列宽度 | 120px固定 | 检查操作列宽度 |
| TABLE-006 | 分页器位置 | 右对齐，上边距20px | 检查 `.el-pagination` 样式 |
| TABLE-007 | 空数据提示 | 居中显示，友好文案 | 检查 `empty-text` 属性 |
| TABLE-008 | 加载状态 | 显示loading遮罩 | 检查 `v-loading` 指令 |

#### 检查命令

```bash
# 检查表格列宽设置
grep -E "el-table-column.*width" /root/community-backend/admin/src/views/MarketOrders.vue

# 检查表格样式
grep -E "\.el-table|border|stripe" /root/community-backend/admin/src/views/MarketOrders.vue

# 检查分页器
grep -E "el-pagination" /root/community-backend/admin/src/views/MarketOrders.vue
```

---

### 2.4 表单页面测试

**测试文件**: 
- `/root/community-backend/admin/src/views/Login.vue`
- `/root/community-backend/admin/src/views/WorkerApplications.vue` (审核表单)

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| FORM-001 | 表单标签宽度 | 100px | 检查 `label-width` 属性 |
| FORM-002 | 输入框高度 | 40px | 检查 `el-input` 样式 |
| FORM-003 | 输入框宽度 | 根据内容自适应或固定 | 检查 `style="width"` |
| FORM-004 | 按钮大小 | 默认或medium | 检查 `el-button` 的 `size` |
| FORM-005 | 按钮间距 | 10px | 检查按钮组样式 |
| FORM-006 | 必填标记 | 红色星号 | 检查 `required` 属性 |
| FORM-007 | 错误提示 | 红色文字，12px | 检查表单验证样式 |

#### 检查命令

```bash
# 检查表单布局
grep -E "el-form|label-width|el-input|el-button" /root/community-backend/admin/src/views/Login.vue

# 检查表单样式
grep -E "\.el-form|\.el-input|\.el-button" /root/community-backend/admin/src/views/Login.vue
```

---

### 2.5 弹窗/抽屉测试

**测试文件**: 
- `/root/community-backend/admin/src/views/MarketOrders.vue` (订单详情抽屉)

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| DRAWER-001 | 抽屉宽度 | 50%或固定600px | 检查 `size` 属性 |
| DRAWER-002 | 抽屉标题 | 16px加粗 | 检查标题样式 |
| DRAWER-003 | 内容padding | 20px | 检查内容区域样式 |
| DRAWER-004 | 关闭按钮 | 右上角，可点击 | 检查关闭按钮位置 |
| DRAWER-005 | 描述列表 | 边框清晰，标签对齐 | 检查 `el-descriptions` 样式 |

#### 检查命令

```bash
# 检查抽屉组件
grep -E "el-drawer|size|title" /root/community-backend/admin/src/views/MarketOrders.vue

# 检查描述列表
grep -E "el-descriptions" /root/community-backend/admin/src/views/MarketOrders.vue
```

---

## 三、服务商门户UI测试

### 3.1 整体布局测试

**测试文件**: `/root/community-backend/service-provider-portal/src/layout/MainLayout.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| SP-LAYOUT-001 | 侧边栏宽度 | 200px固定 | 检查侧边栏宽度 |
| SP-LAYOUT-002 | 顶部栏高度 | 60px | 检查顶部栏高度 |
| SP-LAYOUT-003 | Logo大小 | 40px高度 | 检查Logo尺寸 |

#### 检查命令

```bash
# 检查布局文件
cat /root/community-backend/service-provider-portal/src/layout/MainLayout.vue | grep -E "(width|height|padding)"
```

---

### 3.2 服务管理页面测试

**测试文件**: `/root/community-backend/service-provider-portal/src/views/Services.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| SP-SVC-001 | 服务卡片布局 | 3列网格 | 检查 `grid` 布局 |
| SP-SVC-002 | 卡片间距 | 20px | 检查 `gap` 属性 |
| SP-SVC-003 | 卡片圆角 | 8px | 检查 `border-radius` |
| SP-SVC-004 | 卡片阴影 | 0 2px 12px rgba(0,0,0,0.1) | 检查 `box-shadow` |

#### 检查命令

```bash
# 检查服务列表
cat /root/community-backend/service-provider-portal/src/views/Services.vue | grep -E "(grid|gap|border-radius|box-shadow)"
```

---

### 3.3 订单管理页面测试

**测试文件**: `/root/community-backend/service-provider-portal/src/views/Orders.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| SP-ORD-001 | 订单状态标签 | 不同状态不同颜色 | 检查 `el-tag` 的 `type` |
| SP-ORD-002 | 操作按钮大小 | small | 检查按钮 `size` |
| SP-ORD-003 | 表格行高 | 48px | 检查表格行高 |

#### 检查命令

```bash
# 检查订单页面
cat /root/community-backend/service-provider-portal/src/views/Orders.vue | grep -E "(el-tag|el-button|el-table)"
```

---

## 四、商家门户UI测试

### 4.1 整体布局测试

**测试文件**: `/root/community-backend/merchant-portal/src/layout/MainLayout.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| MT-LAYOUT-001 | 侧边栏宽度 | 200px固定 | 检查侧边栏宽度 |
| MT-LAYOUT-002 | 顶部栏高度 | 60px | 检查顶部栏高度 |

#### 检查命令

```bash
# 检查布局文件
cat /root/community-backend/merchant-portal/src/layout/MainLayout.vue | grep -E "(width|height|padding)"
```

---

### 4.2 商品管理页面测试

**测试文件**: 
- `/root/community-backend/merchant-portal/src/views/Goods.vue`
- `/root/community-backend/merchant-portal/src/views/GoodEdit.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| MT-GOODS-001 | 商品图片大小 | 80x80px | 检查图片尺寸 |
| MT-GOODS-002 | 价格显示 | 红色加粗 | 检查价格样式 |
| MT-GOODS-003 | 状态标签 | 上架绿色/下架灰色 | 检查 `el-tag` 类型 |
| MT-GOODS-004 | SKU表格 | 列宽合理 | 检查SKU表格列宽 |
| MT-GOODS-005 | 图片上传 | 限制尺寸和格式 | 检查 `el-upload` 配置 |

#### 检查命令

```bash
# 检查商品列表
cat /root/community-backend/merchant-portal/src/views/Goods.vue | grep -E "(el-image|el-tag|width)"

# 检查商品编辑
cat /root/community-backend/merchant-portal/src/views/GoodEdit.vue | grep -E "(el-upload|el-form)"
```

---

### 4.3 订单管理页面测试

**测试文件**: 
- `/root/community-backend/merchant-portal/src/views/Orders.vue`
- `/root/community-backend/merchant-portal/src/views/OrderDetail.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| MT-ORD-001 | 订单号显示 | 可复制 | 检查是否有复制功能 |
| MT-ORD-002 | 收货地址 | 完整显示 | 检查地址显示 |
| MT-ORD-003 | 商品明细 | 表格清晰 | 检查明细表格 |
| MT-ORD-004 | 操作按钮 | 状态对应 | 检查按钮显示逻辑 |

#### 检查命令

```bash
# 检查订单页面
cat /root/community-backend/merchant-portal/src/views/Orders.vue | grep -E "(el-table|el-button)"
```

---

## 五、技工门户UI测试

### 5.1 整体布局测试

**测试文件**: `/root/community-backend/worker-portal/src/layout/MainLayout.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| WK-LAYOUT-001 | 移动端适配 | 100%宽度 | 检查响应式布局 |
| WK-LAYOUT-002 | 底部导航 | 固定底部 | 检查底部导航样式 |

#### 检查命令

```bash
# 检查布局文件
cat /root/community-backend/worker-portal/src/layout/MainLayout.vue | grep -E "(width|height|position)"
```

---

### 5.2 订单列表页面测试

**测试文件**: `/root/community-backend/worker-portal/src/views/Orders.vue`

#### 检查项

| 检查编号 | 检查内容 | 检查标准 | 检查命令 |
|----------|----------|----------|----------|
| WK-ORD-001 | 订单卡片 | 圆角8px，阴影 | 检查卡片样式 |
| WK-ORD-002 | 状态标签 | 醒目颜色 | 检查标签样式 |
| WK-ORD-003 | 操作按钮 | 底部固定 | 检查按钮位置 |

#### 检查命令

```bash
# 检查订单页面
cat /root/community-backend/worker-portal/src/views/Orders.vue | grep -E "(border-radius|box-shadow|el-button)"
```

---

## 六、通用组件UI规范

### 6.1 Element Plus组件规范

#### 按钮规范

| 组件类型 | 尺寸 | 内边距 | 字体大小 |
|----------|------|--------|----------|
| 主要按钮 | default | 12px 20px | 14px |
| 次要按钮 | default | 12px 20px | 14px |
| 小按钮 | small | 8px 15px | 12px |
| 大按钮 | large | 14px 24px | 16px |

#### 表格规范

| 属性 | 值 |
|------|------|
| 行高 | 48px (default) / 40px (small) |
| 表头背景 | #f5f7fa |
| 边框颜色 | #ebeef5 |
| 斑马纹背景 | #fafafa |
| 悬停背景 | #f5f7fa |

#### 表单规范

| 属性 | 值 |
|------|------|
| 标签宽度 | 100px (默认) |
| 输入框高度 | 40px (default) / 32px (small) |
| 标签字体 | 14px |
| 错误提示 | 12px 红色 |

### 6.2 颜色规范

| 用途 | 颜色值 | 变量名 |
|------|--------|--------|
| 主色 | #409EFF | --el-color-primary |
| 成功 | #67C23A | --el-color-success |
| 警告 | #E6A23C | --el-color-warning |
| 危险 | #F56C6C | --el-color-danger |
| 信息 | #909399 | --el-color-info |
| 文字主色 | #303133 | --el-text-color-primary |
| 文字常规 | #606266 | --el-text-color-regular |
| 文字次要 | #909399 | --el-text-color-secondary |
| 边框颜色 | #DCDFE6 | --el-border-color |

### 6.3 间距规范

| 用途 | 值 |
|------|------|
| 页面内边距 | 20px |
| 卡片内边距 | 20px |
| 表单项间距 | 18px |
| 按钮间距 | 10px |
| 模块间距 | 20px |

---

## 七、响应式布局检查

### 7.1 断点定义

| 断点名称 | 宽度范围 | 布局调整 |
|----------|----------|----------|
| xs | < 768px | 单列布局，侧边栏隐藏 |
| sm | 768px - 992px | 侧边栏折叠 |
| md | 992px - 1200px | 正常布局 |
| lg | > 1200px | 宽屏布局 |

### 7.2 检查命令

```bash
# 检查媒体查询
grep -r "@media" /root/community-backend/admin/src/ --include="*.vue" --include="*.css"

# 检查响应式类
grep -r "hidden-sm-and-down\|hidden-md-and-up" /root/community-backend/admin/src/
```

---

## 八、AI检查执行指南

### 8.1 自动检查脚本

```bash
#!/bin/bash
# UI检查脚本

echo "=== 开始UI检查 ==="

# 1. 检查九州运营中台
echo ">>> 检查九州运营中台..."
cd /root/community-backend/admin

# 检查布局
grep -E "width.*200|height.*60" src/layout/index.vue && echo "✓ 布局尺寸正确" || echo "✗ 布局尺寸异常"

# 检查表格
grep -E "el-table.*border|el-table.*stripe" src/views/*.vue && echo "✓ 表格样式正确" || echo "✗ 表格样式异常"

# 检查表单
grep -E "label-width|el-form-item" src/views/*.vue && echo "✓ 表单样式正确" || echo "✗ 表单样式异常"

# 2. 检查服务商门户
echo ">>> 检查服务商门户..."
cd /root/community-backend/service-provider-portal

grep -E "width.*200|height.*60" src/layout/MainLayout.vue && echo "✓ 布局尺寸正确" || echo "✗ 布局尺寸异常"

# 3. 检查商家门户
echo ">>> 检查商家门户..."
cd /root/community-backend/merchant-portal

grep -E "width.*200|height.*60" src/layout/MainLayout.vue && echo "✓ 布局尺寸正确" || echo "✗ 布局尺寸异常"

# 4. 检查技工门户
echo ">>> 检查技工门户..."
cd /root/community-backend/worker-portal

grep -E "width.*100%|position.*fixed" src/layout/MainLayout.vue && echo "✓ 移动端布局正确" || echo "✗ 移动端布局异常"

echo "=== UI检查完成 ==="
```

### 8.2 AI检查要点

1. **读取Vue文件**: 使用Read工具读取Vue文件内容
2. **检查CSS样式**: 搜索关键CSS属性
3. **检查组件属性**: 搜索Element Plus组件的关键属性
4. **对比规范**: 将实际值与规范值对比
5. **生成报告**: 输出检查结果

### 8.3 常见问题修复

| 问题 | 原因 | 修复方法 |
|------|------|----------|
| 表格列宽不合理 | 未设置width属性 | 添加 `width` 或 `min-width` |
| 卡片高度不一致 | 未设置固定高度 | 添加 `height` 或 `min-height` |
| 按钮大小不统一 | 未设置size属性 | 统一设置 `size` 属性 |
| 间距不一致 | 未使用统一变量 | 使用CSS变量或统一样式类 |
| 响应式失效 | 缺少媒体查询 | 添加 `@media` 查询 |

---

## 九、检查报告模板

```markdown
# UI检查报告

## 检查时间
YYYY-MM-DD HH:mm:ss

## 检查范围
- 九州运营中台
- 服务商门户
- 商家门户
- 技工门户

## 检查结果

### 九州运营中台
| 检查项 | 状态 | 实际值 | 规范值 | 备注 |
|--------|------|--------|--------|------|
| 侧边栏宽度 | ✓/✗ | 200px | 200px | |
| 顶部栏高度 | ✓/✗ | 60px | 60px | |
| 表格行高 | ✓/✗ | 48px | 48px | |

### 服务商门户
...

### 商家门户
...

### 技工门户
...

## 问题汇总
1. [问题描述]
2. [问题描述]

## 修复建议
1. [修复建议]
2. [修复建议]
```

---

## 文档修订记录

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| v1.0 | 2026-04-22 | 测试团队 | 初始版本 |

---

**文档结束**