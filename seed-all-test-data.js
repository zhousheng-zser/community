// seed-all-test-data.js - 创建完整测试数据
const { Sequelize } = require('sequelize');
const crypto = require('crypto');
const db = new Sequelize('community_db', 'root', 'CommunityPwd123!', { host: '127.0.0.1', dialect: 'mysql', logging: false });
const Q = Sequelize.QueryTypes;

(async () => {
  await db.authenticate();
  console.log('===== 开始创建完整测试数据 =====\n');

  // 1. 获取测试用户ID
  let users = await db.query('SELECT id FROM Users WHERE phone = "13800138000"', { type: Q.SELECT });
  let userId = users[0]?.id;
  if (!userId) {
    await db.query("INSERT INTO Users (openid, nickname, phone, createdAt, updatedAt) VALUES ('test_user_13800138000', '测试用户', '13800138000', NOW(), NOW())", { type: Q.INSERT });
    users = await db.query('SELECT id FROM Users WHERE phone = "13800138000"', { type: Q.SELECT });
    userId = users[0].id;
    console.log('[1] 创建测试用户, id=' + userId);
  } else {
    console.log('[1] 测试用户已存在, id=' + userId);
  }

  // 2. 获取技工用户ID
  let workerUsers = await db.query('SELECT id FROM Users WHERE phone = "13800138002"', { type: Q.SELECT });
  let workerId = workerUsers[0]?.id;
  if (!workerId) {
    await db.query("INSERT INTO Users (openid, nickname, phone, createdAt, updatedAt) VALUES ('test_worker_13800138002', '测试技工', '13800138002', NOW(), NOW())", { type: Q.INSERT });
    workerUsers = await db.query('SELECT id FROM Users WHERE phone = "13800138002"', { type: Q.SELECT });
    workerId = workerUsers[0].id;
    console.log('[2] 创建技工用户, id=' + workerId);
  }

  // 3. 获取店铺ID
  let shops = await db.query('SELECT id FROM market_shops WHERE shop_no = "TEST001"', { type: Q.SELECT });
  let shopId = shops[0]?.id;
  if (!shopId) {
    await db.query("INSERT INTO market_shops (shop_no, name, category, is_open, is_active, created_at, updated_at) VALUES ('TEST001', '测试店铺', '食品生鲜', 1, 1, NOW(), NOW())", { type: Q.INSERT });
    shops = await db.query('SELECT id FROM market_shops WHERE shop_no = "TEST001"', { type: Q.SELECT });
    shopId = shops[0].id;
    console.log('[3] 创建测试店铺, id=' + shopId);
  }

  // 4. 获取商品ID
  let goods = await db.query('SELECT id FROM market_goods WHERE goods_no = "GOODS001"', { type: Q.SELECT });
  let goodsId = goods[0]?.id;
  if (!goodsId) {
    await db.query(`INSERT INTO market_goods (goods_no, shop_id, category_key, name, description, price, stock, status, created_at, updated_at) VALUES ('GOODS001', ${shopId}, 'test', '测试商品-全链路测试', '测试用商品', 99.99, 100, 'on_sale', NOW(), NOW())`, { type: Q.INSERT });
    goods = await db.query('SELECT id FROM market_goods WHERE goods_no = "GOODS001"', { type: Q.SELECT });
    goodsId = goods[0].id;
    console.log('[4] 创建测试商品, id=' + goodsId);
  }

  // 5. 创建市场订单 (待接单状态)
  console.log('[5] 创建市场订单...');
  const orderNo1 = 'MKT' + Date.now();
  await db.query(`
    INSERT INTO market_orders (order_no, user_id, shop_id, order_status, pay_status, goods_amount, discount_amount, payable_amount, receiver_name, receiver_phone, receiver_address, remark, delivery_mode, created_at, updated_at)
    VALUES ('${orderNo1}', ${userId}, ${shopId}, 'pending_accept', 'paid', 99.99, 0, 99.99, '测试用户', '13800138000', '北京市朝阳区测试路123号', '全链路测试订单', 'express', NOW(), NOW())
  `, { type: Q.INSERT });
  let orderId1 = await db.query('SELECT id FROM market_orders WHERE order_no = "' + orderNo1 + '"', { type: Q.SELECT });
  
  await db.query(`
    INSERT INTO market_order_items (order_id, order_no, shop_id, goods_id, goods_name_snapshot, unit_price_snapshot, quantity, amount, created_at)
    VALUES (${orderId1[0].id}, '${orderNo1}', ${shopId}, ${goodsId}, '测试商品-全链路测试', 99.99, 1, 99.99, NOW())
  `, { type: Q.INSERT });
  console.log('  订单号: ' + orderNo1 + ' (待接单)');

  // 6. 创建市场订单 (待发货状态)
  const orderNo2 = 'MKT' + (Date.now() + 1);
  await db.query(`
    INSERT INTO market_orders (order_no, user_id, shop_id, order_status, pay_status, goods_amount, discount_amount, payable_amount, receiver_name, receiver_phone, receiver_address, delivery_mode, created_at, updated_at)
    VALUES ('${orderNo2}', ${userId}, ${shopId}, 'pending_ship', 'paid', 199.98, 0, 199.98, '测试用户', '13800138000', '北京市朝阳区测试路123号', 'express', NOW(), NOW())
  `, { type: Q.INSERT });
  let orderId2 = await db.query('SELECT id FROM market_orders WHERE order_no = "' + orderNo2 + '"', { type: Q.SELECT });
  await db.query(`
    INSERT INTO market_order_items (order_id, order_no, shop_id, goods_id, goods_name_snapshot, unit_price_snapshot, quantity, amount, created_at)
    VALUES (${orderId2[0].id}, '${orderNo2}', ${shopId}, ${goodsId}, '测试商品-全链路测试', 99.99, 2, 199.98, NOW())
  `, { type: Q.INSERT });
  console.log('  订单号: ' + orderNo2 + ' (待发货)');

  // 7. 创建服务 (需要先有服务记录)
  console.log('[6] 创建服务...');
  let services = await db.query('SELECT id FROM Services WHERE title LIKE "%测试服务%"', { type: Q.SELECT });
  let serviceId = services[0]?.id;
  if (!serviceId) {
    await db.query("INSERT INTO Services (title, description, price, is_published, createdAt, updatedAt) VALUES ('测试服务-水电维修', '测试用服务项目', 150, 1, NOW(), NOW())", { type: Q.INSERT });
    services = await db.query('SELECT id FROM Services WHERE title LIKE "%测试服务%"', { type: Q.SELECT });
    serviceId = services[0].id;
    console.log('  创建测试服务, id=' + serviceId);
  }

  // 8. 创建服务订单 (待接单)
  console.log('[7] 创建服务订单...');
  const serviceOrderNo = 'SVC' + Date.now();
  await db.query(`
    INSERT INTO service_orders (order_no, user_id, service_id, amount, status, pay_status, contact_name, contact_phone, address_snapshot, remark, created_at, updated_at)
    VALUES ('${serviceOrderNo}', ${userId}, ${serviceId}, 150.00, 'pending_accept', 'paid', '测试用户', '13800138000', '{"address":"北京市朝阳区测试路123号"}', '测试服务订单-水电维修', NOW(), NOW())
  `, { type: Q.INSERT });
  console.log('  订单号: ' + serviceOrderNo + ' (待接单)');

  // 9. 创建帮帮订单 (待接单)
  console.log('[8] 创建帮帮订单...');
  await db.query(`
    INSERT INTO neighbor_assist_orders (assist_type, user_id, amount, status, pay_status, origin_address_snapshot, destination_address_snapshot, remark, created_at, updated_at)
    VALUES ('errand', ${userId}, 50.00, 'pending_accept', 'paid', '{"address":"北京市朝阳区测试路100号"}', '{"address":"北京市朝阳区测试路123号"}', '测试帮帮订单-代买东西', NOW(), NOW())
  `, { type: Q.INSERT });
  console.log('  帮帮订单创建成功 (待接单)');

  // 9. 验证数据
  console.log('\n[8] 验证数据...');
  let orders = await db.query('SELECT order_no, order_status FROM market_orders WHERE user_id = ' + userId, { type: Q.SELECT });
  console.log('  市场订单: ' + orders.length + ' 个');
  orders.forEach(o => console.log('    - ' + o.order_no + ': ' + o.order_status));

  let serviceOrders = await db.query('SELECT order_no, status FROM service_orders WHERE user_id = ' + userId, { type: Q.SELECT });
  console.log('  服务订单: ' + serviceOrders.length + ' 个');

  let assistOrders = await db.query('SELECT id, status FROM neighbor_assist_orders WHERE user_id = ' + userId, { type: Q.SELECT });
  console.log('  帮帮订单: ' + assistOrders.length + ' 个');

  console.log('\n===== 测试数据创建完成 =====');
  console.log('用户ID: ' + userId);
  console.log('技工ID: ' + workerId);
  console.log('店铺ID: ' + shopId);
  console.log('商品ID: ' + goodsId);

  await db.close();
})();
