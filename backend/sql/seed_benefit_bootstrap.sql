-- 惠民卡联盟：一键建表（若不存在）+ 灌入与种子脚本一致的数据
-- 用法：mysql -u root -p community < backend/sql/seed_benefit_bootstrap.sql
-- 或在客户端中选择库后执行本文件。

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `jd_benefit_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(32) NOT NULL DEFAULT 'benefit_card' COMMENT '投放场景',
  `sku_id` VARCHAR(32) NOT NULL COMMENT '京挑客短链 path（u.jd.com 路径段）',
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(1024) NOT NULL COMMENT '列表主图',
  `spread_url` VARCHAR(1024) NOT NULL COMMENT '联盟推广链接',
  `price` DECIMAL(10,2) NULL,
  `rebate_amount` DECIMAL(10,2) NULL COMMENT '展示返利',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_jd_benefit_scene_sku` (`scene`, `sku_id`),
  KEY `idx_scene_status_sort` (`scene`, `status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pdd_benefit_goods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(32) NOT NULL DEFAULT 'benefit_card' COMMENT '投放场景',
  `link_key` VARCHAR(64) NOT NULL COMMENT '推广链路径段',
  `goods_id` VARCHAR(64) NULL COMMENT '拼多多商品ID，可选',
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(1024) NOT NULL COMMENT '列表主图',
  `spread_url` VARCHAR(1024) NOT NULL COMMENT '推广链接',
  `price` DECIMAL(10,2) NULL COMMENT '标价',
  `coupon_price` DECIMAL(10,2) NULL COMMENT '券后价',
  `rebate_amount` DECIMAL(10,2) NULL COMMENT '展示返利',
  `mini_path` VARCHAR(512) NULL COMMENT '微信内跳转路径，可选',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pdd_benefit_scene_link` (`scene`, `link_key`),
  KEY `idx_scene_status_sort` (`scene`, `status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `benefit_alliance_config` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene` VARCHAR(32) NOT NULL DEFAULT 'benefit_card' COMMENT '投放场景',
  `platform` VARCHAR(16) NOT NULL COMMENT 'jd | pdd',
  `hero_image_url` VARCHAR(1024) NOT NULL COMMENT '顶部横幅图',
  `hero_title` VARCHAR(128) NULL,
  `hero_subtitle` VARCHAR(512) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用 0 停用',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_benefit_alliance_scene_platform` (`scene`, `platform`),
  KEY `idx_scene_status` (`scene`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 京东 8 条
INSERT INTO `jd_benefit_goods` (`scene`,`sku_id`,`title`,`image_url`,`spread_url`,`price`,`rebate_amount`,`sort_order`,`status`) VALUES
('benefit_card','c64wRk8','雪亮500张大包抽纸优等品5层加厚纸巾大尺寸面巾纸餐巾纸可湿水卫生纸 5层 500张','/img/jd_benefit/c64wRk8.png','https://u.jd.com/c64wRk8',NULL,NULL,1,1),
('benefit_card','cg409N9','伊利【新鲜日期】纯牛奶250ml*21盒 早餐奶 财神装普通礼盒装混发','/img/jd_benefit/cg409N9.png','https://u.jd.com/cg409N9',NULL,NULL,2,1),
('benefit_card','c14zUDW','鲜京采 30/40厄瓜多尔白虾 去冰净重3.3斤 50-66只/盒','/img/jd_benefit/c14zUDW.png','https://u.jd.com/c14zUDW',NULL,NULL,3,1),
('benefit_card','cO4Gh0k','圣上用膳五常大米 10斤 GB/T 19266 五常香米 当季新米 东北大米','/img/jd_benefit/cO4Gh0k.png','https://u.jd.com/cO4Gh0k',NULL,NULL,4,1),
('benefit_card','cG4nIbb','京鲜生 四川春见耙耙柑 净重8.5-9斤水果礼盒 单果170g+ 源头直发包邮','/img/jd_benefit/cG4nIbb.png','https://u.jd.com/cG4nIbb',NULL,NULL,5,1),
('benefit_card','cG4vgVg','伊利【新鲜日期】金典纯牛奶早餐奶250ml*16 3.6g乳蛋白 礼盒装 2-3月','/img/jd_benefit/cG4vgVg.png','https://u.jd.com/cG4vgVg',NULL,NULL,6,1),
('benefit_card','cg4pcQF','漫花山茶花大包抽纸纸巾大尺寸餐巾纸面巾纸家用卫生纸原木纸抽纸C 山茶花抽','/img/jd_benefit/cg4pcQF.png','https://u.jd.com/cg4pcQF',NULL,NULL,7,1),
('benefit_card','c14OhB8','广东徐闻香水菠萝新鲜水果生鲜热带孕妇水果整箱包邮','/img/jd_benefit/c14OhB8.png','https://u.jd.com/c14OhB8',NULL,NULL,8,1)
ON DUPLICATE KEY UPDATE
  `title`=VALUES(`title`),`image_url`=VALUES(`image_url`),`spread_url`=VALUES(`spread_url`),`price`=VALUES(`price`),`rebate_amount`=VALUES(`rebate_amount`),`sort_order`=VALUES(`sort_order`),`status`=VALUES(`status`);

INSERT INTO `pdd_benefit_goods` (`scene`,`link_key`,`goods_id`,`title`,`image_url`,`spread_url`,`price`,`coupon_price`,`rebate_amount`,`mini_path`,`sort_order`,`status`) VALUES
('benefit_card','VRM3IEUm',NULL,'重磅秋冬季300克德绒保暖圆领上衣加绒设计打底长袖拼接ins','/img/pdd_benefit/VRM3IEUm.jpeg','https://p.pinduoduo.com/VRM3IEUm?sc=EFAC',78.00,58.00,NULL,'',1,1),
('benefit_card','jKH3Fh91',NULL,'心相印抽纸餐巾纸纸巾大包面巾纸批发90抽擦手纸家用卫生纸实惠','/img/pdd_benefit/jKH3Fh91.jpeg','https://p.pinduoduo.com/jKH3Fh91?sc=EFAC',108.00,88.00,NULL,'',2,1),
('benefit_card','Vvs3caRv',NULL,'新款雪尼尔平板拖把免手洗家用吸水干湿两用大号拖布懒人拖地神器','/img/pdd_benefit/Vvs3caRv.jpeg','https://p.pinduoduo.com/Vvs3caRv?sc=EFAC',35.90,15.90,NULL,'',3,1),
('benefit_card','6tA3bfap',NULL,'Zippo秋水含睛保温杯女生高颜值咖啡杯子不锈钢便携情侣直饮水杯','/img/pdd_benefit/6tA3bfap.jpeg','https://p.pinduoduo.com/6tA3bfap?sc=EFAC',110.00,100.00,NULL,'',4,1),
('benefit_card','OF53r22C',NULL,'匹克态极维金斯天赋一代篮球鞋球鞋男鞋耐磨专业实战低帮比赛战靴','/img/pdd_benefit/OF53r22C.jpeg','https://p.pinduoduo.com/OF53r22C?sc=EFAC',150.00,148.00,NULL,'',5,1),
('benefit_card','QE73xVwd',NULL,'白象经典拌面火鸡面奶油泡面袋装白象方便面官方旗舰店整箱批发','/img/pdd_benefit/QE73xVwd.jpeg','https://p.pinduoduo.com/QE73xVwd?sc=EFAC',35.00,25.00,NULL,'',6,1),
('benefit_card','nbf3xg02',NULL,'得宝抽纸36-54包4层80抽整箱小雏菊卫生纸家用批发餐巾纸面巾纸','/img/pdd_benefit/nbf3xg02.jpeg','https://p.pinduoduo.com/nbf3xg02?sc=EFAC',117.70,69.70,NULL,'',7,1),
('benefit_card','bIn3iHWL',NULL,'MSQ/魅丝蔻10支有点蓝化妆刷套装全套刷子正品眼影腮红遮瑕鼻影刷','/img/pdd_benefit/bIn3iHWL.jpeg','https://p.pinduoduo.com/bIn3iHWL?sc=EFAC',35.00,33.00,NULL,'',8,1)
ON DUPLICATE KEY UPDATE
  `title`=VALUES(`title`),`image_url`=VALUES(`image_url`),`spread_url`=VALUES(`spread_url`),`price`=VALUES(`price`),`coupon_price`=VALUES(`coupon_price`),`rebate_amount`=VALUES(`rebate_amount`),`mini_path`=VALUES(`mini_path`),`sort_order`=VALUES(`sort_order`),`status`=VALUES(`status`);

INSERT INTO `benefit_alliance_config` (`scene`,`platform`,`hero_image_url`,`hero_title`,`hero_subtitle`,`sort_order`,`status`) VALUES
('benefit_card','jd','/img/benefit_alliance/jd-alliance.png',NULL,NULL,0,1),
('benefit_card','pdd','/img/benefit_alliance/pdd-alliance.png',NULL,NULL,0,1)
ON DUPLICATE KEY UPDATE
  `hero_image_url`=VALUES(`hero_image_url`),`hero_title`=VALUES(`hero_title`),`hero_subtitle`=VALUES(`hero_subtitle`),`sort_order`=VALUES(`sort_order`),`status`=VALUES(`status`);
