-- 邻里帮帮：上门打卡

ALTER TABLE neighbor_assist_orders
  ADD COLUMN check_in_at DATETIME NULL DEFAULT NULL COMMENT '上门打卡时间' AFTER dispatch_by,
  ADD COLUMN check_in_lat DECIMAL(10, 6) NULL DEFAULT NULL COMMENT '打卡纬度' AFTER check_in_at,
  ADD COLUMN check_in_lng DECIMAL(10, 6) NULL DEFAULT NULL COMMENT '打卡经度' AFTER check_in_lat;
