/**
 * 技工端订单：内存演示数据（与小程序 package-worker 字段对齐，便于本地联调）。
 * 生产环境应替换为数据库与真实鉴权。
 */
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

const initialOrders = () => [
  {
    id: 900001,
    order_no: 'SVC-20260420-001',
    status_text: '待接单',
    status: 'wait_accept',
    service_title: '空调深度清洗',
    pay_amount: 128.0,
    book_time: '2026-04-21 09:00',
    contact_name: '张三',
    contact_phone: '13800138001',
    address: '北京市朝阳区示例路 1 号院 2 单元',
    lat: 39.99876,
    lng: 116.48613,
    created_at: '2026-04-20 10:00:00',
    check_in_at: '',
    before_photos: [],
    after_photos: []
  },
  {
    id: 900002,
    order_no: 'SVC-20260420-002',
    status_text: '待上门',
    status: 'dispatched',
    service_title: '日常保洁 2 小时',
    pay_amount: 99.0,
    book_time: '2026-04-20 14:00',
    contact_name: '李四',
    contact_phone: '13800138002',
    address: '北京市朝阳区望京街道阜通东大街 6 号院',
    lat: 39.995,
    lng: 116.48,
    created_at: '2026-04-20 11:20:00',
    check_in_at: '',
    before_photos: [],
    after_photos: []
  },
  {
    id: 900003,
    order_no: 'SVC-20260419-088',
    status_text: '服务中',
    status: 'in_service',
    service_title: '洗衣机维修',
    pay_amount: 80.0,
    book_time: '2026-04-20 10:30',
    contact_name: '王五',
    contact_phone: '13800138003',
    address: '北京市朝阳区望京 SOHO T3',
    lat: 39.996,
    lng: 116.481,
    created_at: '2026-04-19 16:00:00',
    check_in_at: '2026-04-20 10:15:00',
    before_photos: [],
    after_photos: []
  },
  {
    id: 900004,
    order_no: 'SVC-20260418-020',
    status_text: '已完成',
    status: 'completed',
    service_title: '马桶疏通',
    pay_amount: 120.0,
    book_time: '2026-04-18 15:00',
    contact_name: '赵六',
    contact_phone: '13800138004',
    address: '北京市朝阳区阜通西大街示例小区',
    lat: 39.99,
    lng: 116.47,
    created_at: '2026-04-18 09:00:00',
    check_in_at: '2026-04-18 14:50:00',
    before_photos: [],
    after_photos: []
  }
];

let orders = initialOrders();

function listOrders() {
  return clone(orders);
}

function findById(id) {
  const n = Number(id);
  return orders.find((o) => Number(o.id) === n) || null;
}

function updateOrder(id, patch) {
  const n = Number(id);
  const idx = orders.findIndex((o) => Number(o.id) === n);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], ...patch };
  return clone(orders[idx]);
}

function resetForTests() {
  orders = initialOrders();
}

module.exports = {
  listOrders,
  findById,
  updateOrder,
  resetForTests
};
