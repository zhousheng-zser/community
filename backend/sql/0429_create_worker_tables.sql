-- 2026-04-29 创建技工相关表

-- ========== 技工入驻申请表 ==========
CREATE TABLE IF NOT EXISTS worker_applications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '申请人用户ID',
  name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '姓名',
  phone VARCHAR(20) NOT NULL DEFAULT '' COMMENT '手机号',
  industry VARCHAR(100) DEFAULT '' COMMENT '意向行业',
  education VARCHAR(50) DEFAULT '' COMMENT '学历',
  city VARCHAR(200) DEFAULT '' COMMENT '城市/籍贯',
  resume TEXT COMMENT '简历',
  id_card_url VARCHAR(500) DEFAULT '' COMMENT '身份证照URL',
  work_photo_url VARCHAR(500) DEFAULT '' COMMENT '工作生活照URL',
  certificate_url TEXT COMMENT '专业证书URL数组(JSON)',
  services TEXT COMMENT '服务列表(JSON)',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/approved/rejected',
  reject_reason VARCHAR(500) DEFAULT '' COMMENT '驳回原因',
  reviewed_by BIGINT DEFAULT NULL COMMENT '审核人ID',
  reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技工入驻申请表';

-- ========== 技工服务管理表 ==========
CREATE TABLE IF NOT EXISTS worker_services (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '所属用户ID',
  name VARCHAR(200) NOT NULL DEFAULT '' COMMENT '服务名称',
  price VARCHAR(50) DEFAULT NULL COMMENT '服务价格',
  description TEXT COMMENT '服务描述',
  status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技工服务管理表';
