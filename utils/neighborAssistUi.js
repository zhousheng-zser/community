/**
 * 邻里帮帮订单：状态桶与演示数据（接口未通时兜底）
 */

function inferBucket(raw) {
  const s = String(
    (raw && (raw.status || raw.order_status || raw.state)) || ''
  ).toLowerCase();
  if (['pending_accept', 'open', 'waiting', 'published'].includes(s)) return 'pending_accept';
  if (['accepted', 'assigned', 'in_progress', 'serving', 'in_service'].includes(s)) return 'in_service';
  if (['pending_confirm', 'wait_confirm', 'await_publisher'].includes(s)) return 'pending_confirm';
  if (['completed', 'done', 'finished'].includes(s)) return 'completed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  if (['disputed', 'complaint'].includes(s)) return 'disputed';
  return 'pending_accept';
}

function mockDetail(id) {
  const oid = id || 'demo';
  return {
    id: oid,
    publisher_id: 999999001,
    helper_id: 999999002,
    order_no: 'NA' + String(oid).slice(-8),
    status: 'accepted',
    status_text: '服务进行中',
    category: '代取',
    content: '菜鸟驿站代取，送至 3 栋 2 单元',
    address: '阳光小区 3 栋',
    service_time: '今日 16:00 前',
    reward_amount: '15',
    lat: 28.22,
    lng: 112.98,
    publisher: {
      id: 10001,
      nickname: '发布人',
      phone: '13800138000',
      avatar_url: ''
    },
    helper: {
      id: 10002,
      nickname: '接单邻居',
      phone: '13900139000',
      avatar_url: ''
    },
    my_role: 'helper',
    conversation_id: null,
    check_in_at: null
  };
}

module.exports = {
  inferBucket,
  mockDetail
};
