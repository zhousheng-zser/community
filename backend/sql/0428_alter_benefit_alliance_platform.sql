-- 2026-04-28 扩展 benefit_alliance_goods 表 platform 字段，支持更多平台
ALTER TABLE benefit_alliance_goods MODIFY platform VARCHAR(50) NOT NULL DEFAULT 'jd';
