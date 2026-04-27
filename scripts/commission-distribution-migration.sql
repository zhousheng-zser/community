-- 4-Role Commission Distribution System - Database Migration
-- Run: mysql -u root -p'CommunityPwd123!' community_db < commission-distribution-migration.sql

-- =============================================================================
-- 1. system_configs - Configurable commission rates
-- =============================================================================
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(100) NOT NULL,
  `config_value` VARCHAR(500) NOT NULL DEFAULT '',
  `config_type` ENUM('decimal', 'integer', 'string', 'json') NOT NULL DEFAULT 'string',
  `description` VARCHAR(500) DEFAULT '',
  `is_public` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default commission rates
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_public`) VALUES
('commission.global_rate', '0.10', 'decimal', '全局佣金池比例 (0.10 = 10%)', 1),
('commission.headquarters_pct', '0.05', 'decimal', '总部占佣金池比例', 1),
('commission.market_partner_pct', '0.05', 'decimal', '市场合伙人占佣金池比例', 1),
('commission.district_partner_pct', '0.20', 'decimal', '区县合伙人占佣金池比例', 1),
('commission.promoter_pct', '0.70', 'decimal', '推广者占佣金池比例', 1)
ON DUPLICATE KEY UPDATE `config_value` = VALUES(`config_value`);

-- =============================================================================
-- 2. partner_roles - Which partner role each user holds
-- =============================================================================
CREATE TABLE IF NOT EXISTS `partner_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('promoter', 'district_partner', 'market_partner') NOT NULL,
  `status` ENUM('active', 'inactive', 'pending_approval') NOT NULL DEFAULT 'active',
  `approved_at` DATETIME DEFAULT NULL,
  `approved_by` BIGINT UNSIGNED DEFAULT NULL,
  `district_code` VARCHAR(20) DEFAULT NULL,
  `market_code` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role`),
  INDEX `idx_status_role` (`status`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 3. partner_relations - Cached upstream chain per promoter (O(1) lookup)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `partner_relations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `promoter_user_id` BIGINT UNSIGNED NOT NULL,
  `district_partner_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `market_partner_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `resolved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_valid` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_promoter` (`promoter_user_id`),
  INDEX `idx_district_partner` (`district_partner_user_id`),
  INDEX `idx_market_partner` (`market_partner_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 4. commission_distributions - Per-order commission records (up to 4 per order)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `commission_distributions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(100) NOT NULL,
  `order_type` VARCHAR(50) NOT NULL DEFAULT 'market',
  `order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `commission_pool` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `beneficiary_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `beneficiary_role` ENUM('headquarters', 'promoter', 'district_partner', 'market_partner') NOT NULL,
  `role_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0,
  `commission_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'available', 'withdrawn', 'refunded') NOT NULL DEFAULT 'pending',
  `promoter_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `distributed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `settled_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_role` (`order_id`, `beneficiary_role`),
  INDEX `idx_beneficiary_user` (`beneficiary_user_id`),
  INDEX `idx_promoter_user` (`promoter_user_id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 5. partner_commission_balances - Denormalized running balance per user per role
-- =============================================================================
CREATE TABLE IF NOT EXISTS `partner_commission_balances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('promoter', 'district_partner', 'market_partner') NOT NULL,
  `total_earned` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `available_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `withdrawn_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `pending_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `frozen_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 6. Column addition to users table
-- =============================================================================
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `partner_level` ENUM('none', 'promoter', 'district_partner', 'market_partner') NOT NULL DEFAULT 'none' AFTER `roles`,
  ADD INDEX IF NOT EXISTS `idx_partner_level` (`partner_level`);
