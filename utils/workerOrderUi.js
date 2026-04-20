/**
 * 技工订单：列表 Tab 分组与展示（与后端 status / status_text 宽松对齐）
 */

const TAB_DEF = [
  { key: 'all', label: '全部' },
  { key: 'pending_accept', label: '待接单' },
  { key: 'pending_visit', label: '待上门' },
  { key: 'in_service', label: '服务中' },
  { key: 'done', label: '已完成' }
];

/**
 * @param {object} o 原始订单项
 * @returns {string} TAB_DEF[].key 或 other / cancel
 */
function inferBucket(o) {
  const code = String(o.status != null ? o.status : o.status_code || '').toLowerCase();
  const t = String(o.statusText || o.status_text || o.status_label || '').toLowerCase();
  const hay = `${code} ${t}`;

  if (/取消|已取消|cancel|closed/.test(hay)) return 'cancel';
  if (/拒单|已拒|reject/.test(hay)) return 'cancel';
  if (/待接|派单|待派|paid_pending|pending_dispatch|wait_accept/.test(hay)) return 'pending_accept';
  if (/待上门|已接|待服务|dispatched|assigned|wait_visit/.test(hay)) return 'pending_visit';
  if (/服务中|进行中|processing|in_service|serving/.test(hay)) return 'in_service';
  if (/完成|已完|completed|done|finished/.test(hay)) return 'done';

  return 'other';
}

function enrichOrderItem(o) {
  const id = o.id;
  const statusText = o.status_text || o.status_label || o.status || '处理中';
  const title = o.service_title || o.title || (o.service && o.service.title) || '到家服务订单';
  const time = o.created_at || o.createdAt || '';
  const bucket = inferBucket(Object.assign({}, o, { statusText, status_text: statusText }));
  return {
    id,
    statusText,
    title,
    time,
    bucket,
    raw: o
  };
}

function filterByTab(list, tabKey) {
  if (!tabKey || tabKey === 'all') return list;
  return list.filter((it) => {
    if (tabKey === 'done') return it.bucket === 'done';
    if (tabKey === 'pending_accept') return it.bucket === 'pending_accept';
    if (tabKey === 'pending_visit') return it.bucket === 'pending_visit';
    if (tabKey === 'in_service') return it.bucket === 'in_service';
    return true;
  });
}

function countBuckets(list) {
  const c = { pending_accept: 0, pending_visit: 0, in_service: 0, done: 0, other: 0 };
  list.forEach((it) => {
    const b = it.bucket || 'other';
    if (c[b] !== undefined) c[b] += 1;
    else c.other += 1;
  });
  return c;
}

module.exports = {
  TAB_DEF,
  inferBucket,
  enrichOrderItem,
  filterByTab,
  countBuckets
};
