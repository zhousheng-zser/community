/**
 * 商家店铺订单：Tab 分组（与 status / status_text 宽松对齐）
 */

const TAB_DEF = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待付款' },
  { key: 'to_ship', label: '待发货' },
  { key: 'shipping', label: '配送中' },
  { key: 'done', label: '已完成' },
  { key: 'after_sale', label: '售后' }
];

function inferBucket(o) {
  const statusRaw = o.status || o.order_status || '';
  const t = String(o.statusText || o.status_text || statusRaw || '').toLowerCase();
  const code = String(statusRaw || o.status_code || '').toLowerCase();
  const hay = `${t} ${code}`;

  if (/退|售后|退款|refund|after/.test(hay)) return 'after_sale';
  if (/待付|未付|未支付|unpaid|wait_pay|pending_payment/.test(hay)) return 'unpaid';
  if (/配送中|送货中|shipping|delivering|派送|pending_receipt/.test(hay)) return 'shipping';
  if (/待发货|待出库|拣货|paid|wait_ship|待处理|待接单|pending_accept|pending_service|pending_shipment/.test(hay)) return 'to_ship';
  if (/完成|已完|签收|completed|done|finished|success/.test(hay)) return 'done';
  if (/取消|关闭|cancel|closed/.test(hay)) return 'cancel';
  return 'other';
}

function formatTimeLine(t) {
  if (t == null || t === '') return '';
  const s = String(t).trim();
  return s.length > 19 ? s.slice(0, 16).replace('T', ' ') : s.replace('T', ' ');
}

function enrichItem(o) {
  const orderNo = o.order_no || o.orderNo || o.id;
  const rowId = o.id != null ? o.id : orderNo;
  const statusRaw = o.status || o.order_status || '';
  const statusText = o.status_text || o.status_label || statusRaw || '处理中';
  const title = o.goods_title || o.title || o.shop_name || '购物订单';
  const time = o.created_at || o.createdAt || '';
  const bucket = inferBucket(Object.assign({}, o, { statusText, status_text: statusText }));
  const rawAmt = o.pay_amount != null ? o.pay_amount : o.amount != null ? o.amount : o.total_amount;
  let amount = '';
  if (rawAmt != null && rawAmt !== '') {
    const n = parseFloat(String(rawAmt), 10);
    amount = Number.isFinite(n) ? n.toFixed(2) : String(rawAmt);
  }
  const q = o.quantity != null ? o.quantity : o.total_quantity != null ? o.total_quantity : o.goods_count;
  let qtyText = '';
  if (q != null && q !== '' && !Number.isNaN(Number(q))) {
    qtyText = `共 ${q} 件`;
  }
  const buyerHint =
    o.contact_name ||
    o.receiver_name ||
    o.buyer_name ||
    (o.user && (o.user.userName || o.user.nickName)) ||
    '';
  const timeDisplay = formatTimeLine(time) || '—';
  const buyerUserId =
    o.buyer_user_id != null ? o.buyer_user_id
      : (o.buyer_id != null ? o.buyer_id
        : (o.user_id != null ? o.user_id : (o.user && o.user.id != null ? o.user.id : null)));
  const riderUserId = o.rider_user_id != null ? o.rider_user_id : o.delivery_user_id;
  const riderName = o.rider_name || o.delivery_name || '';
  const deliveryCarrier = o.delivery_carrier || '';
  const deliveryJobStatus = o.delivery_job_status || '';
  let carrierLabel = '';
  if (deliveryCarrier === 'meituan') carrierLabel = '美团配送';
  else if (deliveryCarrier === 'eleme') carrierLabel = '饿了么配送';
  else if (deliveryCarrier === 'self') carrierLabel = '自配送';
  return {
    id: rowId,
    orderNo,
    statusText,
    orderStatus: o.order_status || o.status || '',
    title,
    time,
    timeDisplay,
    bucket,
    amount,
    qtyText,
    buyerHint,
    buyerUserId,
    riderUserId,
    riderName,
    deliveryCarrier,
    deliveryJobStatus,
    carrierLabel,
    raw: o
  };
}

function filterByTab(list, tabKey) {
  if (!tabKey || tabKey === 'all') return list;
  return list.filter((it) => {
    if (tabKey === 'unpaid') return it.bucket === 'unpaid';
    if (tabKey === 'to_ship') return it.bucket === 'to_ship';
    if (tabKey === 'shipping') return it.bucket === 'shipping';
    if (tabKey === 'done') return it.bucket === 'done';
    if (tabKey === 'after_sale') return it.bucket === 'after_sale';
    return true;
  });
}

function filterByKeyword(list, keyword) {
  const k = (keyword || '').trim().toLowerCase();
  if (!k) return list;
  return list.filter((it) => {
    const title = String(it.title || '').toLowerCase();
    const no = String(it.orderNo != null ? it.orderNo : '');
    const st = String(it.statusText || '').toLowerCase();
    return title.includes(k) || no.toLowerCase().includes(k) || st.includes(k);
  });
}

module.exports = {
  TAB_DEF,
  inferBucket,
  enrichItem,
  filterByTab,
  filterByKeyword
};
