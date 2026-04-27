-- Create missing tables for chat, benefit-coin, promoter, mini-programs modules
-- Run: mysql -u root -p'CommunityPwd123!' community_db < create-missing-tables.sql

-- Chat groups
CREATE TABLE IF NOT EXISTS `chat_groups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL DEFAULT '',
  `avatar_url` VARCHAR(500) DEFAULT '',
  `creator_id` BIGINT UNSIGNED NOT NULL,
  `member_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `last_message` VARCHAR(500) DEFAULT '',
  `last_message_at` DATETIME DEFAULT NULL,
  `is_dismissed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_creator_id` (`creator_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat group members
CREATE TABLE IF NOT EXISTS `chat_group_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat group messages
CREATE TABLE IF NOT EXISTS `chat_group_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `sender_id` BIGINT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `msg_type` ENUM('text', 'image', 'voice') NOT NULL DEFAULT 'text',
  `media_url` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_group_id` (`group_id`, `created_at`),
  INDEX `idx_sender_id` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Benefit coin goods
CREATE TABLE IF NOT EXISTS `benefit_coin_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `image_url` VARCHAR(500) DEFAULT '',
  `images` JSON DEFAULT NULL,
  `coins` INT UNSIGNED NOT NULL DEFAULT 0,
  `stock` INT UNSIGNED NOT NULL DEFAULT 0,
  `sold_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Benefit coin exchanges
CREATE TABLE IF NOT EXISTS `benefit_coin_exchanges` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goods_id` BIGINT UNSIGNED NOT NULL,
  `goods_name` VARCHAR(200) NOT NULL DEFAULT '',
  `coins_spent` INT UNSIGNED NOT NULL DEFAULT 0,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Promoter commissions
CREATE TABLE IF NOT EXISTS `promoter_commissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `order_id` VARCHAR(100) NOT NULL DEFAULT '',
  `order_type` VARCHAR(50) DEFAULT '',
  `commission_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'available', 'withdrawn') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Promoter withdrawals
CREATE TABLE IF NOT EXISTS `promoter_withdrawals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'processing', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
  `remark` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mini program configurations
CREATE TABLE IF NOT EXISTS `mini_programs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL DEFAULT '',
  `app_id` VARCHAR(100) NOT NULL DEFAULT '',
  `path` VARCHAR(500) DEFAULT '',
  `icon_url` VARCHAR(500) DEFAULT '',
  `description` VARCHAR(500) DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial benefit coin goods
INSERT INTO `benefit_coin_goods` (`name`, `description`, `image_url`, `coins`, `stock`, `sold_count`, `status`, `sort_order`) VALUES
('家事币定制保温杯', '高品质保温杯，容量500ml，保温时长12小时', '/img/placeholders/home_cleaning.png', 500, 100, 0, 'active', 1),
('环保购物袋套装', '环保材质购物袋，轻便耐用', '/img/placeholders/home_cleaning.png', 200, 50, 0, 'active', 2),
('社区服务体验券', '社区家政服务免费体验券', '/img/placeholders/home_cleaning.png', 1000, 20, 0, 'active', 3),
('家政清洁工具包', '专业级清洁工具套装', '/img/placeholders/home_cleaning.png', 800, 30, 0, 'active', 4);

-- Seed initial coupon templates if none exist
INSERT IGNORE INTO `coupon_templates` (`name`, `type`, `threshold_amount`, `discount_amount`, `total_count`, `issued_count`, `valid_from`, `valid_to`, `status`, `created_at`, `updated_at`) VALUES
('满50减10优惠券', 'full_minus', 50.00, 10.00, 1000, 0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'active', NOW(), NOW()),
('满100减20优惠券', 'full_minus', 100.00, 20.00, 500, 0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'active', NOW(), NOW()),
('满200减50优惠券', 'full_minus', 200.00, 50.00, 200, 0, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 'active', NOW(), NOW());

-- ============================================================
-- benefit_alliance_goods: 惠民卡多平台推广商品统一管理
-- ============================================================
CREATE TABLE IF NOT EXISTS `benefit_alliance_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `platform` ENUM('jd','pdd','taobao','meituan','brand') NOT NULL DEFAULT 'jd',
  `title` VARCHAR(200) NOT NULL DEFAULT '',
  `subtitle` VARCHAR(500) DEFAULT '',
  `image_url` VARCHAR(500) DEFAULT '',
  `price` DECIMAL(10,2) DEFAULT 0,
  `coupon_price` DECIMAL(10,2) DEFAULT 0,
  `rebate_amount` DECIMAL(10,2) DEFAULT 0,
  `sku_id` VARCHAR(100) DEFAULT '',
  `goods_id` VARCHAR(100) DEFAULT '',
  `spread_url` VARCHAR(500) DEFAULT '',
  `mini_path` VARCHAR(500) DEFAULT '',
  `keyword` VARCHAR(100) DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `scene` VARCHAR(50) DEFAULT 'benefit_card',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_platform_status` (`platform`, `status`),
  INDEX `idx_platform_scene_status` (`platform`, `scene`, `status`),
  INDEX `idx_sort_order` (`sort_order`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed demo data: JD
INSERT IGNORE INTO `benefit_alliance_goods`
(`platform`,`title`,`subtitle`,`image_url`,`price`,`rebate_amount`,`sku_id`,`spread_url`,`sort_order`,`status`,`scene`) VALUES
('jd','美的空气炸锅家用5L','大容量无油低脂，京挑客爆款','/img/jd_benefit/demo-airfryer.png','199.00','15.00','12345678','https://u.jd.com/demo1',0,'active','benefit_card'),
('jd','苏泊尔电饭煲4L','球釜内胆，智能预约','/img/jd_benefit/demo-cooker.png','299.00','20.00','87654321','https://u.jd.com/demo2',1,'active','benefit_card');

-- Seed demo data: PDD
INSERT IGNORE INTO `benefit_alliance_goods`
(`platform`,`title`,`subtitle`,`image_url`,`price`,`coupon_price`,`rebate_amount`,`goods_id`,`spread_url`,`sort_order`,`status`,`scene`) VALUES
('pdd','维达抽纸整箱20包','三层加厚，券后超低价','/img/pdd_benefit/demo-paper.png','39.90','19.90','2.00','PDD001','https://p.pinduoduo.com/demo1',0,'active','benefit_card'),
('pdd','三只松鼠零食大礼包','网红爆款零食组合','/img/pdd_benefit/demo-snack.png','99.00','59.00','5.00','PDD002','https://p.pinduoduo.com/demo2',1,'active','benefit_card');

-- Seed demo data: brand
INSERT IGNORE INTO `benefit_alliance_goods`
(`platform`,`title`,`subtitle`,`image_url`,`keyword`,`sort_order`,`status`,`scene`) VALUES
('brand','肯德基优惠券','炸鸡汉堡 · 先领券再下单','/img/benefit_alliance/kfc.png','肯德基',0,'active','benefit_card'),
('brand','麦当劳优惠券','巨无霸 · 麦乐送','/img/benefit_alliance/mcd.png','麦当劳',1,'active','benefit_card'),
('brand','星巴克优惠券','咖啡星享 · 券包与周边','/img/benefit_alliance/starbucks.png','星巴克',2,'active','benefit_card');
