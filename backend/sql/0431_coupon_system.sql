-- 平台优惠券（满减券）
CREATE TABLE IF NOT EXISTS coupon_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL DEFAULT '' COMMENT '模板编码，如 WELCOME_100_10',
  name VARCHAR(120) NOT NULL DEFAULT '',
  type VARCHAR(20) NOT NULL DEFAULT 'amount' COMMENT 'amount=满减',
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '减免金额',
  threshold_amount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '满多少可用',
  total_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=不限量',
  issued_count INT UNSIGNED NOT NULL DEFAULT 0,
  valid_from DATETIME NULL,
  valid_to DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (code),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券模板';

CREATE TABLE IF NOT EXISTS coupon_issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'unused' COMMENT 'unused/used/expired',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  order_type VARCHAR(32) NULL COMMENT 'service/market',
  order_ref VARCHAR(64) NULL COMMENT '订单号或ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_status (user_id, status),
  KEY idx_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券';

INSERT INTO coupon_templates (code, name, type, discount_amount, threshold_amount, total_count, valid_from, valid_to, status)
SELECT 'WELCOME_100_20', '满100减20新人券', 'amount', 20.00, 100.00, 0,
  NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code = 'WELCOME_100_20' LIMIT 1);
