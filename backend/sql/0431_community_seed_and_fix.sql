INSERT INTO communities (name, address, status, created_at, updated_at) VALUES
('阳光社区', '杭州市西湖区阳光路1号', 'active', NOW(), NOW()),
('春风社区', '杭州市西湖区春风路2号', 'active', NOW(), NOW()),
('和谐社区', '杭州市西湖区和谐路3号', 'active', NOW(), NOW()),
('测试社区A', 'E2E测试小区', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

UPDATE community_steward_profiles
SET community_id = COALESCE(community_id, 1),
    hotline = COALESCE(NULLIF(hotline, ''), phone, '400-888-0001')
WHERE status = 'active';
