#!/usr/bin/env bash
# 本地集市联调示例脚本（请先修改下面几项再执行）

# 基础配置
BASE_URL="http://114.55.167.14:3000"   # 或你的本地地址
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwib3BlbmlkIjoib3IwVmYzUmxWTG96VExLVWhScVYwbjlfZUFsNCIsImlhdCI6MTc3MzgzOTMwNywiZXhwIjoxNzc0NDQ0MTA3fQ.wQ6uocXEGoOdfS42F6-dW0SN0UGIA1oujonRBgIcw-0"         # 登录后获取的 token
SHOP_ID=1                                # 根据 seed 数据或实际 DB 替换
GOODS_ID=1                               # 选一个在该店铺下的商品 ID

# 工具检测（jq 可选；无 jq 也能跑）
HAS_JQ=0
if command -v jq >/dev/null 2>&1; then
  HAS_JQ=1
fi

pretty_json () {
  if [ "$HAS_JQ" -eq 1 ]; then
    jq .
  else
    cat
  fi
}

json_get () {
  # 用 node 从 JSON 里取字段（避免依赖 jq）
  # 用法：json_get "$json" "data.order_no"
  node -e "const fs=require('fs');const input=process.argv[1]||'';const path=(process.argv[2]||'').split('.').filter(Boolean);let obj={};try{obj=JSON.parse(input)}catch(e){process.exit(0)};let cur=obj;for(const k of path){if(cur&&Object.prototype.hasOwnProperty.call(cur,k)){cur=cur[k]}else{cur=undefined;break}};if(cur===undefined||cur===null)process.exit(0);process.stdout.write(String(cur));" "$1" "$2"
}

# 1. 店铺 & 商品读接口 -------------------------------------------------------

echo "\n== 列出店铺列表 =="
curl -s "$BASE_URL/api/v1/market/shops?page=1&page_size=10" | pretty_json

echo "\n== 店铺详情 =="
curl -s "$BASE_URL/api/v1/market/shops/$SHOP_ID" | pretty_json

echo "\n== 店内分类 =="
curl -s "$BASE_URL/api/v1/market/shops/$SHOP_ID/categories" | pretty_json

echo "\n== 店内商品列表 =="
curl -s "$BASE_URL/api/v1/market/shops/$SHOP_ID/goods?page=1&page_size=20" | pretty_json

# 2. 购物车链路 -------------------------------------------------------------

echo "\n== 加入购物车 =="
CART_ADD_RESP=$(curl -s -X POST "$BASE_URL/api/v1/market/cart/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shop_id":'$SHOP_ID',"goods_id":'$GOODS_ID',"quantity":2}' )

echo "$CART_ADD_RESP" | pretty_json
CART_ITEM_ID=$(json_get "$CART_ADD_RESP" "data.id")
echo "当前 CART_ITEM_ID: $CART_ITEM_ID"

echo "\n== 查看购物车 =="
curl -s "$BASE_URL/api/v1/market/cart?shop_id=$SHOP_ID" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

if [ -n "$CART_ITEM_ID" ] && [ "$CART_ITEM_ID" != "null" ]; then
  echo "\n== 修改购物车数量 (quantity=3) =="
  curl -s -X PUT "$BASE_URL/api/v1/market/cart/items/$CART_ITEM_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"quantity":3}' | pretty_json

  echo "\n== 删除购物车项 =="
  curl -s -X DELETE "$BASE_URL/api/v1/market/cart/items/$CART_ITEM_ID" \
    -H "Authorization: Bearer $TOKEN" | pretty_json

  echo "\n== 删除后查看购物车 =="
  curl -s "$BASE_URL/api/v1/market/cart?shop_id=$SHOP_ID" \
    -H "Authorization: Bearer $TOKEN" | pretty_json
fi

echo "\n== 清空购物车 =="
curl -s -X DELETE "$BASE_URL/api/v1/market/cart?shop_id=$SHOP_ID" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

echo "\n== 清空后查看购物车 =="
curl -s "$BASE_URL/api/v1/market/cart?shop_id=$SHOP_ID" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

# 3. 预结算 & 创建订单 -------------------------------------------------------

echo "\n== 预结算 =="
PREVIEW_RESP=$(curl -s -X POST "$BASE_URL/api/v1/market/orders/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shop_id":'$SHOP_ID',"items":[{"goods_id":'$GOODS_ID',"quantity":3}]}' )

echo "$PREVIEW_RESP" | pretty_json

echo "\n== 创建订单 =="
CREATE_RESP=$(curl -s -X POST "$BASE_URL/api/v1/market/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shop_id":'$SHOP_ID',"items":[{"goods_id":'$GOODS_ID',"quantity":3}],"receiver_name":"张三","receiver_phone":"13800001111","receiver_address":"某某小区1幢101"}' )

echo "$CREATE_RESP" | pretty_json
ORDER_NO=$(json_get "$CREATE_RESP" "data.order_no")
echo "当前订单号: $ORDER_NO"

echo "\n== 我的订单列表 =="
curl -s "$BASE_URL/api/v1/market/orders/my?page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

echo "\n== 订单详情 =="
curl -s "$BASE_URL/api/v1/market/orders/$ORDER_NO" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

# 4. 支付创建 & 查询 ---------------------------------------------------------

echo "\n== 创建支付单 =="
PAY_CREATE_RESP=$(curl -s -X POST "$BASE_URL/api/v1/market/payments/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_no":"'$ORDER_NO'"}' )

echo "$PAY_CREATE_RESP" | pretty_json
OUT_TRADE_NO=$(json_get "$PAY_CREATE_RESP" "data.out_trade_no")
echo "当前 out_trade_no: $OUT_TRADE_NO"

echo "\n== 查询支付状态 =="
curl -s "$BASE_URL/api/v1/market/payments/status?order_no=$ORDER_NO" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

# 5. 模拟支付回调（使用 PAY_CALLBACK_SECRET）-------------------------------

# 注意：下面这一段需要你在 .env 中配置 PAY_CALLBACK_SECRET，
# 并在 shell 环境中 `export PAY_CALLBACK_SECRET=...`，才能计算签名。

if [ -z "$OUT_TRADE_NO" ] || [ "$OUT_TRADE_NO" = "null" ]; then
  echo "\n[提示] 未拿到有效的 out_trade_no，跳过回调模拟。"
  exit 0
fi

TRADE_STATE="SUCCESS"
TRANSACTION_ID="MOCK_TX_$(date +%s)"
# 使用 ISO 时间，避免空格导致的 JSON/签名拼接问题
PAID_AT="$(date -Iseconds)"
BASE_STR="out_trade_no=$OUT_TRADE_NO&trade_state=$TRADE_STATE&transaction_id=$TRANSACTION_ID&paid_at=$PAID_AT"

if [ -z "$PAY_CALLBACK_SECRET" ]; then
  # 尝试从同目录 .env 读取
  if [ -f ".env" ]; then
    PAY_CALLBACK_SECRET=$(grep -E '^PAY_CALLBACK_SECRET=' .env | head -n 1 | cut -d '=' -f2-)
    export PAY_CALLBACK_SECRET
  fi
fi

if [ -z "$PAY_CALLBACK_SECRET" ]; then
  echo "\n[提示] PAY_CALLBACK_SECRET 未配置，无法生成签名。"
  echo "请在 backend/.env 中填写 PAY_CALLBACK_SECRET，或在当前 shell 执行："
  echo "  export PAY_CALLBACK_SECRET=与你.env中一致的值"
  exit 0
fi

SIGNATURE=$(node -e "const crypto=require('crypto');const s=process.env.PAY_CALLBACK_SECRET;const base='$BASE_STR';process.stdout.write(crypto.createHmac('sha256',s).update(base).digest('hex'));" )

echo "\n== 模拟支付回调 (trade_state=SUCCESS) =="
echo "签名原文: $BASE_STR"
echo "签名值  : $SIGNATURE"

export OUT_TRADE_NO TRADE_STATE TRANSACTION_ID PAID_AT SIGNATURE

CALLBACK_JSON=$(node -e "console.log(JSON.stringify({out_trade_no: process.env.OUT_TRADE_NO, trade_state: process.env.TRADE_STATE, transaction_id: process.env.TRANSACTION_ID, paid_at: process.env.PAID_AT, signature: process.env.SIGNATURE}))" )

curl -s -X POST "$BASE_URL/api/v1/market/pay/callback" \
  -H "Content-Type: application/json" \
  --data-binary "$CALLBACK_JSON" | pretty_json

echo "\n== 幂等验证：重复回调一次（应仍返回 SUCCESS 且不重复记账）=="
curl -s -X POST "$BASE_URL/api/v1/market/pay/callback" \
  -H "Content-Type: application/json" \
  --data-binary "$CALLBACK_JSON" | pretty_json

echo "\n== 回调后再次查询支付状态 =="
curl -s "$BASE_URL/api/v1/market/payments/status?order_no=$ORDER_NO" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

# 6. 取消未支付订单 ----------------------------------------------------------

echo "\n== 创建一笔未支付订单用于取消测试 =="
CREATE_RESP2=$(curl -s -X POST "$BASE_URL/api/v1/market/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shop_id":'$SHOP_ID',"items":[{"goods_id":'$GOODS_ID',"quantity":3}],"receiver_name":"李四","receiver_phone":"13800002222","receiver_address":"某某小区2幢202"}' )

echo "$CREATE_RESP2" | pretty_json
ORDER_NO2=$(json_get "$CREATE_RESP2" "data.order_no")
echo "当前订单号2: $ORDER_NO2"

if [ -n "$ORDER_NO2" ] && [ "$ORDER_NO2" != "null" ]; then
  echo "\n== 取消订单（未支付）=="
  curl -s -X POST "$BASE_URL/api/v1/market/orders/$ORDER_NO2/cancel" \
    -H "Authorization: Bearer $TOKEN" | pretty_json

  echo "\n== 取消后查看订单详情 =="
  curl -s "$BASE_URL/api/v1/market/orders/$ORDER_NO2" \
    -H "Authorization: Bearer $TOKEN" | pretty_json
fi

