-- 2026-04-28 创建 benefit_alliance_goods 表，支持多平台推广素材
-- 字段兼容前端 benefit-alliance/goods 和 benefit-alliance/display 接口

CREATE TABLE IF NOT EXISTS benefit_alliance_goods (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(50) NOT NULL DEFAULT 'jd' COMMENT '平台：jd/pdd/taobao/meituan/shangou/shequn/tuixiao/brand',
  scene VARCHAR(50) NOT NULL DEFAULT 'benefit_card' COMMENT '使用场景',
  title VARCHAR(200) NOT NULL DEFAULT '' COMMENT '推广标题/商品名',
  subtitle VARCHAR(500) DEFAULT '' COMMENT '副标题/文案',
  image_url VARCHAR(500) DEFAULT '' COMMENT '图片URL',
  price VARCHAR(32) DEFAULT NULL COMMENT '价格',
  coupon_price VARCHAR(32) DEFAULT NULL COMMENT '券后价',
  rebate_amount VARCHAR(32) DEFAULT NULL COMMENT '返利金额',
  sku_id VARCHAR(100) DEFAULT '' COMMENT '京东SKU',
  goods_id VARCHAR(100) DEFAULT '' COMMENT '拼多多/淘宝商品ID',
  spread_url VARCHAR(500) DEFAULT '' COMMENT '推广短链接',
  mini_path VARCHAR(500) DEFAULT '' COMMENT '小程序跳转路径',
  keyword VARCHAR(100) DEFAULT '' COMMENT '关键词',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_platform_scene_status (platform, scene, status),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='惠民卡联盟推广商品表';
