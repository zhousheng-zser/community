-- 帖子按小区隔离：同 community_id 用户可见
ALTER TABLE posts ADD COLUMN community_id BIGINT NULL COMMENT '所属小区' AFTER category;
CREATE INDEX idx_posts_community_category ON posts (community_id, category);

UPDATE posts p
INNER JOIN users u ON p.user_id = u.id
SET p.community_id = u.community_id
WHERE p.community_id IS NULL AND u.community_id IS NOT NULL;
