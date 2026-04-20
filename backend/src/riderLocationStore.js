/**
 * 订单维度骑手实时位置（内存演示）。生产环境由配送服务写入 Redis/DB。
 */

const byOrder = {};
/** 订单归属店铺（用于后续生产环境鉴权） */
const orderShop = {};

function registerOrderShop(orderNo, shopId) {
  const on = String(orderNo || '').trim();
  if (!on || shopId == null || shopId === '') return;
  orderShop[on] = Number(shopId);
}

function seedDemo(orderNo, shopId) {
  const on = String(orderNo || '').trim();
  if (!on) return null;
  if (byOrder[on]) {
    if (shopId != null && shopId !== '') registerOrderShop(on, shopId);
    return byOrder[on];
  }
  // 演示坐标：北京附近随机偏移
  const lat = 39.90872 + (Math.random() - 0.5) * 0.06;
  const lng = 116.39748 + (Math.random() - 0.5) * 0.06;
  if (shopId != null && shopId !== '') registerOrderShop(on, shopId);
  byOrder[on] = {
    order_no: on,
    shop_id: shopId != null ? Number(shopId) : orderShop[on] != null ? orderShop[on] : null,
    latitude: lat,
    longitude: lng,
    rider_name: '骑手（演示）',
    updated_at: new Date().toISOString()
  };
  return byOrder[on];
}

function getForOrder(orderNo) {
  const on = String(orderNo || '').trim();
  return byOrder[on] || null;
}

/** 骑手端上报位置（演示可随意调用） */
function updateLocation(orderNo, latitude, longitude, riderName) {
  const on = String(orderNo || '').trim();
  if (!on) return null;
  const prev = byOrder[on] || {};
  byOrder[on] = {
    ...prev,
    order_no: on,
    latitude: Number(latitude),
    longitude: Number(longitude),
    rider_name: riderName || prev.rider_name || '骑手',
    updated_at: new Date().toISOString()
  };
  return byOrder[on];
}

module.exports = {
  registerOrderShop,
  seedDemo,
  getForOrder,
  updateLocation
};
