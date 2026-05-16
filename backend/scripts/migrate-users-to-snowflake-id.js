/**
 * 将 Users 主键从自增 INT 迁移为雪花 BIGINT，并更新全库 user 外键引用。
 * 重复手机号：保留最早一条的原号，其余分配以 1 开头的 11 位新号。
 *
 * 用法: node scripts/migrate-users-to-snowflake-id.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const { nextSnowflakeId } = require('../src/utils/snowflake');

const USER_REF_COLUMNS = [
  ['activity_participants', 'user_id'],
  ['benefit_coin_exchanges', 'user_id'],
  ['chat_group_members', 'user_id'],
  ['chat_group_messages', 'sender_id'],
  ['comments', 'user_id'],
  ['comments', 'reply_to_user_id'],
  ['complaint_tickets', 'user_id'],
  ['coupon_issues', 'user_id'],
  ['coupon_templates', 'service_provider_id'],
  ['feedback', 'user_id'],
  ['housekeeping_dispatches', 'service_provider_id'],
  ['housekeeping_dispatches', 'worker_id'],
  ['likes', 'user_id'],
  ['market_applications', 'user_id'],
  ['market_cart_items', 'user_id'],
  ['market_order_events', 'user_id'],
  ['market_orders', 'user_id'],
  ['market_shop_reviews', 'user_id'],
  ['messages', 'sender_id'],
  ['neighbor_assist_orders', 'user_id'],
  ['neighbor_assist_orders', 'assigned_worker_id'],
  ['posts', 'user_id'],
  ['promoter_commissions', 'user_id'],
  ['promoter_withdrawals', 'user_id'],
  ['publish_orders', 'user_id'],
  ['service_order_complaints', 'user_id'],
  ['service_order_reviews', 'user_id'],
  ['service_order_reviews', 'worker_id'],
  ['service_orders', 'user_id'],
  ['service_orders', 'assigned_worker_id'],
  ['service_orders', 'provider_user_id'],
  ['service_provider_applications', 'user_id'],
  ['service_provider_profiles', 'user_id'],
  ['user_addresses', 'user_id'],
  ['user_follows', 'user_id'],
  ['user_follows', 'follow_user_id'],
  ['userconversations', 'user_id'],
  ['userconversations', 'peer_id'],
  ['worker_applications', 'user_id'],
  ['worker_personal_services', 'user_id'],
  ['worker_profiles', 'user_id'],
  ['worker_services', 'worker_user_id']
];

function allocPhoneForDuplicate(snowflakeId, usedPhones) {
  let base = '1' + String(snowflakeId).replace(/\D/g, '').slice(-10);
  if (base.length < 11) base = (base + '0000000000').slice(0, 11);
  if (base.length > 11) base = base.slice(0, 11);
  let candidate = base;
  let n = 0;
  while (usedPhones.has(candidate)) {
    n += 1;
    candidate = ('1' + String(snowflakeId).slice(-8) + String(n).padStart(2, '0')).slice(0, 11);
  }
  usedPhones.add(candidate);
  return candidate;
}

async function resolveUsersTableName(q) {
  const [rows] = await q(`SELECT TABLE_NAME AS t FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'users' LIMIT 1`);
  if (!rows.length) throw new Error('未找到 users 表');
  return rows[0].t;
}

async function tableExists(q, table) {
  const [rows] = await q(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    { replacements: [table] }
  );
  return rows.length > 0;
}

async function columnExists(q, table, column) {
  const [rows] = await q(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    { replacements: [table, column] }
  );
  return rows.length > 0;
}

async function dropAllForeignKeys(q) {
  const [fks] = await q(
    `SELECT CONSTRAINT_NAME, TABLE_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
  );
  for (const fk of fks) {
    await q(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
    console.log(`  dropped FK ${fk.CONSTRAINT_NAME} on ${fk.TABLE_NAME}`);
  }
}

async function main() {
  const q = (sql, opts) => sequelize.query(sql, opts);
  const usersTable = await resolveUsersTableName(q);

  const [colInfo] = await q(
    `SELECT DATA_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'`,
    { replacements: [usersTable] }
  );
  if (colInfo[0] && colInfo[0].DATA_TYPE === 'bigint' && !String(colInfo[0].EXTRA || '').includes('auto_increment')) {
    console.log('Users.id 已是雪花 BIGINT，跳过迁移。');
    await sequelize.close();
    return;
  }

  if (await columnExists(q, usersTable, 'id_new')) {
    console.log('检测到 id_new，正在完成 users 主键切换（子表应已迁移）...');
    await q('SET FOREIGN_KEY_CHECKS = 0');
    await q(
      `UPDATE \`${usersTable}\` u
       INNER JOIN \`user_id_migration\` m ON u.invited_by = m.old_id
       SET u.invited_by = m.new_id
       WHERE u.invited_by IS NOT NULL AND u.invited_by != 0`
    ).catch(() => {});
    await q(`ALTER TABLE \`${usersTable}\` MODIFY COLUMN \`id\` INT NOT NULL`);
    await q(`ALTER TABLE \`${usersTable}\` DROP PRIMARY KEY`);
    await q(`ALTER TABLE \`${usersTable}\` DROP COLUMN \`id\``);
    await q(
      `ALTER TABLE \`${usersTable}\` CHANGE COLUMN \`id_new\` \`id\` BIGINT NOT NULL PRIMARY KEY`
    );
    await q('SET FOREIGN_KEY_CHECKS = 1');
    console.log('users 主键切换完成。');
    await sequelize.close();
    return;
  }

  const [users] = await q(`SELECT id, phone FROM \`${usersTable}\` ORDER BY id ASC`);
  console.log(`待迁移用户数: ${users.length}`);

  const phoneFirstClaim = new Map();
  const usedPhones = new Set();
  const rows = [];

  for (const u of users) {
    const oldId = u.id;
    const newId = nextSnowflakeId();
    let phone = u.phone != null ? String(u.phone).trim() : '';

    if (phone) {
      if (!phoneFirstClaim.has(phone)) {
        phoneFirstClaim.set(phone, oldId);
        usedPhones.add(phone);
      } else {
        phone = allocPhoneForDuplicate(newId, usedPhones);
        console.log(`  重复手机号 user#${oldId} -> 新号 ${phone}`);
      }
    }

    rows.push({ oldId, newId, phone });
  }

  // MySQL DDL 会隐式提交，勿包在 Sequelize 事务中
  try {
    await q('SET FOREIGN_KEY_CHECKS = 0');

    await q('DROP TABLE IF EXISTS `user_id_migration`');
    await q(
      `CREATE TABLE \`user_id_migration\` (
        old_id INT NOT NULL PRIMARY KEY,
        new_id BIGINT NOT NULL,
        new_phone VARCHAR(255) NULL
      )`
    );

    for (const r of rows) {
      await q('INSERT INTO `user_id_migration` (old_id, new_id, new_phone) VALUES (?, ?, ?)', {
        replacements: [r.oldId, r.newId, r.phone || null]
      });
    }

    await dropAllForeignKeys(q);

    if (await columnExists(q, usersTable, 'id_new')) {
      await q(`ALTER TABLE \`${usersTable}\` DROP COLUMN \`id_new\``);
    }
    await q(`ALTER TABLE \`${usersTable}\` ADD COLUMN \`id_new\` BIGINT NULL`);

    await q(
      `UPDATE \`${usersTable}\` u
       INNER JOIN \`user_id_migration\` m ON u.id = m.old_id
       SET u.id_new = m.new_id,
           u.phone = COALESCE(m.new_phone, u.phone)`
    );

    for (const [table, column] of USER_REF_COLUMNS) {
      if (!(await tableExists(q, table))) continue;
      if (!(await columnExists(q, table, column))) continue;

      if (await columnExists(q, table, `${column}_new`)) {
        await q(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}_new\``);
      }
      await q(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}_new\` BIGINT NULL`);

      await q(
        `UPDATE \`${table}\` t
         INNER JOIN \`user_id_migration\` m ON t.\`${column}\` = m.old_id
         SET t.\`${column}_new\` = m.new_id
         WHERE t.\`${column}\` IS NOT NULL AND t.\`${column}\` != 0`
      );

      await q(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
      await q(
        `ALTER TABLE \`${table}\` CHANGE COLUMN \`${column}_new\` \`${column}\` BIGINT NULL`
      );
      console.log(`  updated ${table}.${column}`);
    }

    await q(
      `UPDATE \`${usersTable}\` u
       INNER JOIN \`user_id_migration\` m ON u.invited_by = m.old_id
       SET u.invited_by = m.new_id
       WHERE u.invited_by IS NOT NULL AND u.invited_by != 0`
    ).catch(() => {});

    await q(`ALTER TABLE \`${usersTable}\` MODIFY COLUMN \`id\` INT NOT NULL`);
    await q(`ALTER TABLE \`${usersTable}\` DROP PRIMARY KEY`);
    await q(`ALTER TABLE \`${usersTable}\` DROP COLUMN \`id\``);
    await q(
      `ALTER TABLE \`${usersTable}\` CHANGE COLUMN \`id_new\` \`id\` BIGINT NOT NULL PRIMARY KEY`
    );

    await q('SET FOREIGN_KEY_CHECKS = 1');
    console.log('迁移完成。映射表 user_id_migration 已保留供核对。');
  } catch (e) {
    throw e;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { USER_REF_COLUMNS };
