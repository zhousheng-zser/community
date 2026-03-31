-- 惠民卡 · 京东联盟（单表：一行一个商品，含主图与推广链接）
CREATE TABLE IF NOT EXISTS `jd_benefit_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(32) NOT NULL DEFAULT 'benefit_card' COMMENT '投放场景',
  `sku_id` VARCHAR(32) NOT NULL COMMENT '京东 SKU',
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(1024) NOT NULL COMMENT '列表主图',
  `spread_url` VARCHAR(1024) NOT NULL COMMENT '联盟推广链接',
  `price` DECIMAL(10,2) NULL,
  `rebate_amount` DECIMAL(10,2) NULL COMMENT '展示返利',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_jd_benefit_scene_sku` (`scene`, `sku_id`),
  KEY `idx_scene_status_sort` (`scene`, `status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
