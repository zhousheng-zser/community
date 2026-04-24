#!/bin/bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "  到家服务完整链路测试"
echo "=========================================="

echo ""
echo "【步骤1】用户登录并绑定小区"
USER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_user_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"测试用户_${TIMESTAMP}\"}}")

USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_ID=$(echo $USER_LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户ID: $USER_ID"

if [ -z "$USER_TOKEN" ]; then
  echo "❌ 用户登录失败"
  exit 1
fi

curl -s -X POST "$BASE_URL/user/bind-community" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"community_id": 1}' > /dev/null
echo "✅ 用户绑定小区完成"

echo ""
echo "【步骤2】技工登录并绑定小区"
WORKER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_worker_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"测试技工_${TIMESTAMP}\"}}")

WORKER_TOKEN=$(echo $WORKER_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
WORKER_ID=$(echo $WORKER_LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "技工ID: $WORKER_ID"

curl -s -X POST "$BASE_URL/user/bind-community" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{"community_id": 1}' > /dev/null
echo "✅ 技工绑定小区完成"

echo ""
echo "【步骤3】创建订单（直约技工）"
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
    \"appointment_time\": \"2026-04-23 10:00:00\",
    \"remark\": \"请准时上门服务\"
  }")

echo "创建订单响应: $CREATE_ORDER_RESPONSE"
ORDER_ID=$(echo $CREATE_ORDER_RESPONSE | grep -o '"order_id":[0-9]*' | sed 's/"order_id"://')
ORDER_NO=$(echo $CREATE_ORDER_RESPONSE | grep -o '"order_no":"[^"]*"' | sed 's/"order_no":"//;s/"$//')
echo "订单ID: $ORDER_ID, 订单号: $ORDER_NO"

if [ -z "$ORDER_ID" ]; then
  echo "❌ 创建订单失败"
  exit 1
fi
echo "✅ 创建订单成功"

echo ""
echo "【步骤4】支付订单"
PAY_RESPONSE=$(curl -s -X POST "$BASE_URL/service-orders/$ORDER_ID/pay" \
  -H "Authorization: Bearer $USER_TOKEN")
echo "支付响应: $PAY_RESPONSE"
PAY_STATUS=$(echo $PAY_RESPONSE | grep -o '"pay_status":"[^"]*"' | sed 's/"pay_status":"//;s/"$//')
echo "支付状态: $PAY_STATUS"

echo ""
echo "【步骤5】技工接单"
ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/accept" \
  -H "Authorization: Bearer $WORKER_TOKEN")
echo "接单响应: $ACCEPT_RESPONSE"

echo ""
echo "【步骤6】建立对话（用户发送消息给技工）"
SEND_MSG_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{\"peerId\": $WORKER_ID, \"content\": \"您好，请问什么时候能上门服务？\", \"msgType\": \"text\"}")

echo "消息响应: $SEND_MSG_RESPONSE"
CONVERSATION_ID=$(echo $SEND_MSG_RESPONSE | grep -o '"conversation_id":[0-9]*' | sed 's/"conversation_id"://')
echo "会话ID: $CONVERSATION_ID"

echo ""
echo "【步骤7】上门打卡"
CHECKIN_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/check-in" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{
    "latitude": 31.2304,
    "longitude": 121.4737,
    "address": "上海市闵行区合川路地铁站1号楼101室"
  }')
echo "打卡响应: $CHECKIN_RESPONSE"

echo ""
echo "【步骤8】完成服务"
COMPLETE_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/service-orders/$ORDER_ID/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{
    "images": ["/uploads/evidence/after_1.jpg"],
    "note": "服务已完成，请确认"
  }')
echo "完成响应: $COMPLETE_RESPONSE"

echo ""
echo "【步骤9】用户确认完成"
CONFIRM_RESPONSE=$(curl -s -X POST "$BASE_URL/service-orders/$ORDER_ID/confirm-complete" \
  -H "Authorization: Bearer $USER_TOKEN")
echo "确认响应: $CONFIRM_RESPONSE"

echo ""
echo "【步骤10】检查技工余额"
BALANCE_RESPONSE=$(curl -s -X GET "$BASE_URL/user/profile" \
  -H "Authorization: Bearer $WORKER_TOKEN")
echo "技工余额: $BALANCE_RESPONSE"

echo ""
echo "=========================================="
echo "  到家服务完整链路测试完成"
echo "=========================================="
