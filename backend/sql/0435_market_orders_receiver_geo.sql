-- 集市订单收货坐标（美团/蜂鸟发单必填）

ALTER TABLE market_orders
  ADD COLUMN receiver_latitude DECIMAL(10, 6) NULL DEFAULT NULL COMMENT '收货纬度(高德)' AFTER receiver_address,
  ADD COLUMN receiver_longitude DECIMAL(10, 6) NULL DEFAULT NULL COMMENT '收货经度(高德)' AFTER receiver_latitude;
