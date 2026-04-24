'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Feed extends Model {
        static associate(models) {
            Feed.belongsTo(models.User, { foreignKey: 'author_id', as: 'author' });
        }
    }
    Feed.init({
        title: DataTypes.STRING,
        author_id: DataTypes.INTEGER,
        likes_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        media_type: DataTypes.STRING, // 'video', 'image'
        media_url: DataTypes.STRING,
        related_goods_id: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'Feed',
    });
    return Feed;
};
