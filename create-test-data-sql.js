#!/usr/bin/env node
/**
 * 在服务端创建测试账号 - 修正版
 */

const { Sequelize } = require('sequelize');
const crypto = require('crypto');

const sequelize = new Sequelize('community_db', 'root', 'CommunityPwd123!', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false
});

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log('\n===== 数据库连接成功 =====\n');

    const Q = Sequelize.QueryTypes;

    // 1. 创建测试用户
    console.log('[1] 创建测试用户...');
    await sequelize.query(`
      INSERT INTO Users (openid, nickname, phone, createdAt, updatedAt)
      VALUES ('test_user_13800138000', '测试用户', '13800138000', NOW(), NOW())
      ON DUPLICATE KEY UPDATE nickname='测试用户', updatedAt=NOW()
    `, { type: Q.INSERT });
    console.log('✓ 用户创建成功\n');

    // 2. 创建测试店铺（先创建，因为商家账号需要shop_id）
    console.log('[2] 创建测试店铺...');
    await sequelize.query(`
      INSERT INTO market_shops (shop_no, name, category, is_open, is_active, created_at, updated_at)
      VALUES ('TEST001', '测试店铺', '食品生鲜', 1, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE name='测试店铺', updated_at=NOW()
    `, { type: Q.INSERT });
    const shopRows = await sequelize.query('SELECT id FROM market_shops WHERE shop_no = "TEST001" LIMIT 1', { type: Q.SELECT });
    const shop = shopRows[0];
    console.log('✓ 店铺创建成功 (id=' + shop.id + ')\n');

    // 3. 创建商家账号
    console.log('[3] 创建商家账号...');
    const passwordHash = crypto.createHash('sha256').update('merchant123').digest('hex');
    await sequelize.query(`
      INSERT INTO merchant_accounts (shop_id, username, password_hash, role, status, created_at, updated_at)
      VALUES (${shop.id}, 'merchant_test', '${passwordHash}', 'owner', 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE password_hash='${passwordHash}', updated_at=NOW()
    `, { type: Q.INSERT });
    console.log('✓ 商家账号创建成功\n');

    // 5. 创建测试商品
    console.log('[5] 创建测试商品...');
    await sequelize.query(`
      INSERT INTO market_goods (goods_no, shop_id, category_key, name, description, price, stock, status, created_at, updated_at)
      VALUES ('GOODS001', ${shop.id}, 'test', '测试商品-全链路测试', '这是测试用商品', 99.99, 100, 'on_sale', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name='测试商品-全链路测试', updated_at=NOW()
    `, { type: Q.INSERT });
    console.log('✓ 商品创建成功\n');

    // 6. 创建收货地址
    console.log('[6] 创建收货地址...');
    const userRows = await sequelize.query('SELECT id FROM Users WHERE phone = "13800138000" LIMIT 1', { type: Q.SELECT });
    const user = userRows[0];
    await sequelize.query(`
      INSERT INTO user_addresses (user_id, name, phone, address, is_default, created_at, updated_at)
      VALUES (${user.id}, '测试用户', '13800138000', '北京市朝阳区测试路123号', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE address='北京市朝阳区测试路123号', updated_at=NOW()
    `, { type: Q.INSERT });
    console.log('✓ 地址创建成功\n');

    // 7. 验证
    console.log('[7] 验证数据...');
    const verifyUsers = await sequelize.query('SELECT * FROM Users WHERE phone = "13800138000"', { type: Q.SELECT });
    console.log('✓ 用户:', verifyUsers[0]?.nickname);

    const merchants = await sequelize.query('SELECT * FROM merchant_accounts WHERE username = "merchant_test"', { type: Q.SELECT });
    console.log('✓ 商家:', merchants[0]?.username);

    const verifyShops = await sequelize.query('SELECT * FROM market_shops WHERE shop_no = "TEST001"', { type: Q.SELECT });
    console.log('✓ 店铺:', verifyShops[0]?.name);

    const goods = await sequelize.query('SELECT * FROM market_goods WHERE goods_no = "GOODS001"', { type: Q.SELECT });
    console.log('✓ 商品:', goods[0]?.name, `¥${goods[0]?.price}`);

    console.log('\n===== 测试数据创建完成 =====\n');
    console.log('账号信息:');
    console.log('  用户: 13800138000 (微信code: test_user_code_13800138000)');
    console.log('  商家: merchant_test / merchant123');
    console.log('  技工: 需要验证码 123456\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestData();
