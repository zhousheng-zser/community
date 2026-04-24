// create-worker-account.js
const { Sequelize } = require('sequelize');
const crypto = require('crypto');
const db = new Sequelize('community_db', 'root', 'CommunityPwd123!', { host: '127.0.0.1', dialect: 'mysql', logging: false });
const Q = Sequelize.QueryTypes;

(async () => {
  await db.authenticate();

  // 1. 创建技工用户
  await db.query("INSERT INTO Users (openid, nickname, phone, createdAt, updatedAt) VALUES ('test_worker_13800138002', '测试技工', '13800138002', NOW(), NOW()) ON DUPLICATE KEY UPDATE updatedAt=NOW()", { type: Q.INSERT });
  console.log('[1] 技工用户创建成功');

  // 2. 创建技工申请(通过状态)
  let u = await db.query('SELECT id FROM Users WHERE phone = "13800138002"', { type: Q.SELECT });
  await db.query(`INSERT INTO worker_applications (user_id, name, phone, industry, id_card_url, status, created_at, updated_at) VALUES (${u[0].id}, '测试技工', '13800138002', '水电维修', 'test_id.jpg', 'approved', NOW(), NOW()) ON DUPLICATE KEY UPDATE status='approved'`, { type: Q.INSERT });
  console.log('[2] 技工申请创建成功');

  // 3. 创建技工档案
  await db.query(`INSERT INTO worker_profiles (user_id, real_name, phone, industry, status, created_at, updated_at) SELECT id, '测试技工', '13800138002', '水电维修', 'active', NOW(), NOW() FROM Users WHERE phone = "13800138002" ON DUPLICATE KEY UPDATE status='active'`, { type: Q.INSERT });
  console.log('[3] 技工档案创建成功\n');

  console.log('技工账号创建完成！');
  console.log('手机号: 13800138002');
  console.log('验证码: 123456');
  
  await db.close();
})();
