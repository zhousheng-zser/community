# 业务功能联合测试脚本
# 测试角色: 用户、商家、服务商、管理员
# 测试目标: 完整订单流程、退单流程、管理员介入

$BASE_URL = "https://jshsp1.eds-tech.cn"
$USER_TOKEN = ""
$MERCHANT_TOKEN = ""
$ADMIN_TOKEN = ""

function Write-TestResult {
    param($TestName, $Status, $Message)
    $color = if ($Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$Status] $TestName : $Message" -ForegroundColor $color
}

# ========================================
# 第一步: 用户登录
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第一步: 用户登录测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $loginBody = @{
        code = "test_code_user_123"
        nickname = "测试用户"
        phone = "13800138000"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    $USER_TOKEN = $result.token
    Write-TestResult "用户登录" "PASS" "获取Token成功: $USER_TOKEN"
} catch {
    Write-TestResult "用户登录" "FAIL" $_.Exception.Message
    Write-Host "尝试使用已有用户查询..."
}

# ========================================
# 第二步: 商家登录
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第二步: 商家登录测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $merchantLoginBody = @{
        phone = "13800138001"
        password = "merchant123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/merchant-portal/login" -Method POST -Body $merchantLoginBody -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    $MERCHANT_TOKEN = $result.token
    Write-TestResult "商家登录" "PASS" "获取Token成功"
} catch {
    Write-TestResult "商家登录" "FAIL" $_.Exception.Message
}

# ========================================
# 第三步: 查看店铺列表（用户视角）
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第三步: 用户浏览店铺" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/market/shops" -Method GET -UseBasicParsing
    $result = $result = $response.Content | ConvertFrom-Json
    if ($result.list) {
        $shopCount = $result.list.Count
        Write-TestResult "店铺列表" "PASS" "获取到 $shopCount 个店铺"
        if ($shopCount -gt 0) {
            $firstShop = $result.list[0]
            Write-Host "  第一个店铺: $($firstShop.name) (ID: $($firstShop.id))" -ForegroundColor Yellow
        }
    } else {
        Write-TestResult "店铺列表" "WARN" "店铺列表为空"
    }
} catch {
    Write-TestResult "店铺列表" "FAIL" $_.Exception.Message
}

# ========================================
# 第四步: 查看商品列表
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第四步: 用户浏览商品" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/market/shops/1/goods" -Method GET -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    if ($result.list) {
        $goodsCount = $result.list.Count
        Write-TestResult "商品列表" "PASS" "获取到 $goodsCount 个商品"
        if ($goodsCount -gt 0) {
            $firstGoods = $result.list[0]
            Write-Host "  第一个商品: $($firstGoods.name) (ID: $($firstGoods.id), 价格: ¥$($firstGoods.price))" -ForegroundColor Yellow
        }
    } else {
        Write-TestResult "商品列表" "WARN" "商品列表为空"
    }
} catch {
    Write-TestResult "商品列表" "FAIL" $_.Exception.Message
}

# ========================================
# 第五步: 用户下单测试
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第五步: 用户创建订单" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $orderBody = @{
        items = @(
            @{
                goods_id = 1
                quantity = 2
                sku_id = $null
            }
        )
        address_id = 1
        remark = "测试订单-联合测试"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $USER_TOKEN"
    }

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/market/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    $orderNo = $result.order_no
    Write-TestResult "创建订单" "PASS" "订单号: $orderNo"
} catch {
    Write-TestResult "创建订单" "FAIL" $_.Exception.Message
}

# ========================================
# 第六步: 商家查看订单
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第六步: 商家查看订单" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $MERCHANT_TOKEN"
    }

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/merchant/orders?status=pending" -Method GET -Headers $headers -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    if ($result.list) {
        $orderCount = $result.list.Count
        Write-TestResult "商家订单列表" "PASS" "待接单订单数: $orderCount"
        if ($orderCount -gt 0) {
            $pendingOrder = $result.list[0]
            Write-Host "  订单号: $($pendingOrder.order_no), 状态: $($pendingOrder.status)" -ForegroundColor Yellow
        }
    } else {
        Write-TestResult "商家订单列表" "WARN" "订单列表为空"
    }
} catch {
    Write-TestResult "商家订单列表" "FAIL" $_.Exception.Message
}

# ========================================
# 第七步: 商家接单
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第七步: 商家接单测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $MERCHANT_TOKEN"
    }

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/merchant/orders/$orderNo/accept" -Method POST -Headers $headers -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult "商家接单" "PASS" "接单成功"
} catch {
    Write-TestResult "商家接单" "FAIL" $_.Exception.Message
}

# ========================================
# 第八步: 用户查看订单状态
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第八步: 用户查看订单状态" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $USER_TOKEN"
    }

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/market/orders" -Method GET -Headers $headers -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    if ($result.list) {
        Write-TestResult "用户订单列表" "PASS" "订单总数: $($result.list.Count)"
        $userOrder = $result.list | Where-Object { $_.order_no -eq $orderNo }
        if ($userOrder) {
            Write-Host "  订单状态: $($userOrder.status)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-TestResult "用户订单列表" "FAIL" $_.Exception.Message
}

# ========================================
# 第九步: 测试社区发帖
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "第九步: 社区功能测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $postBody = @{
        content = "这是一条测试帖子 - 联合测试"
        category = "邻里互动"
        images = @()
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $USER_TOKEN"
    }

    $response = Invoke-WebRequest -Uri "$BASE_URL/api/v1/posts" -Method POST -Body $postBody -ContentType "application/json" -Headers $headers -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult "发布帖子" "PASS" "帖子ID: $($result.id)"
} catch {
    Write-TestResult "发布帖子" "FAIL" $_.Exception.Message
}

# ========================================
# 总结
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
