#!/bin/bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "  消息对话完整链路测试"
echo "=========================================="

echo ""
echo "【步骤1】用户A登录"
USER_A_LOGIN=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_user_a_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"用户A\"}}")
USER_A_TOKEN=$(echo $USER_A_LOGIN | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_A_ID=$(echo $USER_A_LOGIN | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户A ID: $USER_A_ID"

echo ""
echo "【步骤2】用户B登录"
USER_B_LOGIN=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_user_b_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"用户B\"}}")
USER_B_TOKEN=$(echo $USER_B_LOGIN | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_B_ID=$(echo $USER_B_LOGIN | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户B ID: $USER_B_ID"

if [ -z "$USER_A_TOKEN" ] || [ -z "$USER_B_TOKEN" ]; then
  echo "❌ 用户登录失败"
  exit 1
fi

echo ""
echo "【步骤3】用户A发送消息给用户B"
SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d "{\"peerId\": $USER_B_ID, \"content\": \"你好，这是第一条消息\", \"msgType\": \"text\"}")

echo "发送响应: $SEND_RESPONSE"
CONVERSATION_ID=$(echo $SEND_RESPONSE | grep -o '"conversation_id":[0-9]*' | sed 's/"conversation_id"://')
echo "会话ID: $CONVERSATION_ID"

echo ""
echo "【步骤4】用户B查看会话列表"
CONV_LIST=$(curl -s -X GET "$BASE_URL/messages/conversations" \
  -H "Authorization: Bearer $USER_B_TOKEN")
echo "会话列表: $CONV_LIST"

echo ""
echo "【步骤5】用户B查看消息历史"
if [ -n "$CONVERSATION_ID" ]; then
  HISTORY=$(curl -s -X GET "$BASE_URL/messages/history/$CONVERSATION_ID" \
    -H "Authorization: Bearer $USER_B_TOKEN")
  echo "消息历史: $HISTORY"
fi

echo ""
echo "【步骤6】用户B回复消息"
REPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -d "{\"peerId\": $USER_A_ID, \"content\": \"收到，这是回复\", \"msgType\": \"text\"}")
echo "回复响应: $REPLY_RESPONSE"

echo ""
echo "=========================================="
echo "  消息对话完整链路测试完成"
echo "=========================================="
