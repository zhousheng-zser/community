'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Good extends Model {
        static associate(models) {
            Good.hasMany(models.Order, { foreignKey: 'goods_id', as: 'orders' });
        }
    }
    Good.init({
        title: DataTypes.STRING,
        price: DataTypes.DECIMAL(10, 2),
        commission: DataTypes.DECIMAL(10, 2),
        cover_image: DataTypes.STRING,
        detail_images: DataTypes.JSON,
        stock: DataTypes.INTEGER,
        tab_category: DataTypes.STRING,
        is_featured: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
        featured_sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        unit: DataTypes.STRING(20)
    }, {
        sequelize,
        modelName: 'Good',
    });
    return Good;
};
