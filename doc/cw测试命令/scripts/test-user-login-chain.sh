#!/bin/bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "  用户注册登录完整链路测试"
echo "=========================================="

echo ""
echo "【步骤1】微信授权登录"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_user_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"测试用户_${TIMESTAMP}\", \"avatarUrl\": \"https://example.com/avatar.jpg\"}}")

echo "响应: $LOGIN_RESPONSE"
USER_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户Token: $USER_TOKEN"
echo "用户ID: $USER_ID"

if [ -z "$USER_TOKEN" ]; then
  echo "❌ 用户登录失败"
  exit 1
fi
echo "✅ 用户登录成功"

echo ""
echo "【步骤2】绑定小区"
BIND_RESPONSE=$(curl -s -X POST "$BASE_URL/user/bind-community" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"community_id": 1}')
echo "响应: $BIND_RESPONSE"

echo ""
echo "【步骤3】验证Token有效性"
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/user/profile" \
  -H "Authorization: Bearer $USER_TOKEN")
echo "用户信息: $PROFILE_RESPONSE"

echo ""
echo "=========================================="
echo "  用户注册登录完整链路测试完成"
echo "=========================================="
