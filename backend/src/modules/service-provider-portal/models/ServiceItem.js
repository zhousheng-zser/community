'use strict';

module.exports = (sequelize, DataTypes) => {
  const ServiceItem = sequelize.define('ServiceItem', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    provider_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '所属服务商profile_id'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '创建者用户ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '服务标题'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '服务名称(兼容)'
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图'
    },
    main_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '主图(兼容)'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '价格'
    },
    price_unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '次',
      comment: '计价单位'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '次',
      comment: '单位(兼容)'
    },
    category_key: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类标识'
    },
    service_category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '服务分类(兼容)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '服务描述'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'off_sale',
      comment: '状态: on_sale/off_sale'
    },
    is_published: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '是否上架 0/1'
    },
    sales_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '销量'
    },
    order_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '订单数(兼容)'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    }
  }, {
    tableName: 'service_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['provider_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] }
    ]
  });

  return ServiceItem;
};
