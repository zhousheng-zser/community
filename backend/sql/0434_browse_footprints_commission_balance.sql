-- 浏览足迹表
CREATE TABLE IF NOT EXISTS browse_footprints (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  dedupe_key VARCHAR(128) NOT NULL,
  title VARCHAR(200) DEFAULT '',
  cover VARCHAR(500) DEFAULT '',
  url VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_dedupe (user_id, dedupe_key),
  KEY idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户浏览足迹';

-- 合伙人/推客佣金余额表
CREATE TABLE IF NOT EXISTS partner_commission_balances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role ENUM('promoter','district_partner','market_partner') NOT NULL,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  available_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  withdrawn_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  frozen_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_role (user_id, role),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合伙人佣金余额';
