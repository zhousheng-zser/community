-- 可选：惠民卡大牌连锁三条（sku_id=第三方小程序 AppId，mini_path=活动路径，来源 kfcdot）
-- 若已存在同 platform+scene 记录请先删除再执行，避免重复主键

INSERT INTO benefit_alliance_goods
  (platform, title, subtitle, image_url, sku_id, goods_id, spread_url, mini_path, keyword, sort_order, status, scene, created_at, updated_at)
VALUES
  ('chain_kfc', '肯德基', '炸鸡汉堡 · 在线点餐（聚推客）', '/img/benefit_chain/kfc.jpg', 'wx89752980e795bfde', '', '', '/pages/index/index?pub_id=462602&sid=123456&act_id=16&source=jutuike', '肯德基', 1, 'active', 'benefit_card', NOW(), NOW()),
  ('chain_xbk', '星巴克', '咖啡星享 · 在线点单（聚推客）', '/img/benefit_chain/xbk.jpg', 'wx89752980e795bfde', '', '', '/pages/index/index?pub_id=462602&sid=123456&act_id=34&source=jutuike', '星巴克', 2, 'active', 'benefit_card', NOW(), NOW()),
  ('chain_bgy', '百果园', '时令水果 · 外送门店（聚推客）', '/img/benefit_chain/bgy.jpg', 'wx89752980e795bfde', '', '', '/pages/index/index?pub_id=462602&sid=123456&act_id=31&source=jutuike', '百果园', 3, 'active', 'benefit_card', NOW(), NOW());
