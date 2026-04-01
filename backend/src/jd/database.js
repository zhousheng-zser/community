require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'community',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOG_SQL === '1' ? console.log : false,
    define: {
      underscored: false,
      freezeTableName: false
    },
    timezone: '+08:00'
  }
);

module.exports = { sequelize, Sequelize };
