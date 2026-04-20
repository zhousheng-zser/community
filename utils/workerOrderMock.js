/**
 * 技工订单详情页演示数据（仅 mock=1 时使用，便于预览打卡/导航/联系等 UI）
 * 坐标为北京望京附近示例点，可正常打开地图导航。
 */
function getMockOrderRaw() {
  return {
    id: 900001,
    order_no: 'SVC-DEMO-20260420-001',
    status_text: '待上门',
    status: 'dispatched',
    service_title: '【演示订单】日常保洁 2 小时',
    pay_amount: 99.0,
    book_time: '2026-04-20 14:00',
    customer_user_id: 77001,
    contact_name: '演示客户',
    contact_phone: '13800138000',
    address: '北京市朝阳区望京街道阜通东大街 6 号院（演示地址）',
    lat: 39.99876,
    lng: 116.48613,
    check_in_at: '',
    before_photos: [],
    after_photos: []
  };
}

module.exports = {
  getMockOrderRaw
};
