-- 2026-04-29 创建集市商家工作台相关表：店铺表 + 商品表

-- ========== 店铺表 ==========
CREATE TABLE IF NOT EXISTS merchant_shops (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
  name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '店铺名称',
  logo VARCHAR(500) DEFAULT NULL COMMENT '店铺Logo',
  contact_name VARCHAR(50) DEFAULT NULL COMMENT '联系人姓名',
  contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系人电话',
  address VARCHAR(255) DEFAULT NULL COMMENT '店铺地址',
  latitude DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度',
  longitude DECIMAL(10, 7) DEFAULT NULL COMMENT '经度',
  business_hours VARCHAR(100) DEFAULT NULL COMMENT '营业时间',
  description TEXT COMMENT '店铺简介',
  category VARCHAR(50) DEFAULT NULL COMMENT '经营品类',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/approved/rejected/inactive',
  reject_reason VARCHAR(255) DEFAULT NULL COMMENT '驳回原因',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_lat_lng (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='集市商家店铺表';

-- ========== 商品表 ==========
CREATE TABLE IF NOT EXISTS merchant_goods (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL COMMENT '所属店铺ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '创建者用户ID',
  name VARCHAR(200) NOT NULL DEFAULT '' COMMENT '商品名称',
  title VARCHAR(200) DEFAULT NULL COMMENT '商品标题',
  main_image VARCHAR(500) DEFAULT NULL COMMENT '商品主图',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '售价',
  original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '原价',
  stock INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '库存数量',
  safe_stock INT UNSIGNED NOT NULL DEFAULT 5 COMMENT '安全库存阈值',
  sales_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '销量统计',
  description TEXT COMMENT '商品描述',
  status VARCHAR(20) NOT NULL DEFAULT 'off_sale' COMMENT '状态: on_sale/off_sale',
  is_published TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否上架: 0=否, 1=是',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序权重',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shop_id (shop_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_shop_status (shop_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='集市商家商品表';
