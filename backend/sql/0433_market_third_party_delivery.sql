-- 本地集市：美团/饿了么/自配送

ALTER TABLE market_orders
  ADD COLUMN delivery_carrier VARCHAR(20) NULL DEFAULT NULL COMMENT 'self|meituan|eleme' AFTER delivery_mode,
  ADD COLUMN delivery_job_status VARCHAR(32) NULL DEFAULT NULL COMMENT '配送单状态' AFTER delivery_carrier,
  ADD COLUMN delivery_external_no VARCHAR(64) NULL DEFAULT NULL COMMENT '三方配送单号' AFTER delivery_job_status;

CREATE TABLE IF NOT EXISTS market_delivery_jobs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL,
  shop_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(20) NOT NULL COMMENT 'self|meituan|eleme',
  external_order_no VARCHAR(64) NULL,
  job_status VARCHAR(32) NOT NULL DEFAULT 'created',
  rider_name VARCHAR(50) NULL,
  rider_phone VARCHAR(30) NULL,
  fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payload_json TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order_provider (order_no, provider),
  INDEX idx_order_no (order_no),
  INDEX idx_external (external_order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='集市配送任务';

CREATE TABLE IF NOT EXISTS market_delivery_tracks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  order_no VARCHAR(40) NOT NULL,
  status_code VARCHAR(32) NOT NULL,
  status_text VARCHAR(100) NOT NULL DEFAULT '',
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job (job_id),
  INDEX idx_order (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配送进度节点';
