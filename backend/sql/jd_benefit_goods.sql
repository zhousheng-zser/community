-- 京东惠民卡商品（与 Sequelize 迁移一致）
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
