-- 拼多多惠民卡商品（与 Sequelize 迁移一致）
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
