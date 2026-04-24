// create-test-data.js - 简洁版
const { Sequelize } = require('sequelize');
const crypto = require('crypto');
const db = new Sequelize('community_db', 'root', 'CommunityPwd123!', { host: '127.0.0.1', dialect: 'mysql', logging: false });
const Q = Sequelize.QueryTypes;

(async () => {
  await db.authenticate();
  console.log('数据库连接成功\n');

  // 1. 用户
  await db.query("INSERT INTO Users (openid, nickname, phone, createdAt, updatedAt) VALUES ('test_user_13800138000', '测试用户', '13800138000', NOW(), NOW()) ON DUPLICATE KEY UPDATE updatedAt=NOW()", { type: Q.INSERT });
  console.log('[1] 用户创建成功');

  // 2. 店铺
  await db.query("INSERT INTO market_shops (shop_no, name, category, is_open, is_active, created_at, updated_at) VALUES ('TEST001', '测试店铺', '食品生鲜', 1, 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE updated_at=NOW()", { type: Q.INSERT });
  let s = await db.query('SELECT id FROM market_shops WHERE shop_no = "TEST001"', { type: Q.SELECT });
  console.log('[2] 店铺创建成功, id=' + s[0].id);

  // 3. 商家
  let pw = crypto.createHash('sha256').update('merchant123').digest('hex');
  await db.query(`INSERT INTO merchant_accounts (shop_id, username, password_hash, role, status, created_at, updated_at) VALUES (${s[0].id}, 'merchant_test', '${pw}', 'owner', 'active', NOW(), NOW()) ON DUPLICATE KEY UPDATE updated_at=NOW()`, { type: Q.INSERT });
  console.log('[3] 商家创建成功');

  // 4. 商品
  await db.query(`INSERT INTO market_goods (goods_no, shop_id, category_key, name, description, price, stock, status, created_at, updated_at) VALUES ('GOODS001', ${s[0].id}, 'test', '测试商品-全链路测试', '测试用商品', 99.99, 100, 'on_sale', NOW(), NOW()) ON DUPLICATE KEY UPDATE updated_at=NOW()`, { type: Q.INSERT });
  console.log('[4] 商品创建成功');

  // 5. 地址
  let u = await db.query('SELECT id FROM Users WHERE phone = "13800138000"', { type: Q.SELECT });
  await db.query(`INSERT INTO user_addresses (user_id, name, phone, province, city, district, detail, is_default, created_at, updated_at) VALUES (${u[0].id}, '测试用户', '13800138000', '北京市', '北京市', '朝阳区', '测试路123号', 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE updated_at=NOW()`, { type: Q.INSERT });
  console.log('[5] 地址创建成功\n');

  console.log('===== 全部完成 =====');
  console.log('用户: 13800138000 (code: test_user_code_13800138000)');
  console.log('商家: merchant_test / merchant123');
  console.log('技工: 13800138002 + 验证码123456');
  
  await db.close();
})();
