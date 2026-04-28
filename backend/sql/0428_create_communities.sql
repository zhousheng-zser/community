-- 2026-04-28 创建 communities 表，存储真实小区列表
CREATE TABLE IF NOT EXISTS communities (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '小区名称',
  address VARCHAR(255) DEFAULT '' COMMENT '小区地址',
  latitude DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度',
  longitude DECIMAL(10, 7) DEFAULT NULL COMMENT '经度',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_sort (status, sort_order),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小区/社区表';

-- 插入种子数据（可根据实际运营小区替换）
INSERT INTO communities (name, address, sort_order, status) VALUES
('阳光社区', '杭州市西湖区阳光路1号', 1, 'active'),
('春风社区', '杭州市西湖区春风路2号', 2, 'active'),
('和谐社区', '杭州市西湖区和谐路3号', 3, 'active'),
('幸福里', '杭州市西湖区幸福路4号', 4, 'active'),
('翠竹苑', '杭州市西湖区翠竹路5号', 5, 'active'),
('紫云花园', '杭州市西湖区紫云路6号', 6, 'active'),
('金桂小区', '杭州市西湖区金桂路7号', 7, 'active'),
('玉兰公寓', '杭州市西湖区玉兰路8号', 8, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address), sort_order = VALUES(sort_order);
