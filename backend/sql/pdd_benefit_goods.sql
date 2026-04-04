-- 惠民卡 · 拼多多进宝（单表：一行一个商品，主图 + 推广链接）
CREATE TABLE IF NOT EXISTS `pdd_benefit_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(32) NOT NULL DEFAULT 'benefit_card' COMMENT '投放场景',
  `link_key` VARCHAR(64) NOT NULL COMMENT '推广链路径段，唯一标识，如 OF53r22C',
  `goods_id` VARCHAR(64) NULL COMMENT '拼多多商品ID，可选',
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(1024) NOT NULL COMMENT '列表主图',
  `spread_url` VARCHAR(1024) NOT NULL COMMENT '多多进宝/推广链接',
  `price` DECIMAL(10,2) NULL COMMENT '标价',
  `coupon_price` DECIMAL(10,2) NULL COMMENT '券后价',
  `rebate_amount` DECIMAL(10,2) NULL COMMENT '展示返利',
  `mini_path` VARCHAR(512) NULL COMMENT '微信内跳转路径，可选',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pdd_benefit_scene_link` (`scene`, `link_key`),
  KEY `idx_scene_status_sort` (`scene`, `status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
