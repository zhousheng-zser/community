-- 删除惠民卡闪购中错误推广域名的记录（kzurllG.cn 为录入笔误）
DELETE FROM benefit_alliance_goods
WHERE scene = 'benefit_card'
  AND platform = 'shangou'
  AND spread_url LIKE '%kzurllG.cn%';
