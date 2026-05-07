'use strict';

module.exports = (sequelize, DataTypes) => {
  const MerchantGoods = sequelize.define('MerchantGoods', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    shop_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '所属店铺ID'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '创建者用户ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '商品名称'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '商品标题（与name保持一致）'
    },
    main_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '商品主图'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '售价'
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '原价'
    },
    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '库存数量'
    },
    safe_stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      comment: '安全库存阈值'
    },
    sales_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '销量统计'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '商品描述'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'off_sale',
      comment: '状态: on_sale(在售)/off_sale(下架)'
    },
    is_published: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否上架: 0=否, 1=是'
    },
    sort_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    }
  }, {
    tableName: 'merchant_goods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['shop_id', 'status'] }
    ]
  });

  return MerchantGoods;
};
