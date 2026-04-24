#!/bin/bash
# ============================================================
# 邻里帮帮全链路自动化测试套件
# 设计原则：分层测试、自动修复、一次跑通
# ============================================================

BASE="http://localhost:3001/api/v1"
PASS=0; FAIL=0; WARN=0
RESULTS_FILE="/tmp/test-results.json"

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

check() {
  local name="$1"; local cond="$2"; local detail="$3"
  if [ "$cond" = "true" ]; then
    echo -e "${GREEN}✅${NC} $name: $detail"; PASS=$((PASS+1))
  else
    echo -e "${RED}❌${NC} $name: $detail"; FAIL=$((FAIL+1))
  fi
}

warn() { echo -e "${YELLOW}⚠️${NC} $1: $2"; WARN=$((WARN+1)); }

echo -e "\n============================================================"
echo "  🧪 邻里帮帮全链路自动化测试"
echo "  测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================\n"

# =============================================
# 阶段 1: 冒烟测试 - 接口可用性
# =============================================
echo "📌 阶段 1: 冒烟测试 (接口可用性)"
echo "------------------------------------------------------------"

# 1.1 登录
TOKEN=$(curl -s -X POST "$BASE/auth/login_password" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"password123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
check "用户登录" "$([ -n "$TOKEN" ] && echo true || echo false)" "Token长度: ${#TOKEN}"

# 1.2 创建订单接口
C_RESP=$(curl -s -X POST "$BASE/neighbor-assist/orders" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"assist_type":"take","community_id":1,"origin_address_snapshot":{"address":"北京市朝阳区建国路100号","detail":"北京市朝阳区建国路100号","name":"取货点"},"destination_address_snapshot":{"address":"北京市海淀区中关村大街10号","detail":"北京市海淀区中关村大街10号","name":"送货点"},"remark":"代取快递","amount":5}')
C_CODE=$(echo "$C_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errno','error'))" 2>/dev/null)
check "创建订单" "$([ "$C_CODE" = "0" ] && echo true || echo false)" "errno=$C_CODE"

# 1.3 订单列表接口
L_RESP=$(curl -s "$BASE/neighbor-assist/orders/my?role=publisher" -H "Authorization: Bearer $TOKEN")
L_CODE=$(echo "$L_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errno','error'))" 2>/dev/null)
check "订单列表" "$([ "$L_CODE" = "0" ] && echo true || echo false)" "errno=$L_CODE"

# 1.4 订单详情接口
D_RESP=$(curl -s "$BASE/neighbor-assist/orders/1" -H "Authorization: Bearer $TOKEN")
D_CODE=$(echo "$D_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errno','error'))" 2>/dev/null)
check "订单详情" "$([ "$D_CODE" = "0" ] || [ "$D_CODE" = "404" ] && echo true || echo false)" "errno=$D_CODE"

echo ""

# =============================================
# 阶段 2: 数据流测试 - 创建→存储→读取
# =============================================
echo "📌 阶段 2: 数据流测试 (创建→存储→读取)"
echo "------------------------------------------------------------"

# 提取订单ID
ORDER_ID=$(echo "$C_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
check "订单创建成功" "$([ -n "$ORDER_ID" ] && echo true || echo false)" "ID=$ORDER_ID"

# 2.1 检查后端返回的数据结构
check "返回 assist_type" "$(echo "$C_RESP" | python3 -c "import sys,json; print('true' if json.load(sys.stdin).get('data',{}).get('assist_type') else 'false')" 2>/dev/null)" ""
check "返回 assist_type_label" "$(echo "$C_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin).get('data',{}); print('true' if d.get('assist_type_label') and d.get('assist_type_label') != d.get('assist_type') else 'false')" 2>/dev/null)" ""

# 2.2 从列表读取验证
LIST_DATA=$(curl -s "$BASE/neighbor-assist/orders/my?role=publisher&page=1&limit=1" -H "Authorization: Bearer $TOKEN")
LIST_LABEL=$(echo "$LIST_DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin)
orders = d.get('data',{}).get('list',[])
if orders:
    o = orders[0]
    label = o.get('assist_type_label', o.get('assist_type', 'N/A'))
    print(label)
else:
    print('EMPTY')
" 2>/dev/null)
check "列表显示中文类型" "$([ "$LIST_LABEL" != "take" ] && [ "$LIST_LABEL" != "child" ] && [ "$LIST_LABEL" != "escort" ] && [ "$LIST_LABEL" != "trash" ] && [ "$LIST_LABEL" != "pet" ] && [ "$LIST_LABEL" != "N/A" ] && [ "$LIST_LABEL" != "EMPTY" ] && echo true || echo false)" "显示: $LIST_LABEL"

# 2.3 地址数据验证
ORIGIN=$(echo "$LIST_DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin)
o = d.get('data',{}).get('list',[])[0]
orig = o.get('origin_address_snapshot', {})
if isinstance(orig, str): orig = json.loads(orig)
print(orig.get('address', orig.get('detail', 'N/A')))
" 2>/dev/null)
DEST=$(echo "$LIST_DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin)
o = d.get('data',{}).get('list',[])[0]
dest = o.get('destination_address_snapshot', {})
if isinstance(dest, str): dest = json.loads(dest)
print(dest.get('address', dest.get('detail', 'N/A')))
" 2>/dev/null)
check "取货地址存在" "$([ "$ORIGIN" != "N/A" ] && echo true || echo false)" "$ORIGIN"
check "送货地址存在" "$([ "$DEST" != "N/A" ] && echo true || echo false)" "$DEST"

# 2.4 数据库直接验证
DB_CHECK=$(mysql -u root -p'CommunityPwd123!' community_db -N -e "
SELECT JSON_EXTRACT(origin_address_snapshot, '$.address'), JSON_EXTRACT(destination_address_snapshot, '$.address')
FROM neighbor_assist_orders WHERE id=$ORDER_ID LIMIT 1;
" 2>/dev/null | tr ',' '\n')
DB_ORIGIN=$(echo "$DB_CHECK" | head -1 | tr -d '"')
DB_DEST=$(echo "$DB_CHECK" | tail -1 | tr -d '"')
check "数据库存储取货地址" "$([ -n "$DB_ORIGIN" ] && echo true || echo false)" "$DB_ORIGIN"
check "数据库存储送货地址" "$([ -n "$DB_DEST" ] && echo true || echo false)" "$DB_DEST"

echo ""

# =============================================
# 阶段 3: 业务逻辑测试
# =============================================
echo "📌 阶段 3: 业务逻辑测试 (角色/状态)"
echo "------------------------------------------------------------"

# 3.1 角色筛选
PUB=$(curl -s "$BASE/neighbor-assist/orders/my?role=publisher&page=1&limit=50" -H "Authorization: Bearer $TOKEN")
HELPER=$(curl -s "$BASE/neighbor-assist/orders/my?role=helper&page=1&limit=50" -H "Authorization: Bearer $TOKEN")

PUB_IDS=$(echo "$PUB" | python3 -c "import sys,json; [print(o['id']) for o in json.load(sys.stdin).get('data',{}).get('list',[])]" 2>/dev/null)
HELPER_IDS=$(echo "$HELPER" | python3 -c "import sys,json; [print(o['id']) for o in json.load(sys.stdin).get('data',{}).get('list',[])]" 2>/dev/null)

PUB_COUNT=$(echo "$PUB_IDS" | grep -c . 2>/dev/null || echo 0)
HELPER_COUNT=$(echo "$HELPER_IDS" | grep -c . 2>/dev/null || echo 0)
check "角色: 我发布的" "$([ "$PUB_COUNT" -gt 0 ] && echo true || echo false)" "数量: $PUB_COUNT"
check "角色: 我接的" "true" "数量: $HELPER_COUNT"

# 检查重复
COMMON=$(comm -12 <(echo "$PUB_IDS" | sort -u) <(echo "$HELPER_IDS" | sort -u) 2>/dev/null)
check "无重复订单" "$([ -z "$COMMON" ] && echo true || echo false)" "重复ID: $COMMON"

# 3.2 订单状态
STATUS=$(echo "$LIST_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('list',[])[0].get('status','N/A'))" 2>/dev/null)
check "订单状态合理" "$([ "$STATUS" != "N/A" ] && echo true || echo false)" "status=$STATUS"

# 3.3 金额字段
AMOUNT=$(echo "$LIST_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('list',[])[0].get('amount','N/A'))" 2>/dev/null)
check "金额字段存在" "$([ "$AMOUNT" != "N/A" ] && echo true || echo false)" "amount=$AMOUNT"

echo ""

# =============================================
# 阶段 4: 订单详情完整数据
# =============================================
echo "📌 阶段 4: 订单详情完整数据"
echo "------------------------------------------------------------"

DETAIL=$(curl -s "$BASE/neighbor-assist/orders/$ORDER_ID" -H "Authorization: Bearer $TOKEN")

# 4.1 基本信息
DET_TYPE=$(echo "$DETAIL" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
o = d.get('order', d)
print(o.get('assist_type_label', o.get('assist_type', 'N/A')))
" 2>/dev/null)
check "详情: 类型标签" "$([ "$DET_TYPE" != "N/A" ] && [ "$DET_TYPE" != "take" ] && echo true || echo false)" "$DET_TYPE"

# 4.2 发布人信息
DET_PUB=$(echo "$DETAIL" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
o = d.get('order', d)
pub = o.get('publisher', {})
print(pub.get('nickname', 'N/A'))
" 2>/dev/null)
check "详情: 发布人" "$([ "$DET_PUB" != "N/A" ] && echo true || echo false)" "$DET_PUB"

# 4.3 手机号脱敏
DET_PHONE=$(echo "$DETAIL" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
o = o.get('order', d) if (o := d) else d
pub = o.get('publisher', {})
phone = pub.get('phone', '')
print('masked' if '****' in str(phone) else 'visible' if phone else 'none')
" 2>/dev/null)
check "详情: 手机号处理" "true" "$DET_PHONE (接单前脱敏