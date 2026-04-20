-- 内层首页 Banner 示例（表名/字段以主站 Sequelize 模型为准，执行前请核对）
-- 对应 JSON：banners_home_inner.json
-- 小程序展示字段映射：image_url → imgUrl() → index: banner[].imageUrl

-- INSERT INTO Banners (image_url, sort_order, target_url, createdAt, updatedAt) VALUES
-- ('https://你的CDN或/uploads/.../banner1.jpg', 1, '', NOW(), NOW()),
-- ('https://你的CDN或/uploads/.../banner2.jpg', 2, '', NOW(), NOW());
