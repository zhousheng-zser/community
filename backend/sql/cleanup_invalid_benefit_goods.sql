-- 惠民卡：清理无效推广链/商品（2026-05-18）
-- 在 120 执行: mysql -uroot -pCommunityPwd123! community_db < backend/sql/cleanup_invalid_benefit_goods.sql

-- 1) 笔误域名 kzurllG.cn（闪购录入错误）
DELETE FROM benefit_alliance_goods
WHERE scene = 'benefit_card'
  AND spread_url LIKE '%kzurllG.cn%';

-- 2) 美团评价有礼等误链 kzurll.cn（非官方 dpurl/wxaurl）
DELETE FROM benefit_alliance_goods
WHERE scene = 'benefit_card'
  AND platform = 'meituan'
  AND spread_url LIKE '%kzurll%';

-- 3) 淘宝仅淘口令、无 http 链接（小程序无法直接打开）
UPDATE benefit_alliance_goods
SET status = 'inactive', updated_at = NOW()
WHERE scene = 'benefit_card'
  AND platform = 'taobao'
  AND spread_url NOT LIKE 'http%'
  AND spread_url LIKE '￥%';

-- 4) 空推广链
DELETE FROM benefit_alliance_goods
WHERE scene = 'benefit_card'
  AND (spread_url IS NULL OR TRIM(spread_url) = '');
