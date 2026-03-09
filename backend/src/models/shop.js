'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Shop extends Model {
        static associate(models) {
            Shop.hasMany(models.Good, { foreignKey: 'shop_id', as: 'goods' });
            Shop.hasMany(models.LiveStream, { foreignKey: 'shop_id', as: 'live_streams' });
        }
    }
    Shop.init({
        name: DataTypes.STRING,
        logo_url: DataTypes.STRING,
        description: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'open' // open, closed
        }
    }, {
        sequelize,
        modelName: 'Shop',
    });
    return Shop;
};
