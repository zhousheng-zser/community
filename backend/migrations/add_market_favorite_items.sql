-- 用户集市商品收藏（每用户一条记录对应一个 goods_id，即默认「一个收藏夹」）
-- 商品唯一标识：与 GET /api/v1/market/shops/:shopId/goods 返回列表中的 id 一致，对应表 market_goods.id

CREATE TABLE IF NOT EXISTS `market_favorite_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `goods_id` int NOT NULL COMMENT 'market_goods.id',
  `shop_id` int NOT NULL COMMENT '冗余自 market_goods.shop_id，便于按店筛选',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_goods` (`user_id`,`goods_id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_user_shop` (`user_id`,`shop_id`),
  KEY `idx_goods` (`goods_id`),
  CONSTRAINT `market_favorite_items_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `market_favorite_items_ibfk_goods` FOREIGN KEY (`goods_id`) REFERENCES `market_goods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
