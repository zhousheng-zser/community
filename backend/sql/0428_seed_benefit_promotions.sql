-- 2026-04-28 惠民卡推广素材 seed 数据（含价格、券后价、返利、图片）
-- 来源：惠民卡补充数据/推广素材汇总文档.md
-- 执行前请先运行 0428_alter_benefit_alliance_platform.sql

-- 清空旧数据（可选，如需保留请注释掉）
-- DELETE FROM benefit_alliance_goods WHERE scene = 'benefit_card' AND platform IN ('meituan', 'taobao', 'shangou', 'shequn', 'tuixiao');

-- ==================== 美团（7条）====================
INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES
('meituan', '美团甄选好店', '美团甄选好店大额优惠专', 'http://dpurl.cn/DycykESZ', '/uploads/benefit/meituan-1.png', 50.00, 35.00, 3.00, 'active', 'benefit_card', 1, NOW(), NOW()),
('meituan', '美团机票特惠', '领百元员工内部福利，抢', 'http://dpurl.cn/nkQlRnRz', '/uploads/benefit/meituan-2.png', 100.00, 0.00, 10.00, 'active', 'benefit_card', 2, NOW(), NOW()),
('meituan', '美团品质会场', '尽享品质盛宴。畅领高额', 'http://dpurl.cn/RXUTCGHZ', '/uploads/benefit/meituan-3.png', 80.00, 55.00, 5.00, 'active', 'benefit_card', 3, NOW(), NOW()),
('meituan', '美团试吃官', '下单试吃得返现，最低1亍', 'https://wxaurl.cn/AKZYGLOERtr', '/uploads/benefit/meituan-4.png', 20.00, 1.00, 2.00, 'active', 'benefit_card', 4, NOW(), NOW()),
('meituan', '美团超市便利', '每周三在线满43减13元大', 'http://dpurl.cn/DG2hQsWZ', '/uploads/benefit/meituan-5.png', 43.00, 30.00, 4.00, 'active', 'benefit_card', 5, NOW(), NOW()),
('meituan', '美团外卖品质', '美团外卖品质商家红包', 'http://dpurl.cn/HSMbb7YZ', '/uploads/benefit/meituan-6.png', 30.00, 15.00, 2.00, 'active', 'benefit_card', 6, NOW(), NOW()),
('meituan', '美团评价有礼', '评价有礼单单返', 'https://kzurll.cn/toAtmA', '/uploads/benefit/meituan-7.png', 10.00, 0.00, 1.00, 'active', 'benefit_card', 7, NOW(), NOW());

-- ==================== 淘宝（6条）====================
INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES
('taobao', '小野和子防晒口罩', '[关晓彤同款]小野和子防晒口罩女防紫外线遮阳轻薄透气冰丝面罩', '￥YjsGSgJVgKA￥/CA8888', '/uploads/benefit/taobao-1.png', 39.90, 19.90, 2.00, 'active', 'benefit_card', 1, NOW(), NOW()),
('taobao', '可心柔婴儿保湿纸', '[买1送1]可心柔婴儿纸宝宝专用保湿纸乳霜抽纸柔纸巾100抽12包', '￥VF1359Jvkfn￥/CA8888', '/uploads/benefit/taobao-2.png', 59.90, 29.90, 3.00, 'active', 'benefit_card', 2, NOW(), NOW()),
('taobao', '理肤泉B5面霜', '[黄子弘凡推荐]理肤泉新B5面霜舒缓泛红印痕屏障修护换季受损', '￥aCk559JxgJi￥/CA8888', '/uploads/benefit/taobao-3.png', 129.00, 89.00, 5.00, 'active', 'benefit_card', 3, NOW(), NOW()),
('taobao', '瑞幸咖啡浓缩液', '[新品]瑞幸即享咖啡浓缩咖啡液速溶茉莉美式无糖黑咖啡拿铁32杯', '￥rgc459JxhAy￥/CA8888', '/uploads/benefit/taobao-4.png', 99.00, 69.00, 4.00, 'active', 'benefit_card', 4, NOW(), NOW()),
('taobao', '适乐肤C乳保湿', 'CeraVe适乐肤C乳保湿身体乳液面霜敏感肌男女官方正品张凌赫同款', '￥KCg959JykFS￥/CA8888', '/uploads/benefit/taobao-5.png', 108.00, 78.00, 4.50, 'active', 'benefit_card', 5, NOW(), NOW()),
('taobao', '太力真空压缩袋', '太力抗菌真空收纳压缩袋被子棉被衣服羽绒旅行专用免抽气立体袋子', '￥UklH5gJyvQq￥/CA8888', '/uploads/benefit/taobao-6.png', 49.90, 29.90, 2.50, 'active', 'benefit_card', 6, NOW(), NOW());

-- ==================== 闪购（9条）====================
INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES
('shangou', '饿了么天天领红包', '饿了么外卖红包天天领', 'https://u.ele.me/lGJublRc', '/uploads/benefit/shangou-1.png', 15.00, 0.00, 1.00, 'active', 'benefit_card', 1, NOW(), NOW()),
('shangou', '淘宝闪购红包', '淘宝大放水啦拉15减14', 'https://kzurlol.cn/tOAtMA', '/uploads/benefit/shangou-2.png', 15.00, 1.00, 1.50, 'active', 'benefit_card', 2, NOW(), NOW()),
('shangou', '饿了么大额红包', '领最高15元大额红包', 'https://kzurllG.cn/toAtmH', '/uploads/benefit/shangou-3.png', 15.00, 0.00, 1.00, 'active', 'benefit_card', 3, NOW(), NOW()),
('shangou', '饿了么天天领红包', '饿了么天天领红包', 'https://u.ele.me/ZouiklUg', '/uploads/benefit/shangou-4.png', 10.00, 0.00, 0.80, 'active', 'benefit_card', 4, NOW(), NOW()),
('shangou', '饿了么天天领红包', '饿了么天天领红包', 'https://u.ele.me/jKSGHrOO', '/uploads/benefit/shangou-5.png', 10.00, 0.00, 0.80, 'active', 'benefit_card', 5, NOW(), NOW()),
('shangou', '饿了么消费日', '饿了么21城消费日活动', 'https://kzurlOG.cn/tOAtjX', '/uploads/benefit/shangou-6.png', 20.00, 0.00, 1.50, 'active', 'benefit_card', 6, NOW(), NOW()),
('shangou', '饿了么天天领红包', '每天可领。每周五五折红', 'https://u.ele.me/UkxECqd3', '/uploads/benefit/shangou-7.png', 10.00, 0.00, 0.80, 'active', 'benefit_card', 7, NOW(), NOW()),
('shangou', '超低价爆品', '超低价爆品来袭', 'https://kzurllG.cn/toAtBn', '/uploads/benefit/shangou-8.png', 19.90, 4.90, 1.00, 'active', 'benefit_card', 8, NOW(), NOW()),
('shangou', '超市好价', '超市好价即刻送达', 'https://kzurlol.cn/toAtVa', '/uploads/benefit/shangou-9.png', 30.00, 15.00, 2.00, 'active', 'benefit_card', 9, NOW(), NOW());

-- ==================== 社群（1条）====================
INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES
('shequn', '社群专享福利', '社群专享。9.9元吃饱喝足', 'https://kzurllo.cn/toAtmy', '/uploads/benefit/shequn-1.png', 19.90, 9.90, 1.00, 'active', 'benefit_card', 1, NOW(), NOW());

-- ==================== 推销（4条）====================
INSERT INTO benefit_alliance_goods (platform, title, subtitle, spread_url, image_url, price, coupon_price, rebate_amount, status, scene, sort_order, created_at, updated_at) VALUES
('tuixiao', '一元外卖', '下单试吃得返现，最低1元吃外卖', 'https://wxaurl.cn/AKZYGLOERtr', '/uploads/benefit/tuixiao-1.png', 20.00, 1.00, 2.00, 'active', 'benefit_card', 1, NOW(), NOW()),
('tuixiao', '夏日山海', '领百元员工内部福利，抢', 'http://dpurl.cn/lhWBRoYZ', '/uploads/benefit/tuixiao-2.png', 100.00, 0.00, 10.00, 'active', 'benefit_card', 2, NOW(), NOW()),
('tuixiao', '美团会员', '白银会员权益X机票火车票', 'https://kzurlog.cn/toA3mo', '/uploads/benefit/tuixiao-3.png', 30.00, 15.00, 2.00, 'active', 'benefit_card', 3, NOW(), NOW()),
('tuixiao', '送你券包', '最高可领100元券包', 'https://kzurll5.cn/tOA3cB', '/uploads/benefit/tuixiao-4.png', 100.00, 0.00, 5.00, 'active', 'benefit_card', 4, NOW(), NOW());
