/**
 * 商家端店铺订单演示数据（merchant-orders?mock=1 / 详情 mock=1）
 * 订单号以 DEMO-MKT- 开头，不走真实接口。
 */

function isDemoOrderNo(orderNo) {
  if (orderNo == null || orderNo === '') return false;
  return String(orderNo).toUpperCase().indexOf('DEMO-MKT') === 0;
}

/** 列表原始项（经 merchantOrderUi.enrichItem 映射） */
function getMockListRaw() {
  return [
    {
      id: 'mock-m1',
      order_no: 'DEMO-MKT-20260420-001',
      status_text: '待付款',
      status: 'pending_payment',
      goods_title: '【演示】五常大米 5kg',
      created_at: '2026-04-20 16:08:00',
      pay_amount: 59.9,
      quantity: 1,
      receiver_name: '张演示',
      contact_name: '张演示',
      buyer_user_id: 88001,
      rider_user_id: 99001,
      rider_name: '王骑手'
    },
    {
      id: 'mock-m2',
      order_no: 'DEMO-MKT-20260420-002',
      status_text: '待发货',
      status: 'paid',
      goods_title: '【演示】鲜牛奶 1L×2',
      created_at: '2026-04-20 15:22:00',
      pay_amount: 36.0,
      quantity: 2,
      receiver_name: '李演示',
      contact_name: '李演示',
      buyer_user_id: 88002,
      rider_user_id: 99001,
      rider_name: '王骑手'
    },
    {
      id: 'mock-m3',
      order_no: 'DEMO-MKT-20260420-003',
      status_text: '配送中',
      status: 'shipping',
      goods_title: '【演示】有机蔬菜礼盒',
      created_at: '2026-04-20 11:05:00',
      pay_amount: 88.5,
      quantity: 1,
      receiver_name: '王演示',
      contact_name: '王演示',
      buyer_user_id: 88003,
      rider_user_id: 99001,
      rider_name: '王骑手'
    },
    {
      id: 'mock-m4',
      order_no: 'DEMO-MKT-20260419-010',
      status_text: '已完成',
      status: 'completed',
      goods_title: '【演示】洗衣液 2L',
      created_at: '2026-04-19 09:40:00',
      pay_amount: 45.0,
      quantity: 3,
      receiver_name: '赵演示',
      contact_name: '赵演示',
      buyer_user_id: 88004,
      rider_user_id: 99002,
      rider_name: '刘骑手'
    }
  ];
}

/**
 * 详情页 payload（与 market-order-detail 模板字段对齐）
 */
function getMockDetailData(orderNo) {
  const no = String(orderNo || 'DEMO-MKT-20260420-002');
  const addr =
    '北京市朝阳区望京街道阜通东大街演示小区 6 号楼 2 单元 801';

  const baseOrder = (patch) =>
    Object.assign(
      {
        order_no: no,
        shop_id: 1,
        shop_name: '演示店铺',
        receiver_name: '演示收货人',
        receiver_phone: '13800138000',
        receiver_address: addr,
        discount_amount: 0,
        buyer_user_id: 88002,
        rider_user_id: 99001,
        rider_name: '王骑手'
      },
      patch
    );

  const baseItem = (patch) =>
    Object.assign(
      {
        id: 1,
        goods_image_snapshot: ''
      },
      patch
    );

  if (no === 'DEMO-MKT-20260420-001') {
    return {
      order: baseOrder({
        order_status: 'pending_payment',
        pay_status: 'unpaid',
        goods_amount: 52.0,
        delivery_fee: 7.9,
        payable_amount: 59.9
      }),
      items: [
        baseItem({
          goods_name_snapshot: '【演示】五常大米 5kg',
          quantity: 1,
          amount: '52.00'
        })
      ]
    };
  }
  if (no === 'DEMO-MKT-20260420-003') {
    return {
      order: baseOrder({
        order_status: 'shipping',
        pay_status: 'paid',
        goods_amount: 80.0,
        delivery_fee: 8.5,
        payable_amount: 88.5
      }),
      items: [
        baseItem({
          goods_name_snapshot: '【演示】有机蔬菜礼盒',
          quantity: 1,
          amount: '80.00'
        })
      ]
    };
  }
  if (no === 'DEMO-MKT-20260419-010') {
    return {
      order: baseOrder({
        order_status: 'completed',
        pay_status: 'paid',
        goods_amount: 40.0,
        delivery_fee: 5.0,
        payable_amount: 45.0
      }),
      items: [
        baseItem({
          goods_name_snapshot: '【演示】洗衣液 2L',
          quantity: 3,
          amount: '40.00'
        })
      ]
    };
  }

  /* 默认：002 待发货 */
  return {
    order: baseOrder({
      order_status: 'paid',
      pay_status: 'paid',
      goods_amount: 64.0,
      delivery_fee: 8.0,
      payable_amount: 72.0
    }),
    items: [
      baseItem({
        goods_name_snapshot: '【演示】鲜牛奶 1L',
        quantity: 2,
        amount: '64.00'
      })
    ]
  };
}

module.exports = {
  isDemoOrderNo,
  getMockListRaw,
  getMockDetailData
};
