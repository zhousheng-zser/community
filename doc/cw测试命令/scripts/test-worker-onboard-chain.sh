#!/bin/bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "  技工入驻完整链路测试"
echo "=========================================="

echo ""
echo "【步骤1】用户登录"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_worker_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"测试技工_${TIMESTAMP}\"}}")

USER_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户ID: $USER_ID"

if [ -z "$USER_TOKEN" ]; then
  echo "❌ 用户登录失败"
  exit 1
fi

echo ""
echo "【步骤2】提交技工入驻申请"
APPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/worker/apply" \
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
  }')

echo "申请响应: $APPLY_RESPONSE"
APP_ID=$(echo $APPLY_RESPONSE | grep -o '"application_id":[0-9]*' | sed 's/"application_id"://')
echo "申请ID: $APP_ID"

echo ""
echo "【步骤3】管理员登录"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
echo "管理员Token: ${ADMIN_TOKEN:0:20}..."

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 管理员登录失败"
  exit 1
fi

echo ""
echo "【步骤4】管理员审核通过"
if [ -n "$APP_ID" ]; then
  AUDIT_RESPONSE=$(curl -s -X PUT "$BASE_URL/admin/worker-applications/$APP_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"status": "approved", "review_note": "资质齐全，审核通过"}')
  echo "审核响应: $AUDIT_RESPONSE"
else
  echo "⚠️ 跳过审核（申请ID为空）"
fi

echo ""
echo "=========================================="
echo "  技工入驻完整链路测试完成"
echo "=========================================="
