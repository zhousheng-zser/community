require('dotenv').config({ path: '../.env' }); // 因为 sequelize-cli 默认在 src 下执行

module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'community_db',
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: false
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'community_db_test',
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql'
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'mysql'
    }
};
