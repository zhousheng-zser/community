-- 小区主数据 + 服务范围（中心点 + 半径米）
-- 阳光小区 ↔ 合川路(地铁站) 300m；春风社区 ↔ 锦江区新华之星AI大厦 300m

CREATE TABLE IF NOT EXISTS community_service_areas (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  community_id BIGINT NOT NULL COMMENT '关联 communities.id',
  center_name VARCHAR(120) NOT NULL DEFAULT '' COMMENT '范围中心点名称',
  center_lat DECIMAL(10, 7) NOT NULL COMMENT '中心纬度 GCJ-02',
  center_lng DECIMAL(10, 7) NOT NULL COMMENT '中心经度 GCJ-02',
  radius_meters INT NOT NULL DEFAULT 300 COMMENT '服务半径(米)',
  keywords TEXT NULL COMMENT '选点文案关键词，逗号分隔',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_community (community_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小区地理服务范围';

INSERT INTO communities (id, name, address, latitude, longitude, status, created_at, updated_at) VALUES
(1, '阳光小区', '上海市闵行区合川路(地铁站)周边', 31.1697520, 121.3859450, 'active', NOW(), NOW()),
(2, '春风社区', '成都市锦江区新华之星AI大厦周边', 30.6571200, 104.0832100, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  address = VALUES(address),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  status = VALUES(status),
  updated_at = NOW();

DELETE FROM community_service_areas WHERE community_id IN (1, 2);

INSERT INTO community_service_areas (community_id, center_name, center_lat, center_lng, radius_meters, keywords, status) VALUES
(1, '合川路(地铁站)', 31.1697520, 121.3859450, 300,
 '合川路,合川路地铁站,合川(地铁站),闵行区合川路,阳光小区', 'active'),
(2, '锦江区新华之星AI大厦', 30.6571200, 104.0832100, 300,
 '新华之星,新华之星AI大厦,锦江区新华之星,春风社区', 'active');
