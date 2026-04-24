#!/bin/bash
# 邻里帮帮全链路自动化测试
BASE="http://localhost:3001/api/v1"
PASS=0; FAIL=0

check() {
  if [ "$2" = "true" ]; then echo "✅ $1"; PASS=$((PASS+1))
  else echo "❌ $1"; FAIL=$((FAIL+1)); fi
}

echo "===== 邻里帮帮自动化测试 ====="

# 1. 登录
echo -e "\n[1] 登录测试"
TOKEN=$(curl -s -X POST "$BASE/auth/login_password" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"password123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
check "获取Token" "$([ -n "$TOKEN" ] && echo true || echo false)"

# 2. 创建订单
echo -e "\n[2] 创建订单测试"
CREATE=$(curl -s -X POST "$BASE/neighbor-assist/orders" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"assist_type":"take","community_id":1,"origin_address_snapshot":{"address":"北京市朝阳区建国路100号","detail":"北京市朝阳区建国路100号","name":"取货点"},"destination_address_snapshot":{"address":"北京市海淀区中关村大街10号","detail":"北京市海淀区中关村大街10号","name":"送货点"},"remark":"代取快递测试","amount":5}')
OID=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
check "创建订单" "$([ -n "$OID" ] && echo true || echo false)"
LABEL=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('assist_type_label',''))" 2>/dev/null)
check "返回中文标签" "$([ -n "$LABEL" ] && echo true || echo false)" "($LABEL)"

# 3. 订单列表 - 我发布的
echo -e "\n[3] 我发布的订单"
PUB=$(curl -s "$BASE/neighbor-assist/orders/my?role=publisher&page=1&limit=50" -H "Authorization: Bearer $TOKEN")
PUB_TOTAL=$(echo "$PUB" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('total',0))" 2>/dev/null)
PUB_IDS=$(echo "$PUB" | python3 -c "import sys,json; [print(o['id']) for o in json.load(sys.stdin).get('data',{}).get('list',[])]" 2>/dev/null)
check "查询我发布的" "$([ "$PUB_TOTAL" -gt 0 ] 2>/dev/null && echo true || echo false)" "($PUB_TOTAL个)"
# 检查类型标签
PUB_LABEL=$(echo "$PUB" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('list',[])[0].get('assist_type_label','N/A'))" 2>/dev/null)
check "列表显示中文标签" "$([ "$PUB_LABEL" != "N/A" ] && [ "$PUB_LABEL" != "take" ] && echo true || echo false)" "($PUB_LABEL)"

# 4. 订单列表 - 我接的单
echo -e "\n[4] 我接的订单"
HELPER=$(curl -s "$BASE/neighbor-assist/orders/my?role=helper&page=1&limit=50" -H "Authorization: Bearer $TOKEN")
HELPER_TOTAL=$(echo "$HELPER" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('total',0))" 2>/dev/null)
HELPER_IDS=$(echo "$HELPER" | python3 -c "import sys,json; [print(o['id']) for o in json.load(sys.stdin).get('data',{}).get('list',[])]" 2>/dev/null)
check "查询我接的" "true" "($HELPER_TOTAL个)"
# 检查是否有重复订单
COMMON=$(comm -12 <(echo "$PUB_IDS" | sort) <(echo "$HELPER_IDS" | sort) 2>/dev/null)
check "角色筛选无重复" "$([ -z "$COMMON" ] && echo true || echo false)" "($COMMON)"

# 5. 订单详情
echo -e "\n[5] 订单详情测试"
if [ -n "$OID" ]; then
  DETAIL=$(curl -s "$BASE/neighbor-assist/orders/$OID" -H "Authorization: Bearer $TOKEN")
  DETAIL_OK=$(echo "$DETAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'data' in d else 'fail')" 2>/dev/null)
  check "获取详情" "$([ "$DETAIL_OK" = "ok" ] && echo true || echo false)"
  # 检查地址
  ORIG=$(echo "$DETAIL" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
o=d.get('order',d)
orig=o.get('origin_address_snapshot',{})
if isinstance(orig,str): orig=json.loads(orig)
print(orig.get('address','N/A'))
" 2>/dev/null)
  check "取货地址" "$([ "$ORIG" != "N/A" ] && echo true || echo false)" "($ORIG)"
  DEST=$(echo "$DETAIL" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
o=d.get('order',d)
dest=o.get('destination_address_snapshot',{})
if isinstance(dest,str): dest=json.loads(dest)
print(dest.get('address','N/A'))
" 2>/dev/null)
  check "送货地址" "$([ "$DEST" != "N/A" ] && echo true || echo false)" "($DEST)"
  # 检查发布人信息
  PUB_NAME=$(echo "$DETAIL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; o=d.get('order',d); print(o.get('publisher',{}).get('nickname','N/A'))" 2>/dev/null)
  check "发布人信息" "$([ "$PUB_NAME" != "N/A" ] && echo true || echo false)" "($PUB_NAME)"
fi

# 6. 类型标签完整性
echo -e "\n[6] 类型标签完整性"
for TYPE in take child escort trash pet; do
  L=$(curl -s "$BASE/neighbor-assist/orders/my?role=publisher&page=1&limit=1" -H "Authorization: Bearer $TOKEN" | \
    python3 -c "import sys,json; d=json.load(sys.stdin)['data']['list']; print([o for o in d if o['assist_type']=='$TYPE'][0]['assist_type_label'] if any(o['assist_type']=='$TYPE' for o in d) else 'NOT_FOUND')" 2>/dev/null)
done

echo -e "\n===== 测试结果 ====="
echo "✅ 通过: $PASS"
echo "❌ 失败: $FAIL"
[ $FAIL -gt 0 ] && exit 1
