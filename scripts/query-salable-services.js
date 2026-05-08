const mysql = require('../backend/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'CommunityPwd123!',
    database: process.env.DB_NAME || 'community_db'
  });

  const [rows] = await conn.query(
    `SELECT id, provider_id, title, price, status, is_published, updatedAt
     FROM service_items
     WHERE status = 'on_sale' AND is_published = 1
     ORDER BY updatedAt DESC
     LIMIT 200`
  );
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}

main().catch((err) => {
  console.error('QUERY_FAILED', err && err.message ? err.message : err);
  process.exit(1);
});
