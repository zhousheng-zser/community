require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
        });

        console.log('Successfully connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'community_db'}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        console.log(`Database '${process.env.DB_NAME || 'community_db'}' created or already exists.`);

        await connection.end();
    } catch (error) {
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('ERROR: Access denied. Please check your MySQL DB_PASSWORD in the .env file.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('ERROR: Connection refused. Is your MySQL server running on this computer?');
        } else {
            console.error('An error occurred:', error.message);
        }
        process.exit(1);
    }
}

createDatabase();
