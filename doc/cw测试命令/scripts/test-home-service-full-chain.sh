#!/bin/bash
#######################################################################
# 到家服务完整链路测试脚本
# 测试链路: 用户登录 → 绑定小区 → 创建订单 → 支付 → 技工接单 → 
#          建立对话 → 上门打卡 → 完成服务 → 用户确认 → 检查余额
# 执行方式: bash test-home-service-full-chain.sh
#######################################################################

set -e

BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
DB_NAME="${DB_NAME:-community_db}"
DB_USER="${DB_USER:-root}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo ""; echo "========================================"; echo "$1"; echo "========================================"; }

db_check() {
    local sql="$1"
    local desc="$2"
    log_info "数据库检查: $desc"
    mysql -u $DB_USER $DB_NAME -e "$sql" 2>/dev/null || log_warn "数据库查询失败，请手动检查"
}

main() {
    TIMESTAMP=$(date +%s)
    
    log_step "到家服务完整链路测试开始"
    log_info "测试时间: $(date)"
    log_info "BASE_URL: $BASE_URL"

    # ==================== 步骤1: 用户登录并绑定小区 ====================
    log_step "步骤1: 用户登录并绑定小区"
    
    log_info "1.1 用户微信授权登录"
    USER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"test_code_user_${TIMESTAMP}\",
            \"userInfo\": {
                \"nickName\": \"测试用户_${TIMESTAMP}\",
                \"avatarUrl\": \"https://example.com/avatar.jpg\"
            }
        }")
    
    USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
    USER_ID=$(echo $USER_LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    
    if [ -z "$USER_TOKEN" ]; then
        log_error "用户登录失败"
        echo "响应: $USER_LOGIN_RESPONSE"
        exit 1
    fi
    log_info "用户登录成功, ID: $USER_ID"
    
    log_info "1.2 绑定小区"
    BIND_RESPONSE=$(curl -s -X POST "$BASE_URL/user/bind-community" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{"community_id": 1}')
    log_info "绑定小区完成"
    
    db_check "SELECT id, nickname, community_id FROM users WHERE id = $USER_ID;" "用户数据入库且绑定小区"

    # ==================== 步骤2: 技工登录 ====================
    log_step "步骤2: 技工登录"
    
    log_info "2.1 技工微信授权登录"
    WORKER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"test_code_worker_${TIMESTAMP}\",
            \"userInfo\": {
                \"nickName\": \"测试技工_${TIMESTAMP}\",
                \"avatarUrl\": \"https://example.com/worker.jpg\"
            }
        }")
    
    WORKER_TOKEN=$(echo $WORKER_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
    WORKER_ID=$(echo $WORKER_LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    
    if [ -z "$WORKER_TOKEN" ]; then
        log_error "技工登录失败"
        exit 1
    fi
    log_info "技工登录成功, ID: $WORKER_ID"
    
    log_info "2.2 技工绑定小区"
    curl -s -X POST "$BASE_URL/user/bind-community" \
        -H "Authorization: Bearer $WORKER_TOKEN" \
        -d '{"community_id": 1}' > /dev/null
    log_info "技工绑定小区完成"

    # ==================== 步骤3: 创建订单 ====================
    log_step "步骤3: 创建订单（直约技工）"
    
    log_info "3.1 创建服务订单"
    CREATE_ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/service-orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d "{
            \"service_id\": 1,
            \"worker_id\": $WORKER_ID,
            \"community_id\": 1,
            \"address_snapshot\": {
                \"contact\": \"张三\",
                \"phone\": \"13800138000\",
                \"label\": \"上海合川路地铁站\",
                \"detail\": \"1号楼101室\",
                \"latitude\": 31.2304,
                \"longitude\": 121.4737
            },
            \"appointment_time\": \"$(date -d '+1 day' +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d) 10:00:00\",
            \"remark\": \"请准时上门服务\"
        }")
    
    ORDER_ID=$(echo $CREATE_ORDER_RESPONSE | grep -o '"order_id":[0-9]*' | sed 's/"order_id"://')
    ORDER_NO=$(echo $CREATE_ORDER_RESPONSE | grep -o '"order_no":"[^"]*"' | sed 's/"order_no":"//;s/"$//')
    
    if [ -z "$ORDER_ID" ]; then
        log_error "创建订单失败"
        echo "响应: $CREATE_ORDER_RESPONSE"
        exit 1
    fi
    log_info "订单创建成功, ID: $ORDER_ID, 订单号: $ORDER_NO"
    
    db_check "SELECT id, order_no, user_id, community_id, assigned_worker_id, status, pay_status, amount FROM service_orders WHERE id = $ORDER_ID;" "订单数据入库"
    db_check "SELECT so.id, so.community_id, c.name FROM service_orders so LEFT JOIN communities c ON so.community_id = c.id WHERE so.id = $ORDER_ID;" "订单绑定小区"

    # ==================== 步骤4: 支付订单 ====================
    log_step "步骤4: 支付订单"
    
    log_info "4.1 模拟支付订单"
    PAY_RESPONSE=$(curl -s -X POST "$BASE_URL/service-orders/$ORDER_ID/pay" \
        -H "Authorization: Bearer $USER_TOKEN")
    
    PAY_STATUS=$(echo $PAY_RESPONSE | grep -o '"pay_status":"[^"]*"' | sed 's/"pay_status":"//;s/"$//')
    log_info "支付状态: $PAY_STATUS"
    
    db_check "SELECT id, order_no, status, pay_status, amount FROM service_orders WHERE id = $ORDER_ID;" "支付状态验证"

    # ==================== 步骤5: 技工接单 ====================
    log_step "步骤5: 技工接单"
    
    log_info "5.1 技工接单"
    ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/accept" \
        -H "Authorization: Bearer $WORKER_TOKEN")
    
    ORDER_STATUS=$(echo $ACCEPT_RESPONSE | grep -o '"status":"[^"]*"' | sed 's/"status":"//;s/"$//')
    log_info "订单状态: $ORDER_STATUS"
    
    db_check "SELECT id, order_no, status, assigned_worker_id FROM service_orders WHERE id = $ORDER_ID;" "技工接单状态"

    # ==================== 步骤6: 建立对话 ====================
    log_step "步骤6: 建立对话（用户与技工）"
    
    log_info "6.1 用户发送消息给技工"
    SEND_MSG_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d "{
            \"peerId\": $WORKER_ID,
            \"content\": \"您好，请问什么时候能上门服务？\",
            \"msgType\": \"text\"
        }")
    
    CONVERSATION_ID=$(echo $SEND_MSG_RESPONSE | grep -o '"conversation_id":[0-9]*' | sed 's/"conversation_id"://')
    log_info "会话ID: $CONVERSATION_ID"
    
    if [ -n "$CONVERSATION_ID" ]; then
        db_check "SELECT id, type, last_message_preview FROM conversations WHERE id = $CONVERSATION_ID;" "会话创建"
        db_check "SELECT user_id, conversation_id, peer_id FROM user_conversations WHERE conversation_id = $CONVERSATION_ID;" "用户会话映射"
        db_check "SELECT id, conversation_id, sender_id, content FROM messages WHERE conversation_id = $CONVERSATION_ID;" "消息记录"
    else
        log_warn "会话ID未获取，跳过对话检查"
    fi

    # ==================== 步骤7: 查看地址信息 ====================
    log_step "步骤7: 查看订单地址信息"
    
    log_info "7.1 技工查看订单详情"
    ORDER_DETAIL=$(curl -s -X GET "$BASE_URL/worker/service-orders/$ORDER_ID" \
        -H "Authorization: Bearer $WORKER_TOKEN")
    
    db_check "SELECT id, order_no, address_snapshot, contact_name, contact_phone, appointment_time FROM service_orders WHERE id = $ORDER_ID;" "地址信息"

    # ==================== 步骤8: 上门打卡拍照 ====================
    log_step "步骤8: 上门打卡拍照"
    
    log_info "8.1 技工上门打卡"
    CHECKIN_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/check-in" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WORKER_TOKEN" \
        -d '{
            "latitude": 31.2304,
            "longitude": 121.4737,
            "address": "上海市闵行区合川路地铁站1号楼101室"
        }')
    log_info "打卡完成"
    
    log_info "8.2 技工上传服务前证据"
    EVIDENCE_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/evidence" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WORKER_TOKEN" \
        -d '{
            "type": "before",
            "images": ["/uploads/evidence/before_1.jpg", "/uploads/evidence/before_2.jpg"]
        }')
    log_info "证据上传完成"
    
    db_check "SELECT id, order_id, check_in_time, latitude, longitude, address FROM service_order_check_ins WHERE order_id = $ORDER_ID;" "打卡记录"
    db_check "SELECT id, order_id, type, images FROM service_order_evidence WHERE order_id = $ORDER_ID;" "证据记录"

    # ==================== 步骤9: 完成服务打卡拍照 ====================
    log_step "步骤9: 完成服务打卡拍照"
    
    log_info "9.1 技工完成服务"
    COMPLETE_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/complete" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WORKER_TOKEN" \
        -d '{
            "images": ["/uploads/evidence/after_1.jpg", "/uploads/evidence/after_2.jpg"],
            "note": "服务已完成，请确认"
        }')
    
    ORDER_STATUS=$(echo $COMPLETE_RESPONSE | grep -o '"status":"[^"]*"' | sed 's/"status":"//;s/"$//')
    log_info "订单状态: $ORDER_STATUS"
    
    db_check "SELECT id, order_no, status FROM service_orders WHERE id = $ORDER_ID;" "服务完成状态"

    # ==================== 步骤10: 用户确认完成 ====================
    log_step "步骤10: 用户确认完成"
    
    log_info "10.1 用户确认完成"
    CONFIRM_RESPONSE=$(curl -s -X POST "$BASE_URL/service-orders/$ORDER_ID/confirm-complete" \
        -H "Authorization: Bearer $USER_TOKEN")
    
    ORDER_STATUS=$(echo $CONFIRM_RESPONSE | grep -o '"status":"[^"]*"' | sed 's/"status":"//;s/"$//')
    log_info "订单状态: $ORDER_STATUS"
    
    db_check "SELECT id, order_no, status, pay_status, amount FROM service_orders WHERE id = $ORDER_ID;" "订单完成状态"

    # ==================== 步骤11: 检查技工余额 ====================
    log_step "步骤11: 检查技工余额"
    
    log_info "11.1 查看技工余额"
    BALANCE_RESPONSE=$(curl -s -X GET "$BASE_URL/user/profile" \
        -H "Authorization: Bearer $WORKER_TOKEN")
    
    db_check "SELECT id, nickname, balance FROM users WHERE id = $WORKER_ID;" "技工余额"

    # ==================== 步骤12: 后台查看数据 ====================
    log_step "步骤12: 后台查看订单数据"
    
    log_info "12.1 管理员登录"
    ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/admin/login" \
        -H "Content-Type: application/json" \
        -d '{"username": "admin", "password": "admin123"}')
    
    ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
    
    if [ -n "$ADMIN_TOKEN" ]; then
        log_info "12.2 管理员查看订单详情"
        curl -s -X GET "$BASE_URL/admin/service-orders/$ORDER_ID" \
            -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 500
        echo ""
    else
        log_warn "管理员登录失败，跳过后台检查"
    fi
    
    db_check "SELECT * FROM service_orders WHERE id = $ORDER_ID\\G" "订单完整信息"

    # ==================== 测试完成 ====================
    log_step "测试完成"
    
    echo ""
    echo "==================== 测试摘要 ===================="
    echo "测试时间: $(date)"
    echo "订单ID: $ORDER_ID"
    echo "订单号: $ORDER_NO"
    echo "用户ID: $USER_ID"
    echo "技工ID: $WORKER_ID"
    echo "会话ID: ${CONVERSATION_ID:-未创建}"
    echo "=================================================="
}

main "$@"
