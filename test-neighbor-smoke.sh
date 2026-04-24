#!/bin/bash
# 第一阶段：接口连通性测试
BASE="http://localhost:3001/api/v1"
FAIL=0

echo "===== 阶段1: 接口连通性测试 ====="

# 测试1: 登录
TOKEN=$(curl -s -X POST "$BASE/auth/login_password" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"password123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -n "$TOKEN" ]; then echo "✅ 登录成功"; else echo "❌ 登录失败"; FAIL=$((FAIL+1)); fi

# 测试2: 创建订单接口
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/neighbor-assist/orders" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"assist_type":"take","origin_address_snapshot":{"address":"test"},"destination_address_snapshot":{"address":"test"}}')
[ "$RESP" = "200" ] || [ "$RESP" = "201" ] && echo "✅ 创建订单接口正常" || { echo "❌ 创建订单接口异常 ($RESP)"; FAIL=$((FAIL+1)); }

# 测试3: 我的订单列表
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/neighbor-assist/orders/my?role=publisher" \
  -H "Authorization: Bearer $TOKEN")
[ "$RESP" = "200" ] && echo "✅ 订单列表接口正常" || { echo "❌ 订单列表接口异常 ($RESP)"; FAIL=$((FAIL+1)); }

# 测试4: 订单详情
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/neighbor-assist/orders/1" \
  -H "Authorization: Bearer $TOKEN")
[ "$RESP" = "200" ] || [ "$RESP" = "404" ] && echo "✅ 订单详情接口存在" || { echo "❌ 订单详情接口不存在 ($RESP)"; FAIL=$((FAIL+1)); }

[ $FAIL -gt 0 ] && echo -e "\n❌ 发现 $FAIL 个接口问题，请先修复后再继续" && exit 1
echo -e "\n✅ 所有接口连通性测试通过"
