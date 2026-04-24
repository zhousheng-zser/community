#!/bin/bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "  邻里帮帮完整链路测试"
echo "=========================================="

echo ""
echo "【步骤1】用户登录"
USER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_assist_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"帮帮用户_${TIMESTAMP}\"}}")

USER_TOKEN=$(echo $USER_LOGIN | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_ID=$(echo $USER_LOGIN | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户ID: $USER_ID"

if [ -z "$USER_TOKEN" ]; then
  echo "❌ 用户登录失败"
  exit 1
fi

echo ""
echo "【步骤2】绑定小区"
curl -s -X POST "$BASE_URL/user/bind-community" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"community_id": 1}' > /dev/null
echo "✅ 绑定小区完成"

echo ""
echo "【步骤3】发布帮帮需求"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/neighbor-assist/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "title": "帮忙取快递",
    "description": "帮忙到菜鸟驿站取一个快递",
    "category": "跑腿",
    "reward": 10.00,
    "community_id": 1,
    "address": "1号楼101室",
    "contact_phone": "13800138000"
  }')

echo "创建响应: $CREATE_RESPONSE"
ORDER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "订单ID: $ORDER_ID"

echo ""
echo "【步骤4】支付报酬"
if [ -n "$ORDER_ID" ]; then
  PAY_RESPONSE=$(curl -s -X POST "$BASE_URL/neighbor-assist/orders/$ORDER_ID/pay" \
    -H "Authorization: Bearer $USER_TOKEN")
  echo "支付响应: $PAY_RESPONSE"
else
  echo "⚠️ 跳过支付（订单ID为空）"
fi

echo ""
echo "【步骤5】技工登录并查看待派单池"
WORKER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_worker_assist_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"帮帮技工_${TIMESTAMP}\"}}")

WORKER_TOKEN=$(echo $WORKER_LOGIN | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
WORKER_ID=$(echo $WORKER_LOGIN | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

curl -s -X POST "$BASE_URL/user/bind-community" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d '{"community_id": 1}' > /dev/null

POOL_RESPONSE=$(curl -s -X GET "$BASE_URL/worker/neighbor-assist/pool?limit=50" \
  -H "Authorization: Bearer $WORKER_TOKEN")
echo "待派单池: ${POOL_RESPONSE:0:200}..."

echo ""
echo "【步骤6】技工抢单"
if [ -n "$ORDER_ID" ]; then
  GRAB_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/neighbor-assist/orders/$ORDER_ID/grab" \
    -H "Authorization: Bearer $WORKER_TOKEN")
  echo "抢单响应: $GRAB_RESPONSE"
fi

echo ""
echo "=========================================="
echo "  邻里帮帮完整链路测试完成"
echo "=========================================="
