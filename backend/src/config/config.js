require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // 使用绝对路径确保在任何地方执行都能加载到 .env

const dbConfig = {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'community_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
};

module.exports = {
    development: dbConfig,
    test: dbConfig,
    production: {
        ...dbConfig,
        logging: false
    }
};
