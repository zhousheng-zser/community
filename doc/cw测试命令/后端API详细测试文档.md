# 后端API详细测试文档

> **文档版本**: v1.0  
> **创建日期**: 2026-04-22  
> **测试方式**: 模拟前端输入数据测试后端API  
> **测试环境**: http://127.0.0.1:3099/api/v1

---

## 目录

1. [测试环境准备](#一测试环境准备)
2. [用户认证模块测试](#二用户认证模块测试)
3. [首页服务模块测试](#三首页服务模块测试)
4. [到家服务模块测试](#四到家服务模块测试)
5. [本地集市模块测试](#五本地集市模块测试)
6. [邻里帮帮模块测试](#六邻里帮帮模块测试)
7. [管理后台模块测试](#七管理后台模块测试)
8. [测试数据清理](#八测试数据清理)

---

## 一、测试环境准备

### 1.1 启动后端服务

```bash
# 进入后端目录
cd /root/community-backend/backend

# 启动服务
npm start

# 或使用开发模式
npm run dev
```

### 1.2 验证服务状态

```bash
# 检查服务是否启动
curl -X GET http://127.0.0.1:3099/api/v1/health

# 预期返回
{
  "status": "ok",
  "timestamp": "2026-04-22T00:00:00.000Z"
}
```

### 1.3 准备测试数据

```bash
# 运行种子数据脚本
npm run seed

# 检查数据库连接
mysql -u root -p -e "USE community_db; SHOW TABLES;"
```

---

## 二、用户认证模块测试

### 2.1 管理员登录

**测试链路**: 管理员登录 → 获取Token → 验证Token有效性

#### 测试命令

```bash
# 1. 管理员登录
curl -X POST http://127.0.0.1:3099/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}

# 保存Token到环境变量
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 检查命令

```bash
# 检查数据库中的管理员记录
mysql -u root -p community_db -e "SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 1;"

# 检查Token是否有效
curl -X GET http://127.0.0.1:3099/api/v1/admin/profile \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

### 2.2 用户登录（微信授权）

**测试链路**: 微信授权登录 → 获取Token → 绑定手机号 → 绑定小区

#### 测试命令

```bash
# 1. 微信授权登录（模拟）
curl -X POST http://127.0.0.1:3099/api/v1/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code_13800138000",
    "userInfo": {
      "nickName": "测试用户",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 100,
      "nickname": "测试用户",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}

# 保存Token到环境变量
export USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. 绑定手机号
curl -X POST http://127.0.0.1:3099/api/v1/user/bind-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "phone": "13800138000",
    "code": "123456"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "phone": "13800138000"
  }
}

# 3. 绑定小区
curl -X POST http://127.0.0.1:3099/api/v1/user/bind-community \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "community_id": 1
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "community_id": 1,
    "community_name": "上海合川路地铁站"
  }
}
```

#### 检查命令

```bash
# 检查用户数据
mysql -u root -p community_db -e "SELECT id, nickname, phone, community_id FROM users WHERE phone = '13800138000';"

# 检查用户Token有效性
curl -X GET http://127.0.0.1:3099/api/v1/user/profile \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 100,
    "nickname": "测试用户",
    "phone": "13800138000",
    "community_id": 1
  }
}
```

---

## 三、首页服务模块测试

### 3.1 获取轮播Banner

**测试链路**: 获取Banner列表 → 验证Banner数据 → 点击跳转验证

#### 测试命令

```bash
# 1. 获取Banner列表
curl -X GET http://127.0.0.1:3099/api/v1/core/banners

# 预期返回
{
  "errno": 0,
  "data": [
    {
      "id": 1,
      "image_url": "https://example.com/banner1.jpg",
      "link_type": "service",
      "link_value": "1",
      "sort": 1
    }
  ]
}

# 2. 验证Banner跳转（如果是服务类型）
curl -X GET http://127.0.0.1:3099/api/v1/core/services/1

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 1,
    "title": "测试服务",
    "price": 99.00
  }
}
```

#### 检查命令

```bash
# 检查数据库中的Banner数据
mysql -u root -p community_db -e "SELECT id, image_url, link_type, link_value, sort FROM banners WHERE status = 'active' ORDER BY sort;"

# 检查Banner数量
mysql -u root -p community_db -e "SELECT COUNT(*) as count FROM banners WHERE status = 'active';"
```

---

### 3.2 获取九宫格服务类目

**测试链路**: 获取服务分组 → 验证分组数据 → 获取分组下服务列表

#### 测试命令

```bash
# 1. 获取服务分组（家修急事）
curl -X GET http://127.0.0.1:3099/api/v1/core/service-groups/urgent_fix

# 预期返回
{
  "errno": 0,
  "data": {
    "categories": [
      {"name": "热门服务", "icon_url": "/img/icon-hot.png"}
    ],
    "services": [
      {
        "id": 1,
        "title": "【2小时】全屋整理收纳",
        "price": 199,
        "cover_image": "https://example.com/service1.jpg",
        "sales_count": 1234
      }
    ]
  }
}

# 2. 获取服务详情
curl -X GET http://127.0.0.1:3099/api/v1/core/services/1

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 1,
    "title": "【2小时】全屋整理收纳",
    "price": 199,
    "description": "专业整理收纳服务",
    "cover_image": "https://example.com/service1.jpg"
  }
}
```

#### 检查命令

```bash
# 检查服务分组数据
mysql -u root -p community_db -e "SELECT id, slug, title FROM service_groups WHERE slug = 'urgent_fix';"

# 检查分组下的服务
mysql -u root -p community_db -e "SELECT s.id, s.title, s.price FROM services s JOIN service_group_items sgi ON s.id = sgi.service_id JOIN service_groups sg ON sgi.group_id = sg.id WHERE sg.slug = 'urgent_fix';"
```

---

### 3.3 获取技工列表

**测试链路**: 获取技工列表 → 验证小区隔离 → 查看技工详情

#### 测试命令

```bash
# 1. 获取技工列表（小区1）
curl -X GET "http://127.0.0.1:3099/api/v1/core/workers?community_id=1&page=1&page_size=20"

# 预期返回
{
  "errno": 0,
  "data": {
    "list": [
      {
        "id": 10,
        "name": "张师傅",
        "industry": "家电维修",
        "avatar": "https://example.com/avatar.jpg",
        "rating": 4.8,
        "order_count": 123
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 20
  }
}

# 2. 验证小区隔离（小区2）
curl -X GET "http://127.0.0.1:3099/api/v1/core/workers?community_id=2&page=1&page_size=20"

# 预期返回（不包含小区1的技工）
{
  "errno": 0,
  "data": {
    "list": [
      {
        "id": 12,
        "name": "王师傅",
        "industry": "保洁服务"
      }
    ],
    "total": 5
  }
}

# 3. 查看技工详情
curl -X GET http://127.0.0.1:3099/api/v1/core/workers/10

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 10,
    "name": "张师傅",
    "industry": "家电维修",
    "rating": 4.8,
    "order_count": 123,
    "introduction": "10年家电维修经验"
  }
}
```

#### 检查命令

```bash
# 检查技工数据
mysql -u root -p community_db -e "SELECT wp.user_id, wp.name, wp.industry, wp.community_id, wp.status FROM worker_profiles wp WHERE wp.status = 'active' LIMIT 5;"

# 验证小区隔离
mysql -u root -p community_db -e "SELECT community_id, COUNT(*) as count FROM worker_profiles WHERE status = 'active' GROUP BY community_id;"

# 检查技工评分
mysql -u root -p community_db -e "SELECT wp.user_id, wp.name, AVG(r.rating) as avg_rating FROM worker_profiles wp LEFT JOIN reviews r ON wp.user_id = r.worker_id GROUP BY wp.user_id LIMIT 5;"
```

---

### 3.4 获取服务商列表

**测试链路**: 获取服务商列表 → 验证小区隔离 → 查看服务商详情

#### 测试命令

```bash
# 1. 获取服务商列表（小区1）
curl -X GET "http://127.0.0.1:3099/api/v1/core/service-providers?community_id=1&page=1&page_size=20"

# 预期返回
{
  "errno": 0,
  "data": {
    "list": [
      {
        "id": 20,
        "shop_name": "测试服务商1",
        "contact_name": "李经理",
        "avatar": "https://example.com/shop.jpg",
        "rating": 4.9,
        "order_count": 456
      }
    ],
    "total": 5
  }
}

# 2. 查看服务商详情
curl -X GET http://127.0.0.1:3099/api/v1/core/service-providers/20

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 20,
    "shop_name": "测试服务商1",
    "contact_name": "李经理",
    "phone": "13700137001",
    "description": "专业家政服务"
  }
}
```

#### 检查命令

```bash
# 检查服务商数据
mysql -u root -p community_db -e "SELECT spp.user_id, spp.shop_name, spp.community_id, spp.status FROM service_provider_profiles spp WHERE spp.status = 'active' LIMIT 5;"

# 验证小区隔离
mysql -u root -p community_db -e "SELECT community_id, COUNT(*) as count FROM service_provider_profiles WHERE status = 'active' GROUP BY community_id;"
```

---

## 四、到家服务模块测试

### 4.1 技工入驻流程

**测试链路**: 提交入驻申请 → 管理员审核 → 生成技工档案 → 设置接单小区

#### 测试命令

```bash
# 1. 提交技工入驻申请
curl -X POST http://127.0.0.1:3099/api/v1/worker/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "name": "张师傅",
    "phone": "13900139001",
    "industry": "家电维修",
    "education": "大专",
    "city": "杭州市",
    "resume": "10年家电维修经验",
    "id_card_url": "/uploads/idcard.jpg",
    "work_photo_url": "/uploads/work.jpg",
    "certificate_url": ["/uploads/cert1.jpg", "/uploads/cert2.jpg"]
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "application_id": 100
  }
}

# 保存申请ID
export WORKER_APP_ID=100

# 2. 管理员审核通过
curl -X PUT http://127.0.0.1:3099/api/v1/admin/worker-applications/$WORKER_APP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "approved",
    "review_note": "资质齐全，审核通过"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "application_id": 100,
    "status": "approved"
  }
}

# 3. 设置技工接单小区
curl -X PUT http://127.0.0.1:3099/api/v1/admin/worker-profiles/100 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "community_id": 1
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "user_id": 100,
    "community_id": 1
  }
}
```

#### 检查命令

```bash
# 检查入驻申请记录
mysql -u root -p community_db -e "SELECT id, user_id, name, phone, status, created_at FROM worker_applications WHERE id = $WORKER_APP_ID;"

# 检查技工档案是否生成
mysql -u root -p community_db -e "SELECT user_id, name, phone, industry, status, community_id FROM worker_profiles WHERE user_id = (SELECT user_id FROM worker_applications WHERE id = $WORKER_APP_ID);"

# 检查审核记录
mysql -u root -p community_db -e "SELECT id, application_id, status, review_note, reviewed_at FROM worker_application_reviews WHERE application_id = $WORKER_APP_ID;"
```

---

### 4.2 服务商入驻流程

**测试链路**: 提交入驻申请 → 管理员审核 → 生成服务商档案 → 开通门户账号

#### 测试命令

```bash
# 1. 提交服务商入驻申请
curl -X POST http://127.0.0.1:3099/api/v1/service-provider/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "shop_name": "测试服务商门店",
    "contact_name": "李经理",
    "phone": "13700137001",
    "license_url": "/uploads/license.jpg",
    "shop_front_url": "/uploads/front.jpg",
    "environment_url": ["/uploads/env1.jpg", "/uploads/env2.jpg"],
    "id_card_url": "/uploads/idcard2.jpg"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "application_id": 50
  }
}

# 保存申请ID
export PROVIDER_APP_ID=50

# 2. 管理员审核通过
curl -X PUT http://127.0.0.1:3099/api/v1/admin/service-provider-applications/$PROVIDER_APP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "approved",
    "review_note": "资质齐全，审核通过"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "application_id": 50,
    "status": "approved"
  }
}

# 3. 开通服务商门户账号
curl -X POST http://127.0.0.1:3099/api/v1/admin/service-provider-portal-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "profile_id": 50,
    "username": "sp_test_001"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "account_id": 1,
    "username": "sp_test_001"
  }
}

# 4. 服务商门户登录
curl -X POST http://127.0.0.1:3099/api/v1/service-provider-portal/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sp_test_001",
    "password": "default_password"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profile": {
      "id": 50,
      "shop_name": "测试服务商门店"
    }
  }
}

# 保存服务商Token
export PROVIDER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 检查命令

```bash
# 检查入驻申请记录
mysql -u root -p community_db -e "SELECT id, user_id, shop_name, phone, status FROM service_provider_applications WHERE id = $PROVIDER_APP_ID;"

# 检查服务商档案
mysql -u root -p community_db -e "SELECT user_id, shop_name, contact_name, phone, status FROM service_provider_profiles WHERE user_id = (SELECT user_id FROM service_provider_applications WHERE id = $PROVIDER_APP_ID);"

# 检查门户账号
mysql -u root -p community_db -e "SELECT id, profile_id, username FROM service_provider_portal_accounts WHERE profile_id = 50;"
```

---

### 4.3 到家订单全流程

**测试链路**: 创建订单 → 支付订单 → 技工接单 → 上门打卡 → 完成服务 → 用户确认

#### 测试命令

```bash
# 1. 创建订单（直约技工）
curl -X POST http://127.0.0.1:3099/api/v1/service-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "service_id": 1,
    "worker_id": 10,
    "community_id": 1,
    "address_snapshot": {
      "contact": "张三",
      "phone": "13800138000",
      "label": "上海合川路地铁站",
      "detail": "1号楼101"
    },
    "appointment_time": "2026-04-23 10:00:00",
    "remark": "请准时上门"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "order_no": "SO20260422001",
    "status": "pending_worker_accept",
    "amount": 199.00
  }
}

# 保存订单ID
export SERVICE_ORDER_ID=1000

# 2. 支付订单
curl -X POST http://127.0.0.1:3099/api/v1/service-orders/$SERVICE_ORDER_ID/pay \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "pay_status": "paid",
    "status": "pending_worker_accept"
  }
}

# 3. 技工接单
curl -X POST http://127.0.0.1:3099/api/v1/worker/service-orders/$SERVICE_ORDER_ID/accept \
  -H "Authorization: Bearer $WORKER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "status": "in_service"
  }
}

# 4. 技工上门打卡
curl -X POST http://127.0.0.1:3099/api/v1/worker/service-orders/$SERVICE_ORDER_ID/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{
    "latitude": 31.2304,
    "longitude": 121.4737,
    "address": "上海市闵行区合川路地铁站"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "check_ins": [
      {
        "time": "2026-04-23 10:05:00",
        "latitude": 31.2304,
        "longitude": 121.4737
      }
    ]
  }
}

# 5. 技工上传服务前证据
curl -X POST http://127.0.0.1:3099/api/v1/worker/service-orders/$SERVICE_ORDER_ID/evidence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{
    "type": "before",
    "images": ["/uploads/evidence/before1.jpg", "/uploads/evidence/before2.jpg"]
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "evidence": {
      "before": ["/uploads/evidence/before1.jpg", "/uploads/evidence/before2.jpg"]
    }
  }
}

# 6. 技工完成服务
curl -X POST http://127.0.0.1:3099/api/v1/worker/service-orders/$SERVICE_ORDER_ID/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{
    "images": ["/uploads/evidence/after1.jpg", "/uploads/evidence/after2.jpg"],
    "note": "服务已完成"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "status": "pending_user_confirm"
  }
}

# 7. 用户确认完成
curl -X POST http://127.0.0.1:3099/api/v1/service-orders/$SERVICE_ORDER_ID/confirm-complete \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1000,
    "status": "completed"
  }
}
```

#### 检查命令

```bash
# 检查订单状态流转
mysql -u root -p community_db -e "SELECT id, order_no, status, pay_status, created_at FROM service_orders WHERE id = $SERVICE_ORDER_ID;"

# 检查打卡记录
mysql -u root -p community_db -e "SELECT id, order_id, check_in_time, latitude, longitude FROM service_order_check_ins WHERE order_id = $SERVICE_ORDER_ID;"

# 检查证据记录
mysql -u root -p community_db -e "SELECT id, order_id, type, images, created_at FROM service_order_evidence WHERE order_id = $SERVICE_ORDER_ID;"

# 检查订单金额
mysql -u root -p community_db -e "SELECT id, order_no, amount, pay_status FROM service_orders WHERE id = $SERVICE_ORDER_ID;"

# 检查状态流转日志
mysql -u root -p community_db -e "SELECT id, order_id, old_status, new_status, created_at FROM service_order_status_logs WHERE order_id = $SERVICE_ORDER_ID ORDER BY created_at;"
```

---

### 4.4 多小区隔离验证

**测试链路**: 创建多小区数据 → 验证技工列表隔离 → 验证服务商列表隔离 → 验证订单隔离

#### 测试命令

```bash
# 1. 创建小区1的用户和技工
curl -X POST http://127.0.0.1:3099/api/v1/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code_user_c1", "userInfo": {"nickName": "用户C1"}}'

export USER_C1_TOKEN="..."

curl -X POST http://127.0.0.1:3099/api/v1/user/bind-community \
  -H "Authorization: Bearer $USER_C1_TOKEN" \
  -d '{"community_id": 1}'

# 2. 创建小区2的用户和技工
curl -X POST http://127.0.0.1:3099/api/v1/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code_user_c2", "userInfo": {"nickName": "用户C2"}}'

export USER_C2_TOKEN="..."

curl -X POST http://127.0.0.1:3099/api/v1/user/bind-community \
  -H "Authorization: Bearer $USER_C2_TOKEN" \
  -d '{"community_id": 2}'

# 3. 验证技工列表隔离
curl -X GET "http://127.0.0.1:3099/api/v1/core/workers?community_id=1"

# 预期：只返回小区1的技工

curl -X GET "http://127.0.0.1:3099/api/v1/core/workers?community_id=2"

# 预期：只返回小区2的技工

# 4. 验证直约技工隔离（小区1用户尝试直约小区2技工）
curl -X POST http://127.0.0.1:3099/api/v1/service-orders \
  -H "Authorization: Bearer $USER_C1_TOKEN" \
  -d '{
    "service_id": 1,
    "worker_id": 12,
    "community_id": 1,
    "address_snapshot": {"contact": "张三", "phone": "13800138000"}
  }'

# 预期返回错误
{
  "errno": 1,
  "errmsg": "技工不接该小区"
}

# 5. 验证服务商列表隔离
curl -X GET "http://127.0.0.1:3099/api/v1/core/service-providers?community_id=1"

# 预期：只返回小区1的服务商

# 6. 验证服务商catalog隔离
curl -X GET http://127.0.0.1:3099/api/v1/service-providers/21/catalog \
  -H "Authorization: Bearer $USER_C1_TOKEN"

# 预期返回404（服务商21属于小区2）
{
  "errno": 404,
  "errmsg": "服务商不存在或不接该小区"
}
```

#### 检查命令

```bash
# 检查技工的小区分布
mysql -u root -p community_db -e "SELECT community_id, COUNT(*) as count FROM worker_profiles WHERE status = 'active' GROUP BY community_id;"

# 检查服务商的小区分布
mysql -u root -p community_db -e "SELECT community_id, COUNT(*) as count FROM service_provider_profiles WHERE status = 'active' GROUP BY community_id;"

# 检查用户的小区分布
mysql -u root -p community_db -e "SELECT community_id, COUNT(*) as count FROM users WHERE community_id IS NOT NULL GROUP BY community_id;"

# 检查订单的小区分布
mysql -u root -p community_db -e "SELECT community_id, COUNT(*) as count FROM service_orders GROUP BY community_id;"
```

---

## 五、本地集市模块测试

### 5.1 商家入驻流程

**测试链路**: 提交入驻申请 → 管理员审核 → 创建商家账号 → 商家后台登录

#### 测试命令

```bash
# 1. 提交商家入驻申请
curl -X POST http://127.0.0.1:3099/api/v1/market/merchant/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "shop_name": "测试店铺",
    "contact_name": "王经理",
    "phone": "13700137000",
    "category": "食品生鲜",
    "address": "上海市闵行区合川路123号",
    "entity_name": "测试食品有限公司",
    "credit_code": "91310112MA1GXXXXXX",
    "legal_person": "王五",
    "logo_url": "https://example.com/logo.jpg",
    "background_url": "https://example.com/bg.jpg",
    "license_url": "https://example.com/license.jpg"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "application_id": 30
  }
}

# 保存申请ID
export MERCHANT_APP_ID=30

# 2. 管理员审核通过
curl -X PUT http://127.0.0.1:3099/api/v1/admin/market-merchant-applications/$MERCHANT_APP_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "approved"}'

# 3. 创建商家账号
curl -X POST http://127.0.0.1:3099/api/v1/admin/merchant-accounts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "shop_id": 30,
    "username": "merchant_test_001"
  }'

# 4. 商家后台登录
curl -X POST http://127.0.0.1:3099/api/v1/merchant-portal/login \
  -d '{
    "username": "merchant_test_001",
    "password": "default_password"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "token": "...",
    "shop": {
      "id": 30,
      "shop_name": "测试店铺"
    }
  }
}

# 保存商家Token
export MERCHANT_TOKEN="..."
```

#### 检查命令

```bash
# 检查商家入驻申请
mysql -u root -p community_db -e "SELECT id, shop_name, contact_name, phone, status FROM market_merchant_applications WHERE id = $MERCHANT_APP_ID;"

# 检查店铺信息
mysql -u root -p community_db -e "SELECT id, shop_name, category, status FROM market_shops WHERE id = 30;"

# 检查商家账号
mysql -u root -p community_db -e "SELECT id, shop_id, username FROM merchant_accounts WHERE shop_id = 30;"
```

---

### 5.2 商品管理（含SKU）

**测试链路**: 创建商品 → 设置SKU → 上架商品 → 查看商品详情

#### 测试命令

```bash
# 1. 创建商品
curl -X POST http://127.0.0.1:3099/api/v1/market/merchant/goods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -d '{
    "name": "有机苹果",
    "description": "新鲜有机苹果，产地直发",
    "main_images": [
      "https://example.com/apple1.jpg",
      "https://example.com/apple2.jpg"
    ],
    "sku_tree": [
      {
        "k_id": 1,
        "k": "规格",
        "v": [
          {"id": 1, "name": "1斤装"},
          {"id": 2, "name": "2斤装"},
          {"id": 3, "name": "5斤装"}
        ]
      }
    ],
    "sku_list": [
      {
        "id": "sku_1",
        "specs": [{"k_id": 1, "v_id": 1}],
        "price": 15.00,
        "stock": 100
      },
      {
        "id": "sku_2",
        "specs": [{"k_id": 1, "v_id": 2}],
        "price": 25.00,
        "stock": 50
      }
    ]
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "goods_id": 100
  }
}

# 保存商品ID
export GOODS_ID=100

# 2. 上架商品
curl -X POST http://127.0.0.1:3099/api/v1/market/merchant/goods/$GOODS_ID/shelf \
  -H "Authorization: Bearer $MERCHANT_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "goods_id": 100,
    "status": "on_sale"
  }
}

# 3. 查看商品详情
curl -X GET "http://127.0.0.1:3099/api/v1/market/goods/detail?id=$GOODS_ID"

# 预期返回
{
  "errno": 0,
  "data": {
    "id": 100,
    "name": "有机苹果",
    "price_range": "15.00-25.00",
    "sku_tree": [...],
    "sku_list": [...]
  }
}
```

#### 检查命令

```bash
# 检查商品数据
mysql -u root -p community_db -e "SELECT id, shop_id, name, price_range, status FROM market_goods WHERE id = $GOODS_ID;"

# 检查SKU数据
mysql -u root -p community_db -e "SELECT id, goods_id, specs, price, stock FROM market_good_skus WHERE goods_id = $GOODS_ID;"

# 检查商品状态
mysql -u root -p community_db -e "SELECT id, name, status FROM market_goods WHERE id = $GOODS_ID;"
```

---

### 5.3 集市订单全流程

**测试链路**: 搜索商品 → 加入购物车 → 创建订单 → 支付订单 → 商家接单 → 用户确认收货

#### 测试命令

```bash
# 1. 搜索商品
curl -X GET "http://127.0.0.1:3099/api/v1/market/search?keyword=苹果&type=goods"

# 预期返回
{
  "errno": 0,
  "data": {
    "list": [
      {
        "id": 100,
        "name": "有机苹果",
        "price": 15.00,
        "sales": 0
      }
    ],
    "total": 1
  }
}

# 2. 创建订单
curl -X POST http://127.0.0.1:3099/api/v1/market/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "shop_id": 30,
    "delivery_mode": "express",
    "address": {
      "contact": "张三",
      "phone": "13800138000",
      "province": "上海市",
      "city": "上海市",
      "district": "闵行区",
      "detail": "合川路123号1号楼101"
    },
    "items": [
      {
        "goods_id": 100,
        "sku_id": "sku_1",
        "quantity": 2
      }
    ],
    "remark": "请尽快发货"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_no": "MO20260422001",
    "order_status": "pending_payment",
    "payable_amount": 30.00
  }
}

# 保存订单号
export MARKET_ORDER_NO="MO20260422001"

# 3. 支付订单
curl -X POST http://127.0.0.1:3099/api/v1/market/payments/create \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"order_no": "'$MARKET_ORDER_NO'"}'

# 模拟支付成功
curl -X POST http://127.0.0.1:3099/api/v1/market/payments/mock-success \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"order_no": "'$MARKET_ORDER_NO'"}'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_no": "MO20260422001",
    "order_status": "pending_accept"
  }
}

# 4. 商家接单
curl -X POST http://127.0.0.1:3099/api/v1/market/merchant/orders/$MARKET_ORDER_NO/accept \
  -H "Authorization: Bearer $MERCHANT_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_no": "MO20260422001",
    "order_status": "pending_service"
  }
}

# 5. 商家发货
curl -X POST http://127.0.0.1:3099/api/v1/market/merchant/orders/$MARKET_ORDER_NO/dispatch \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -d '{
    "express_company": "顺丰快递",
    "express_no": "SF1234567890"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_no": "MO20260422001",
    "order_status": "pending_receipt"
  }
}

# 6. 用户确认收货
curl -X POST http://127.0.0.1:3099/api/v1/market/orders/$MARKET_ORDER_NO/confirm \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_no": "MO20260422001",
    "order_status": "completed"
  }
}
```

#### 检查命令

```bash
# 检查订单状态
mysql -u root -p community_db -e "SELECT order_no, order_status, pay_status, amount FROM market_orders WHERE order_no = '$MARKET_ORDER_NO';"

# 检查订单明细
mysql -u root -p community_db -e "SELECT order_no, goods_id, sku_id, quantity, price FROM market_order_items WHERE order_no = '$MARKET_ORDER_NO';"

# 检查库存扣减
mysql -u root -p community_db -e "SELECT id, goods_id, stock FROM market_good_skus WHERE goods_id = 100 AND id = 'sku_1';"

# 检查支付记录
mysql -u root -p community_db -e "SELECT id, order_no, amount, status FROM market_payments WHERE order_no = '$MARKET_ORDER_NO';"
```

---

## 六、邻里帮帮模块测试

### 6.1 发布帮帮需求

**测试链路**: 选择帮帮类型 → 填写双地址 → 发布需求 → 支付报酬

#### 测试命令

```bash
# 1. 发布代取快递需求
curl -X POST http://127.0.0.1:3099/api/v1/neighbor-assist/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "assist_type": "take",
    "community_id": 1,
    "origin_address_snapshot": {
      "label": "上海合川路地铁站",
      "detail": "快递柜A区",
      "contact": "张三",
      "phone": "13800138000"
    },
    "destination_address_snapshot": {
      "label": "上海合川路地铁站",
      "detail": "1号楼101",
      "contact": "李四",
      "phone": "13900139000"
    },
    "amount": 10.5,
    "remark": "请小心轻放"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 2000,
    "status": "pending_pay"
  }
}

# 保存订单ID
export ASSIST_ORDER_ID=2000

# 2. 支付报酬
curl -X POST http://127.0.0.1:3099/api/v1/neighbor-assist/orders/$ASSIST_ORDER_ID/pay \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 2000,
    "status": "paid_pending_dispatch",
    "pay_status": "paid"
  }
}
```

#### 检查命令

```bash
# 检查帮帮订单
mysql -u root -p community_db -e "SELECT id, assist_type, status, pay_status, amount FROM neighbor_assist_orders WHERE id = $ASSIST_ORDER_ID;"

# 检查地址快照
mysql -u root -p community_db -e "SELECT id, origin_address_snapshot, destination_address_snapshot FROM neighbor_assist_orders WHERE id = $ASSIST_ORDER_ID;"
```

---

### 6.2 技工抢单流程

**测试链路**: 查看待派单池 → 技工抢单 → 技工接单 → 完成服务

#### 测试命令

```bash
# 1. 技工查看待派单池
curl -X GET "http://127.0.0.1:3099/api/v1/neighbor-assist/orders/pool?limit=50" \
  -H "Authorization: Bearer $WORKER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "list": [
      {
        "id": 2000,
        "assist_type": "take",
        "amount": 10.5,
        "origin_address": "...",
        "destination_address": "..."
      }
    ],
    "total": 1
  }
}

# 2. 技工抢单
curl -X POST http://127.0.0.1:3099/api/v1/neighbor-assist/orders/$ASSIST_ORDER_ID/grab \
  -H "Authorization: Bearer $WORKER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 2000,
    "status": "dispatched",
    "worker_id": 10
  }
}

# 3. 技工接单
curl -X POST http://127.0.0.1:3099/api/v1/neighbor-assist/orders/$ASSIST_ORDER_ID/accept \
  -H "Authorization: Bearer $WORKER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 2000,
    "status": "in_service"
  }
}

# 4. 技工完成服务
curl -X POST http://127.0.0.1:3099/api/v1/neighbor-assist/orders/$ASSIST_ORDER_ID/complete \
  -H "Authorization: Bearer $WORKER_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 2000,
    "status": "completed"
  }
}
```

#### 检查命令

```bash
# 检查订单状态流转
mysql -u root -p community_db -e "SELECT id, status, assigned_worker_id, created_at FROM neighbor_assist_orders WHERE id = $ASSIST_ORDER_ID;"

# 检查抢单记录
mysql -u root -p community_db -e "SELECT id, order_id, worker_id, created_at FROM neighbor_assist_grab_records WHERE order_id = $ASSIST_ORDER_ID;"
```

---

## 七、管理后台模块测试

### 7.1 订单派单

**测试链路**: 查看待派单列表 → 选择技工 → 派单 → 通知技工

#### 测试命令

```bash
# 1. 查看待派单列表
curl -X GET "http://127.0.0.1:3099/api/v1/admin/service-orders?status=pending_dispatch" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期返回
{
  "errno": 0,
  "data": {
    "list": [
      {
        "id": 1001,
        "order_no": "SO20260422002",
        "status": "pending_dispatch",
        "amount": 199.00
      }
    ],
    "total": 1
  }
}

# 2. 派单给技工
curl -X POST http://127.0.0.1:3099/api/v1/admin/service-orders/1001/dispatch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"worker_id": 10}'

# 预期返回
{
  "errno": 0,
  "data": {
    "order_id": 1001,
    "status": "dispatched",
    "worker_id": 10
  }
}
```

#### 检查命令

```bash
# 检查派单记录
mysql -u root -p community_db -e "SELECT id, order_id, worker_id, dispatched_at FROM service_order_dispatches WHERE order_id = 1001;"

# 检查订单状态
mysql -u root -p community_db -e "SELECT id, status, assigned_worker_id FROM service_orders WHERE id = 1001;"
```

---

### 7.2 投诉处理

**测试链路**: 用户投诉 → 管理员查看投诉 → 创建工单 → 处理工单 → 反馈结果

#### 测试命令

```bash
# 1. 用户投诉订单
curl -X POST http://127.0.0.1:3099/api/v1/service-orders/$SERVICE_ORDER_ID/complaint \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "reason": "服务态度差",
    "description": "技工服务过程中态度不好",
    "images": ["/uploads/complaint1.jpg"]
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "complaint_id": 10
  }
}

# 2. 管理员查看投诉列表
curl -X GET "http://127.0.0.1:3099/api/v1/admin/complaints" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. 创建投诉工单
curl -X POST http://127.0.0.1:3099/api/v1/admin/complaint-tickets \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "complaint_id": 10,
    "priority": "high",
    "assignee_id": 2
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "ticket_id": 10
  }
}

# 4. 处理工单
curl -X PUT http://127.0.0.1:3099/api/v1/admin/complaint-tickets/10 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "resolved",
    "resolution": "已联系技工批评教育，退还部分费用"
  }'

# 预期返回
{
  "errno": 0,
  "data": {
    "ticket_id": 10,
    "status": "resolved"
  }
}
```

#### 检查命令

```bash
# 检查投诉记录
mysql -u root -p community_db -e "SELECT id, order_id, reason, status FROM service_order_complaints WHERE id = 10;"

# 检查工单记录
mysql -u root -p community_db -e "SELECT id, complaint_id, status, resolution FROM complaint_tickets WHERE id = 10;"
```

---

## 八、测试数据清理

### 8.1 清理测试数据

```bash
# 清理测试用户
mysql -u root -p community_db -e "DELETE FROM users WHERE phone LIKE '13800138%' OR phone LIKE '13900139%' OR phone LIKE '13700137%';"

# 清理测试技工
mysql -u root -p community_db -e "DELETE FROM worker_profiles WHERE phone LIKE '13900139%';"

# 清理测试服务商
mysql -u root -p community_db -e "DELETE FROM service_provider_profiles WHERE phone LIKE '13700137%';"

# 清理测试订单
mysql -u root -p community_db -e "DELETE FROM service_orders WHERE order_no LIKE 'SO20260422%';"
mysql -u root -p community_db -e "DELETE FROM market_orders WHERE order_no LIKE 'MO20260422%';"
mysql -u root -p community_db -e "DELETE FROM neighbor_assist_orders WHERE id >= 2000;"

# 清理测试商品
mysql -u root -p community_db -e "DELETE FROM market_goods WHERE id >= 100;"
mysql -u root -p community_db -e "DELETE FROM market_good_skus WHERE goods_id >= 100;"

# 清理测试商家
mysql -u root -p community_db -e "DELETE FROM market_shops WHERE id >= 30;"
```

### 8.2 重置自增ID

```bash
mysql -u root -p community_db -e "ALTER TABLE users AUTO_INCREMENT = 1;"
mysql -u root -p community_db -e "ALTER TABLE service_orders AUTO_INCREMENT = 1;"
mysql -u root -p community_db -e "ALTER TABLE market_orders AUTO_INCREMENT = 1;"
```

---

## 文档修订记录

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| v1.0 | 2026-04-22 | 测试团队 | 初始版本 |

---

**文档结束**
