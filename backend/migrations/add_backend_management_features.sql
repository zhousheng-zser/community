-- 后台管理系统功能补充 - 数据库迁移脚本
-- 执行日期: 2026-04-22
-- 说明: 添加社区管理、公告管理、权限管理等相关表

-- ============================================
-- 1. 社区管理表
-- ============================================
CREATE TABLE IF NOT EXISTS `communities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '社区名称',
  `address` VARCHAR(255) NULL COMMENT '社区地址',
  `contact_phone` VARCHAR(20) NULL COMMENT '联系电话',
  `longitude` DECIMAL(10, 7) NULL COMMENT '经度',
  `latitude` DECIMAL(10, 7) NULL COMMENT '纬度',
  `service_radius` INT DEFAULT 3000 COMMENT '服务半径(米)',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区表';

-- ============================================
-- 2. 公告管理表
-- ============================================
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL COMMENT '公告标题',
  `content` TEXT NULL COMMENT '公告内容',
  `type` ENUM('system', 'community', 'activity') DEFAULT 'system' COMMENT '公告类型',
  `community_id` INT NULL COMMENT '所属社区ID，为空则全局公告',
  `priority` INT DEFAULT 0 COMMENT '优先级，数字越大越靠前',
  `status` ENUM('draft', 'published', 'expired') DEFAULT 'draft' COMMENT '状态',
  `publish_time` DATETIME NULL COMMENT '发布时间',
  `expire_time` DATETIME NULL COMMENT '过期时间',
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_community` (`community_id`),
  INDEX `idx_publish_time` (`publish_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- ============================================
-- 3. 权限管理表
-- ============================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `code` VARCHAR(50) NOT NULL COMMENT '角色编码',
  `description` VARCHAR(255) NULL COMMENT '角色描述',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '权限名称',
  `code` VARCHAR(100) NOT NULL COMMENT '权限编码',
  `type` ENUM('menu', 'button', 'api') DEFAULT 'menu' COMMENT '权限类型',
  `parent_id` INT NULL COMMENT '父级权限ID',
  `path` VARCHAR(255) NULL COMMENT '菜单路径或API路径',
  `icon` VARCHAR(100) NULL COMMENT '菜单图标',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `role_id` INT NOT NULL COMMENT '角色ID',
  `permission_id` INT NOT NULL COMMENT '权限ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  INDEX `idx_role` (`role_id`),
  INDEX `idx_permission` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- ============================================
-- 4. 初始化角色数据
-- ============================================
INSERT INTO `roles` (`name`, `code`, `description`, `status`) VALUES
('超级管理员', 'super_admin', '拥有所有权限', 'active'),
('运营管理员', 'operator', '负责日常运营管理', 'active'),
('客服', 'customer_service', '负责客户服务', 'active'),
('财务', 'finance', '负责财务管理', 'active');

-- ============================================
-- 5. 初始化权限数据
-- ============================================
INSERT INTO `permissions` (`name`, `code`, `type`, `parent_id`, `path`, `icon`, `sort`, `status`) VALUES
('数据概览', 'dashboard', 'menu', NULL, '/dashboard', 'dashboard', 1, 'active'),
('用户管理', 'user_manage', 'menu', NULL, '/users', 'user', 2, 'active'),
('用户列表', 'user_list', 'menu', 2, '/users/list', NULL, 1, 'active'),
('技工管理', 'worker_manage', 'menu', NULL, '/workers', 'team', 3, 'active'),
('技工申请', 'worker_application', 'menu', 4, '/workers/application', NULL, 1, 'active'),
('技工列表', 'worker_list', 'menu', 4, '/workers/list', NULL, 2, 'active'),
('订单管理', 'order_manage', 'menu', NULL, '/orders', 'shopping', 4, 'active'),
('服务订单', 'service_order', 'menu', 7, '/orders/service', NULL, 1, 'active'),
('集市订单', 'market_order', 'menu', 7, '/orders/market', NULL, 2, 'active'),
('邻里帮帮', 'neighbor_assist', 'menu', 7, '/orders/neighbor', NULL, 3, 'active'),
('派单管理', 'dispatch_manage', 'menu', NULL, '/dispatch', 'schedule', 5, 'active'),
('本地集市', 'market_manage', 'menu', NULL, '/market', 'shop', 6, 'active'),
('店铺管理', 'shop_manage', 'menu', 12, '/market/shops', NULL, 1, 'active'),
('商品管理', 'goods_manage', 'menu', 12, '/market/goods', NULL, 2, 'active'),
('财务管理', 'finance_manage', 'menu', NULL, '/finance', 'money', 7, 'active'),
('结算对账', 'settlement', 'menu', 15, '/finance/settlement', NULL, 1, 'active'),
('退款管理', 'refund', 'menu', 15, '/finance/refund', NULL, 2, 'active'),
('营销管理', 'marketing_manage', 'menu', NULL, '/marketing', 'gift', 8, 'active'),
('优惠券管理', 'coupon_manage', 'menu', 18, '/marketing/coupon', NULL, 1, 'active'),
('活动管理', 'activity_manage', 'menu', 18, '/marketing/activity', NULL, 2, 'active'),
('社区管理', 'community_manage', 'menu', NULL, '/community', 'home', 9, 'active'),
('社区列表', 'community_list', 'menu', 21, '/community/list', NULL, 1, 'active'),
('公告管理', 'announcement_manage', 'menu', 21, '/community/announcement', NULL, 2, 'active'),
('系统设置', 'system_manage', 'menu', NULL, '/system', 'setting', 10, 'active'),
('角色管理', 'role_manage', 'menu', 24, '/system/role', NULL, 1, 'active'),
('权限管理', 'permission_manage', 'menu', 24, '/system/permission', NULL, 2, 'active');

-- ============================================
-- 6. 初始化角色权限关联
-- ============================================
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions`;

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM `permissions` WHERE `code` IN ('dashboard', 'user_manage', 'user_list', 'worker_manage', 'worker_application', 'worker_list', 'order_manage', 'service_order', 'market_order', 'neighbor_assist', 'dispatch_manage', 'market_manage', 'shop_manage', 'goods_manage', 'marketing_manage', 'coupon_manage', 'activity_manage', 'community_manage', 'community_list', 'announcement_manage');

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, id FROM `permissions` WHERE `code` IN ('dashboard', 'order_manage', 'service_order', 'market_order', 'neighbor_assist', 'community_manage', 'announcement_manage');

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 4, id FROM `permissions` WHERE `code` IN ('dashboard', 'finance_manage', 'settlement', 'refund');

-- ============================================
-- 7. 为服务商表添加余额字段（如果不存在）
-- ============================================
ALTER TABLE `service_provider_profiles` 
ADD COLUMN IF NOT EXISTS `balance` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '账户余额',
ADD COLUMN IF NOT EXISTS `frozen_balance` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '冻结余额';

-- ============================================
-- 8. 为商家表添加余额字段（如果不存在）
-- ============================================
ALTER TABLE `shops`
ADD COLUMN IF NOT EXISTS `balance` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '账户余额',
ADD COLUMN IF NOT EXISTS `frozen_balance` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '冻结余额';

-- ============================================
-- 9. 创建提现记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('service_provider', 'merchant', 'worker') NOT NULL COMMENT '用户类型',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '提现金额',
  `bank_name` VARCHAR(100) NULL COMMENT '银行名称',
  `bank_account` VARCHAR(50) NULL COMMENT '银行账号',
  `account_name` VARCHAR(50) NULL COMMENT '账户名',
  `status` ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending' COMMENT '状态',
  `apply_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `approve_time` DATETIME NULL COMMENT '审核时间',
  `complete_time` DATETIME NULL COMMENT '完成时间',
  `remark` VARCHAR(255) NULL COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_type`, `user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- ============================================
-- 10. 创建消息通知表
-- ============================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('user', 'worker', 'service_provider', 'merchant', 'admin') NOT NULL COMMENT '用户类型',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT NULL COMMENT '通知内容',
  `type` ENUM('system', 'order', 'finance', 'activity') DEFAULT 'system' COMMENT '通知类型',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `read_time` DATETIME NULL COMMENT '阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_type`, `user_id`),
  INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表';

-- ============================================
-- 完成
-- ============================================
SELECT '数据库迁移完成' AS message;
