-- 直约服务商购物车
CREATE TABLE IF NOT EXISTS service_cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL COMMENT 'service_provider_profiles.id',
  service_id BIGINT UNSIGNED NOT NULL,
  group_key VARCHAR(64) NOT NULL DEFAULT 'default',
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_provider_service (user_id, provider_id, service_id, group_key),
  KEY idx_user_provider (user_id, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='直约服务商购物车';
