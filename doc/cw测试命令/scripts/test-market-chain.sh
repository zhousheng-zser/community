#!/bin/bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3099/api/v1}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "  本地集市完整链路测试"
echo "=========================================="

echo ""
echo "【步骤1】用户登录"
USER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/wechat/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code_market_${TIMESTAMP}\", \"userInfo\": {\"nickName\": \"集市用户_${TIMESTAMP}\"}}")

USER_TOKEN=$(echo $USER_LOGIN | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
USER_ID=$(echo $USER_LOGIN | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "用户ID: $USER_ID"

if [ -z "$USER_TOKEN" ]; then
  echo "❌ 用户登录失败"
  exit 1
fi

echo ""
echo "【步骤2】查看商品列表"
GOODS_LIST=$(curl -s -X GET "$BASE_URL/market/goods?page=1&limit=10")
echo "商品列表: ${GOODS_LIST:0:200}..."

echo ""
echo "【步骤3】加入购物车"
ADD_CART=$(curl -s -X POST "$BASE_URL/market/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"goods_id": 1, "sku_id": "sku_1", "quantity": 2}')
echo "加入购物车: $ADD_CART"

echo ""
echo "【步骤4】创建订单"
CREATE_ORDER=$(curl -s -X POST "$BASE_URL/market/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "items": [{"goods_id": 1, "sku_id": "sku_1", "quantity": 2}],
    "address": {"contact": "张三", "phone": "13800138000", "detail": "1号楼101室"}
  }')

echo "创建订单响应: $CREATE_ORDER"
ORDER_NO=$(echo $CREATE_ORDER | grep -o '"order_no":"[^"]*"' | sed 's/"order_no":"//;s/"$//')
echo "订单号: $ORDER_NO"

echo ""
echo "【步骤5】支付订单"
if [ -n "$ORDER_NO" ]; then
  PAY_RESPONSE=$(curl -s -X POST "$BASE_URL/market/orders/$ORDER_NO/pay" \
    -H "Authorization: Bearer $USER_TOKEN")
  echo "支付响应: $PAY_RESPONSE"
else
  echo "⚠️ 跳过支付（订单号为空）"
fi

echo ""
echo "=========================================="
echo "  本地集市完整链路测试完成"
echo "=========================================="
