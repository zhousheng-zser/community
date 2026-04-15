'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class LiveStream extends Model {
        static associate(models) {
            LiveStream.belongsTo(models.Shop, { foreignKey: 'shop_id', as: 'shop' });
        }
    }
    LiveStream.init({
        shop_id: DataTypes.INTEGER,
        title: DataTypes.STRING,
        cover_url: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'live' // live, closed
        },
        viewers_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        max_rebate: DataTypes.DECIMAL(10, 2)
    }, {
        sequelize,
        modelName: 'LiveStream',
    });
    return LiveStream;
};
