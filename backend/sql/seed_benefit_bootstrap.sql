-- 惠民卡：建表 + 种子（与 scripts/seed-benefit.js 数据一致）
-- 用法：mysql -u用户 -p 库名 < backend/sql/seed_benefit_bootstrap.sql

CREATE TABLE IF NOT EXISTS `jd_benefit_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(50) NOT NULL DEFAULT 'benefit_card',
  `sku_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `spread_url` VARCHAR(1024) NOT NULL,
  `price` VARCHAR(32) NULL,
  `rebate_amount` VARCHAR(32) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_jd_benefit_sku_scene` (`sku_id`, `scene`),
  KEY `idx_jd_benefit_scene_sort` (`scene`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pdd_benefit_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(50) NOT NULL DEFAULT 'benefit_card',
  `link_key` VARCHAR(64) NOT NULL,
  `goods_id` VARCHAR(64) NULL,
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `spread_url` VARCHAR(1024) NOT NULL,
  `mini_path` VARCHAR(512) NULL,
  `price` VARCHAR(32) NULL,
  `coupon_price` VARCHAR(32) NULL,
  `rebate_amount` VARCHAR(32) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pdd_benefit_link_scene` (`link_key`, `scene`),
  KEY `idx_pdd_benefit_scene_sort` (`scene`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `benefit_alliance_config` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(50) NOT NULL DEFAULT 'benefit_card',
  `platform` VARCHAR(8) NOT NULL,
  `hero_image_url` VARCHAR(512) NOT NULL,
  `hero_title` VARCHAR(255) NULL,
  `hero_subtitle` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_benefit_alliance_scene_platform` (`scene`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `jd_benefit_goods` (`scene`,`sku_id`,`title`,`image_url`,`spread_url`,`price`,`rebate_amount`,`sort_order`,`status`,`created_at`,`updated_at`) VALUES
('benefit_card','c14OhB8','京东精选好物 1','/img/jd_benefit/c14OhB8.png','https://u.jd.com/c14OhB8','','',80,1,NOW(),NOW()),
('benefit_card','c14zUDW','京东精选好物 2','/img/jd_benefit/c14zUDW.png','https://u.jd.com/c14zUDW','','',70,1,NOW(),NOW()),
('benefit_card','c64wRk8','京东精选好物 3','/img/jd_benefit/c64wRk8.png','https://u.jd.com/c64wRk8','','',60,1,NOW(),NOW()),
('benefit_card','cG4nIbb','京东精选好物 4','/img/jd_benefit/cG4nIbb.png','https://u.jd.com/cG4nIbb','','',50,1,NOW(),NOW()),
('benefit_card','cG4vgVg','京东精选好物 5','/img/jd_benefit/cG4vgVg.png','https://u.jd.com/cG4vgVg','','',40,1,NOW(),NOW()),
('benefit_card','cO4Gh0k','京东精选好物 6','/img/jd_benefit/cO4Gh0k.png','https://u.jd.com/cO4Gh0k','','',30,1,NOW(),NOW()),
('benefit_card','cg409N9','京东精选好物 7','/img/jd_benefit/cg409N9.png','https://u.jd.com/cg409N9','','',20,1,NOW(),NOW()),
('benefit_card','cg4pcQF','京东精选好物 8','/img/jd_benefit/cg4pcQF.png','https://u.jd.com/cg4pcQF','','',10,1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `title`=VALUES(`title`),
  `image_url`=VALUES(`image_url`),
  `spread_url`=VALUES(`spread_url`),
  `price`=VALUES(`price`),
  `rebate_amount`=VALUES(`rebate_amount`),
  `sort_order`=VALUES(`sort_order`),
  `status`=VALUES(`status`),
  `updated_at`=VALUES(`updated_at`);

INSERT INTO `pdd_benefit_goods` (`scene`,`link_key`,`goods_id`,`title`,`image_url`,`spread_url`,`mini_path`,`price`,`coupon_price`,`rebate_amount`,`sort_order`,`status`,`created_at`,`updated_at`) VALUES
('benefit_card','6tA3bfap','6tA3bfap','拼多多精选 1','/img/pdd_benefit/6tA3bfap.jpeg','https://p.pinduoduo.com/6tA3bfap','pages/goods/goods?goods_id=6tA3bfap','','','',80,1,NOW(),NOW()),
('benefit_card','OF53r22C','OF53r22C','拼多多精选 2','/img/pdd_benefit/OF53r22C.jpeg','https://p.pinduoduo.com/OF53r22C','pages/goods/goods?goods_id=OF53r22C','','','',70,1,NOW(),NOW()),
('benefit_card','QE73xVwd','QE73xVwd','拼多多精选 3','/img/pdd_benefit/QE73xVwd.jpeg','https://p.pinduoduo.com/QE73xVwd','pages/goods/goods?goods_id=QE73xVwd','','','',60,1,NOW(),NOW()),
('benefit_card','VRM3IEUm','VRM3IEUm','拼多多精选 4','/img/pdd_benefit/VRM3IEUm.jpeg','https://p.pinduoduo.com/VRM3IEUm','pages/goods/goods?goods_id=VRM3IEUm','','','',50,1,NOW(),NOW()),
('benefit_card','Vvs3caRv','Vvs3caRv','拼多多精选 5','/img/pdd_benefit/Vvs3caRv.jpeg','https://p.pinduoduo.com/Vvs3caRv','pages/goods/goods?goods_id=Vvs3caRv','','','',40,1,NOW(),NOW()),
('benefit_card','bIn3iHWL','bIn3iHWL','拼多多精选 6','/img/pdd_benefit/bIn3iHWL.jpeg','https://p.pinduoduo.com/bIn3iHWL','pages/goods/goods?goods_id=bIn3iHWL','','','',30,1,NOW(),NOW()),
('benefit_card','jKH3Fh91','jKH3Fh91','拼多多精选 7','/img/pdd_benefit/jKH3Fh91.jpeg','https://p.pinduoduo.com/jKH3Fh91','pages/goods/goods?goods_id=jKH3Fh91','','','',20,1,NOW(),NOW()),
('benefit_card','nbf3xg02','nbf3xg02','拼多多精选 8','/img/pdd_benefit/nbf3xg02.jpeg','https://p.pinduoduo.com/nbf3xg02','pages/goods/goods?goods_id=nbf3xg02','','','',10,1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `goods_id`=VALUES(`goods_id`),
  `title`=VALUES(`title`),
  `image_url`=VALUES(`image_url`),
  `spread_url`=VALUES(`spread_url`),
  `mini_path`=VALUES(`mini_path`),
  `price`=VALUES(`price`),
  `coupon_price`=VALUES(`coupon_price`),
  `rebate_amount`=VALUES(`rebate_amount`),
  `sort_order`=VALUES(`sort_order`),
  `status`=VALUES(`status`),
  `updated_at`=VALUES(`updated_at`);

INSERT INTO `benefit_alliance_config` (`scene`,`platform`,`hero_image_url`,`hero_title`,`hero_subtitle`,`created_at`,`updated_at`) VALUES
('benefit_card','jd','/img/benefit_alliance/jd-alliance.png','','',NOW(),NOW()),
('benefit_card','pdd','/img/benefit_alliance/pdd-alliance.png','','',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `hero_image_url`=VALUES(`hero_image_url`),
  `hero_title`=VALUES(`hero_title`),
  `hero_subtitle`=VALUES(`hero_subtitle`),
  `updated_at`=VALUES(`updated_at`);
