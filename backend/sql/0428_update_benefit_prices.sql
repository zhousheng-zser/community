-- 2026-04-28 更新 benefit_alliance_goods 价格、券后价、返利金额及图片
-- 使用 platform + sort_order 定位，不再依赖精确 title 匹配
-- 执行前请先确认当前数据：SELECT id, platform, sort_order, title, price FROM benefit_alliance_goods WHERE scene = 'benefit_card' AND platform IN ('meituan','taobao','shangou','shequn','tuixiao');

-- ==================== 美团（7条）====================
UPDATE benefit_alliance_goods SET
  price = 50.00,
  coupon_price = 35.00,
  rebate_amount = 3.00,
  image_url = '/uploads/benefit/meituan-1.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 1;

UPDATE benefit_alliance_goods SET
  price = 100.00,
  coupon_price = 0.00,
  rebate_amount = 10.00,
  image_url = '/uploads/benefit/meituan-2.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 2;

UPDATE benefit_alliance_goods SET
  price = 80.00,
  coupon_price = 55.00,
  rebate_amount = 5.00,
  image_url = '/uploads/benefit/meituan-3.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 3;

UPDATE benefit_alliance_goods SET
  price = 20.00,
  coupon_price = 1.00,
  rebate_amount = 2.00,
  image_url = '/uploads/benefit/meituan-4.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 4;

UPDATE benefit_alliance_goods SET
  price = 43.00,
  coupon_price = 30.00,
  rebate_amount = 4.00,
  image_url = '/uploads/benefit/meituan-5.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 5;

UPDATE benefit_alliance_goods SET
  price = 30.00,
  coupon_price = 15.00,
  rebate_amount = 2.00,
  image_url = '/uploads/benefit/meituan-6.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 6;

UPDATE benefit_alliance_goods SET
  price = 10.00,
  coupon_price = 0.00,
  rebate_amount = 1.00,
  image_url = '/uploads/benefit/meituan-7.png'
WHERE platform = 'meituan' AND scene = 'benefit_card' AND sort_order = 7;

-- ==================== 淘宝（6条）====================
UPDATE benefit_alliance_goods SET
  price = 39.90,
  coupon_price = 19.90,
  rebate_amount = 2.00,
  image_url = '/uploads/benefit/taobao-1.png'
WHERE platform = 'taobao' AND scene = 'benefit_card' AND sort_order = 1;

UPDATE benefit_alliance_goods SET
  price = 59.90,
  coupon_price = 29.90,
  rebate_amount = 3.00,
  image_url = '/uploads/benefit/taobao-2.png'
WHERE platform = 'taobao' AND scene = 'benefit_card' AND sort_order = 2;

UPDATE benefit_alliance_goods SET
  price = 129.00,
  coupon_price = 89.00,
  rebate_amount = 5.00,
  image_url = '/uploads/benefit/taobao-3.png'
WHERE platform = 'taobao' AND scene = 'benefit_card' AND sort_order = 3;

UPDATE benefit_alliance_goods SET
  price = 99.00,
  coupon_price = 69.00,
  rebate_amount = 4.00,
  image_url = '/uploads/benefit/taobao-4.png'
WHERE platform = 'taobao' AND scene = 'benefit_card' AND sort_order = 4;

UPDATE benefit_alliance_goods SET
  price = 108.00,
  coupon_price = 78.00,
  rebate_amount = 4.50,
  image_url = '/uploads/benefit/taobao-5.png'
WHERE platform = 'taobao' AND scene = 'benefit_card' AND sort_order = 5;

UPDATE benefit_alliance_goods SET
  price = 49.90,
  coupon_price = 29.90,
  rebate_amount = 2.50,
  image_url = '/uploads/benefit/taobao-6.png'
WHERE platform = 'taobao' AND scene = 'benefit_card' AND sort_order = 6;

-- ==================== 闪购（7条，sort 3/8 无效链已删）====================
UPDATE benefit_alliance_goods SET
  price = 15.00,
  coupon_price = 0.00,
  rebate_amount = 1.00,
  image_url = '/uploads/benefit/shangou-1.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 1;

UPDATE benefit_alliance_goods SET
  price = 15.00,
  coupon_price = 1.00,
  rebate_amount = 1.50,
  image_url = '/uploads/benefit/shangou-2.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 2;

UPDATE benefit_alliance_goods SET
  price = 10.00,
  coupon_price = 0.00,
  rebate_amount = 0.80,
  image_url = '/uploads/benefit/shangou-4.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 4;

UPDATE benefit_alliance_goods SET
  price = 10.00,
  coupon_price = 0.00,
  rebate_amount = 0.80,
  image_url = '/uploads/benefit/shangou-5.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 5;

UPDATE benefit_alliance_goods SET
  price = 20.00,
  coupon_price = 0.00,
  rebate_amount = 1.50,
  image_url = '/uploads/benefit/shangou-6.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 6;

UPDATE benefit_alliance_goods SET
  price = 10.00,
  coupon_price = 0.00,
  rebate_amount = 0.80,
  image_url = '/uploads/benefit/shangou-7.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 7;

UPDATE benefit_alliance_goods SET
  price = 30.00,
  coupon_price = 15.00,
  rebate_amount = 2.00,
  image_url = '/uploads/benefit/shangou-9.png'
WHERE platform = 'shangou' AND scene = 'benefit_card' AND sort_order = 9;

-- ==================== 社群（1条）====================
UPDATE benefit_alliance_goods SET
  price = 19.90,
  coupon_price = 9.90,
  rebate_amount = 1.00,
  image_url = '/uploads/benefit/shequn-1.png'
WHERE platform = 'shequn' AND scene = 'benefit_card' AND sort_order = 1;

-- ==================== 推销（4条）====================
UPDATE benefit_alliance_goods SET
  price = 20.00,
  coupon_price = 1.00,
  rebate_amount = 2.00,
  image_url = '/uploads/benefit/tuixiao-1.png'
WHERE platform = 'tuixiao' AND scene = 'benefit_card' AND sort_order = 1;

UPDATE benefit_alliance_goods SET
  price = 100.00,
  coupon_price = 0.00,
  rebate_amount = 10.00,
  image_url = '/uploads/benefit/tuixiao-2.png'
WHERE platform = 'tuixiao' AND scene = 'benefit_card' AND sort_order = 2;

UPDATE benefit_alliance_goods SET
  price = 30.00,
  coupon_price = 15.00,
  rebate_amount = 2.00,
  image_url = '/uploads/benefit/tuixiao-3.png'
WHERE platform = 'tuixiao' AND scene = 'benefit_card' AND sort_order = 3;

UPDATE benefit_alliance_goods SET
  price = 100.00,
  coupon_price = 0.00,
  rebate_amount = 5.00,
  image_url = '/uploads/benefit/tuixiao-4.png'
WHERE platform = 'tuixiao' AND scene = 'benefit_card' AND sort_order = 4;
