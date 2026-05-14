/**
 * 创建测试账号和数据的脚本
 */
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('community_db', 'root', 'CommunityPwd123!', {
  host: '120.27.239.244:3001',
  dialect: 'mysql',
  logging: console.log
});

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log('\n✓ 数据库连接成功\n');

    const { QueryTypes } = require('sequelize');

    // 1. 创建测试用户
    console.log('[1] 创建测试用户...');
    await sequelize.query(`
      INSERT INTO Users (openid, nickname, phone, status, created_at, updated_at)
      VALUES ('test_user_13800138000', '测试用户', '13800138000', 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE nickname='测试用户', updated_at=NOW()
    `, { type: QueryTypes.INSERT });
    console.log('✓ 测试用户创建成功\n');

    // 2. 创建商家账号
    console.log('[2] 创建商家账号...');
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update('merchant123').digest('hex');

    await sequelize.query(`
      INSERT INTO MerchantAccounts (username, password_hash, phone, status, created_at, updated_at)
      VALUES ('merchant_test', '${passwordHash}', '13800138001', 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE password_hash='${passwordHash}', updated_at=NOW()
    `, { type: QueryTypes.INSERT });
    console.log('✓ 商家账号创建成功\n');

    // 3. 创建店铺
    console.log('[3] 创建测试店铺...');
    await sequelize.query(`
      INSERT INTO MarketShops (name, owner_id, is_active, created_at, updated_at)
      SELECT '测试店铺', id, 1, NOW(), NOW()
      FROM MerchantAccounts
      WHERE username = 'merchant_test'
      LIMIT 1
    `, { type: QueryTypes.INSERT });
    console.log('✓ 测试店铺创建成功\n');

    // 4. 创建商品
    console.log('[4] 创建测试商品...');
    await sequelize.query(`
      INSERT INTO MarketGoods (shop_id, name, price, stock, status, created_at, updated_at)
      SELECT id, '测试商品-全链路测试', 99.99, 100, 'on_sale', NOW(), NOW()
      FROM MarketShops
      WHERE name = '测试店铺'
      LIMIT 1
    `, { type: QueryTypes.INSERT });
    console.log('✓ 测试商品创建成功\n');

    // 5. 创建收货地址
    console.log('[5] 创建测试地址...');
    await sequelize.query(`
      INSERT INTO UserAddresses (user_id, name, phone, address, is_default, created_at, updated_at)
      SELECT id, '测试用户', '13800138000', '北京市朝阳区测试路123号', 1, NOW(), NOW()
      FROM Users
      WHERE phone = '13800138000'
      LIMIT 1
    `, { type: QueryTypes.INSERT });
    console.log('✓ 测试地址创建成功\n');

    // 6. 查询验证
    console.log('[6] 验证数据...');
    const users = await sequelize.query('SELECT * FROM Users WHERE phone = "13800138000"', { type: QueryTypes.SELECT });
    console.log('用户:', users);

    const merchants = await sequelize.query('SELECT * FROM MerchantAccounts WHERE username = "merchant_test"', { type: QueryTypes.SELECT });
    console.log('商家:', merchants);

    const shops = await sequelize.query('SELECT * FROM MarketShops WHERE name = "测试店铺"', { type: QueryTypes.SELECT });
    console.log('店铺:', shops);

    const goods = await sequelize.query('SELECT * FROM MarketGoods WHERE name LIKE "%测试商品%"', { type: QueryTypes.SELECT });
    console.log('商品:', goods);

    console.log('\n========================================');
    console.log('测试数据创建完成！');
    console.log('========================================\n');

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await sequelize.close();
  }
}

createTestData();
