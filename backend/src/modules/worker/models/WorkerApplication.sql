-- 手动创建 worker_applications 表（当 sequelize.sync 不可用时执行）
CREATE TABLE IF NOT EXISTS `worker_applications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '申请人用户ID',
  `name` VARCHAR(100) NOT NULL DEFAULT '',
  `phone` VARCHAR(20) NOT NULL DEFAULT '',
  `industry` VARCHAR(100) DEFAULT '',
  `education` VARCHAR(50) DEFAULT '',
  `city` VARCHAR(200) DEFAULT '',
  `resume` TEXT,
  `id_card_url` VARCHAR(500) DEFAULT '',
  `work_photo_url` VARCHAR(500) DEFAULT '',
  `certificate_url` TEXT,
  `services` TEXT,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected',
  `reject_reason` VARCHAR(500) DEFAULT '',
  `reviewed_by` BIGINT COMMENT '审核人ID',
  `reviewed_at` DATETIME,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
