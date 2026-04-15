/**
 * 创建后台增强所需表（幂等）
 * 用法: node scripts/init-admin-enhance-tables.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');

async function run() {
    const q = sequelize;
    await q.query(`
CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_username VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(80) NULL,
  target_id VARCHAR(80) NULL,
  detail_json JSON NULL,
  ip VARCHAR(64) NULL,
  created_at DATETIME NOT NULL,
  KEY idx_admin_logs_ctime (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS approval_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  biz_type VARCHAR(50) NOT NULL,
  biz_id VARCHAR(80) NOT NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  note VARCHAR(255) NULL,
  operator VARCHAR(100) NULL,
  created_at DATETIME NOT NULL,
  KEY idx_approval_biz (biz_type, biz_id),
  KEY idx_approval_ctime (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS market_refund_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  refund_no VARCHAR(40) NOT NULL,
  order_no VARCHAR(40) NOT NULL,
  out_trade_no VARCHAR(64) NULL,
  reason VARCHAR(255) NULL,
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected','processing','success','failed') NOT NULL DEFAULT 'pending',
  audit_note VARCHAR(255) NULL,
  executed_at DATETIME NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_refund_no (refund_no),
  KEY idx_refund_order_no (order_no),
  KEY idx_refund_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS market_refund_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  refund_no VARCHAR(40) NOT NULL,
  from_status VARCHAR(30) NULL,
  to_status VARCHAR(30) NOT NULL,
  note VARCHAR(255) NULL,
  operator VARCHAR(100) NULL,
  created_at DATETIME NOT NULL,
  KEY idx_refund_logs_refund_no (refund_no),
  KEY idx_refund_logs_ctime (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT NOT NULL,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','manager','operator') NOT NULL DEFAULT 'operator',
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_merchant_username (username),
  KEY idx_merchant_shop (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS complaint_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ticket_no VARCHAR(40) NOT NULL,
  order_no VARCHAR(40) NULL,
  user_id BIGINT NULL,
  shop_id BIGINT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'order',
  content TEXT NOT NULL,
  status ENUM('open','processing','resolved','closed') NOT NULL DEFAULT 'open',
  reply TEXT NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_ticket_no (ticket_no),
  KEY idx_ticket_status (status),
  KEY idx_ticket_order (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS coupon_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('full_minus','discount','cash') NOT NULL DEFAULT 'cash',
  threshold_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  issued_count INT NOT NULL DEFAULT 0,
  valid_from DATETIME NULL,
  valid_to DATETIME NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await q.query(`
CREATE TABLE IF NOT EXISTS coupon_issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  code VARCHAR(64) NOT NULL,
  status ENUM('unused','used','expired') NOT NULL DEFAULT 'unused',
  issued_at DATETIME NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_coupon_code (code),
  KEY idx_coupon_issue_template (template_id),
  KEY idx_coupon_issue_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

run()
    .then(async () => {
        console.log('admin enhance tables ready');
        await sequelize.close();
    })
    .catch(async (e) => {
        console.error(e);
        await sequelize.close();
        process.exit(1);
    });
