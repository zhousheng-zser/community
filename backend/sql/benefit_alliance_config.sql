-- 惠民卡 · 联盟页展示配置（头图与可选文案，按场景 + 平台唯一）
-- 商品列表仍分别存 jd_benefit_goods / pdd_benefit_goods
CREATE TABLE IF NOT EXISTS `benefit_alliance_config` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(32) NOT NULL DEFAULT 'benefit_card' COMMENT '投放场景，与小程序 scene 参数一致',
  `platform` VARCHAR(16) NOT NULL COMMENT 'jd | pdd',
  `hero_image_url` VARCHAR(1024) NOT NULL COMMENT '顶部横幅图：小程序包内路径如 /img/... 或完整 https URL',
  `hero_title` VARCHAR(128) NULL COMMENT '覆盖标题，空则小程序用默认文案',
  `hero_subtitle` VARCHAR(512) NULL COMMENT '覆盖副标题，空则小程序用默认文案',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用 0 停用',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_benefit_alliance_scene_platform` (`scene`, `platform`),
  KEY `idx_scene_status` (`scene`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
