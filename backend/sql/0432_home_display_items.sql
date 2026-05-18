-- 首页展示管理：技工 / 服务 / 服务商运营位
CREATE TABLE IF NOT EXISTS `home_display_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `kind` ENUM('worker', 'service', 'service_provider') NOT NULL COMMENT '展示类型',
  `target_id` INT NOT NULL COMMENT '关联目标 ID',
  `title` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '展示标题',
  `cover` VARCHAR(512) NULL COMMENT '封面图 URL',
  `description` VARCHAR(500) NULL COMMENT '描述',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序，越大越靠前',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0禁用',
  `extra` JSON NULL COMMENT '扩展字段',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kind_target` (`kind`, `target_id`),
  INDEX `idx_kind_status_sort` (`kind`, `status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序首页展示运营位';
