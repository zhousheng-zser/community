/**
 * 历史数据：为每个 user_id 执行默认地址规则（仅一条必为默认；多条无默认则补一条；多条多默认则保留 id 最小）。
 * 用法：在 backend 目录下执行 `node scripts/backfill_address_default.js`
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize, Sequelize } = require('../src/models');
const { ensureUserAddressDefaultInternal } = require('../src/controllers/userController');

async function main() {
  const rows = await sequelize.query('SELECT DISTINCT user_id FROM user_addresses', {
    type: Sequelize.QueryTypes.SELECT
  });
  let n = 0;
  for (const r of rows) {
    const uid = r.user_id;
    if (uid == null) continue;
    await ensureUserAddressDefaultInternal(uid);
    n += 1;
  }
  console.log(`✅ 已处理 ${n} 个用户的默认地址回填`);
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
