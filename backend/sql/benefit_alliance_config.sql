-- 惠民卡顶栏配置（与 Sequelize 迁移一致）
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
