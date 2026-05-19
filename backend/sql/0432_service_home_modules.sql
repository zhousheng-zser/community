-- 首页九宫格模块（九州中台「服务管理」维护）
CREATE TABLE IF NOT EXISTS service_home_modules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_key VARCHAR(64) NOT NULL COMMENT '分组 key，如 tidy、urgent_fix',
  title VARCHAR(100) NOT NULL DEFAULT '',
  price_unit VARCHAR(20) NOT NULL DEFAULT '次',
  icon_url VARCHAR(512) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_group_key (group_key),
  KEY idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页生活服务九宫格模块';
