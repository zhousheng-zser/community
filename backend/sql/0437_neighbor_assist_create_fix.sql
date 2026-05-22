-- 邻里帮帮创单修复：雪花 user_id、预约时间字段、联系电话

ALTER TABLE neighbor_assist_orders
  MODIFY COLUMN user_id BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN assigned_worker_id BIGINT UNSIGNED NULL DEFAULT NULL,
  MODIFY COLUMN dispatch_by BIGINT UNSIGNED NULL DEFAULT NULL;

-- 若列已存在可跳过本段
ALTER TABLE neighbor_assist_orders
  ADD COLUMN content TEXT NULL COMMENT '需求描述' AFTER remark;

ALTER TABLE neighbor_assist_orders
  ADD COLUMN contact_phone VARCHAR(30) NULL COMMENT '联系电话' AFTER content;
