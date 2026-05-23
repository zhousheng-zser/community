-- 集市订单：积分字段与完成时间（与 MarketOrder 模型对齐）

ALTER TABLE market_orders
  ADD COLUMN IF NOT EXISTS points_earned INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '本单已发放积分' AFTER expired_at;

ALTER TABLE market_orders
  ADD COLUMN IF NOT EXISTS delivered_at DATETIME NULL DEFAULT NULL AFTER cancelled_at;

ALTER TABLE market_orders
  ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL DEFAULT NULL AFTER delivered_at;
