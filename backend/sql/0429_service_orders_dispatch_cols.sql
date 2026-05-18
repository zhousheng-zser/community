-- 到家服务订单：九州派单字段（可重复执行）
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS group_key VARCHAR(64) NULL COMMENT '首页分组 key' AFTER service_title_snapshot,
  ADD COLUMN IF NOT EXISTS community_id BIGINT UNSIGNED NULL COMMENT '用户小区 ID' AFTER group_key,
  ADD COLUMN IF NOT EXISTS fulfillment_meta TEXT NULL COMMENT '履约元数据 JSON' AFTER community_id;
