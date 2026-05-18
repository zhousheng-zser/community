#!/usr/bin/env node
/**
 * 在服务端创建测试账号
 * 执行: ssh cw@jshsp1.eds-tech.cn "cd /home/cw/a/community-backend/backend && node create-test-accounts.js"
 */

const { Sequelize } = require('sequelize');
const crypto = require('crypto');

const sequelize = new Sequelize('community_db', 'root', 'CommunityPwd123!', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: console.log
});

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log('\n===== 数据库连接成功 =====\n');

    // 1. 创建测试用户
    console.log('[1] 创建测试用户 (13800138000)...');
    const [userResults] = await sequelize.query(`
      INSERT INTO Users (openid, nickname, phone, status, created_at, updated_at)
      VALUES ('test_user_13800138000', '测试用户', '13800138000', 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE nickname='测试用户', updated_at=NOW()
    `);
    console.log('✓ 用户创建完成\n');

    // 2. 创建商家账号
    console.log('[2] 创建商家账号 (merchant_test / merchant123)...');
    const passwordHash = crypto.createHash('sha256').update('merchant123').digest('hex');
    const [merchantResults] = await sequelize.query(`
      INSERT INTO MerchantAccounts (username, password_hash, phone, status, created_at, updated_at)
      VALUES ('merchant_test', '${passwordHash}', '13800138001', 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE password_hash='${passwordHash}', updated_at=NOW()
    `);
    console.log('✓ 商家账号创建完成\n');

    // 3. 创建测试店铺
    console.log('[3] 创建测试店铺...');
    const [shopResults] = await sequelize.query(`
      INSERT IGNORE INTO MarketShops (name, owner_id, is_active, created_at, updated_at)
      SELECT '测试店铺', id, 1, NOW(), NOW()
      FROM MerchantAccounts
      WHERE username = 'merchant_test'
    `);
    console.log('✓ 店铺创建完成\n');

    // 4. 创建测试商品
    console.log('[4] 创建测试商品...');
    const [goodsResults] = await sequelize.query(`
      INSERT IGNORE INTO MarketGoods (shop_id, name, price, stock, status, created_at, updated_at)
      SELECT id, '测试商品-全链路测试', 99.99, 100, 'on_sale', NOW(), NOW()
      FROM MarketShops
      WHERE name = '测试店铺'
    `);
    console.log('✓ 商品创建完成\n');

    // 5. 创建收货地址
    console.log('[5] 创建测试收货地址...');
    const [addrResults] = await sequelize.query(`
      INSERT IGNORE INTO UserAddresses (user_id, name, phone, address, is_default, created_at, updated_at)
      SELECT id, '测试用户', '13800138000', '北京市朝阳区测试路123号', 1, NOW(), NOW()
      FROM Users
      WHERE phone = '13800138000'
    `);
    console.log('✓ 地址创建完成\n');

    // 6. 验证
    console.log('[6] 验证数据...');
    const users = await sequelize.query('SELECT * FROM Users WHERE phone = "13800138000"', { type: Sequelize.QueryTypes.SELECT });
    console.log('用户数据:', JSON.stringify(users, null, 2));

    const merchants = await sequelize.query('SELECT * FROM MerchantAccounts WHERE username = "merchant_test"', { type: Sequelize.QueryTypes.SELECT });
    console.log('商家数据:', JSON.stringify(merchants, null, 2));

    const shops = await sequelize.query('SELECT * FROM MarketShops WHERE name = "测试店铺"', { type: Sequelize.QueryTypes.SELECT });
    console.log('店铺数据:', JSON.stringify(shops, null, 2));

    const goods = await sequelize.query('SELECT * FROM MarketGoods WHERE name LIKE "%测试商品%"', { type: Sequelize.QueryTypes.SELECT });
    console.log('商品数据:', JSON.stringify(goods, null, 2));

    console.log('\n===== 测试数据创建完成 =====\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  -', e.message));
    }
  } finally {
    await sequelize.close();
  }
}

createTestData();
