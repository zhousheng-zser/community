/**
 * 诊断脚本：直接查询数据库验证 benefit_alliance_goods 价格字段
 */
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'ancientscrolllibrary.cn',
    user: 'root',
    password: 'CommunityPwd123!',
    database: 'community_db',
  });

  console.log('\n🔍 查询 benefit_alliance_goods 价格数据...\n');

  const [rows] = await connection.execute(
    `SELECT id, platform, sort_order, title,
            price, coupon_price, rebate_amount, image_url, status
     FROM benefit_alliance_goods
     WHERE scene = 'benefit_card'
       AND platform IN ('meituan', 'taobao', 'shangou', 'shequn', 'tuixiao')
     ORDER BY platform, sort_order`
  );

  if (rows.length === 0) {
    console.log('⚠️  没有找到任何记录！请先执行 seed SQL。\n');
    await connection.end();
    return;
  }

  let hasEmptyPrice = false;
  const platforms = {};

  rows.forEach((r) => {
    const p = r.platform;
    if (!platforms[p]) platforms[p] = [];
    platforms[p].push(r);

    const priceEmpty = r.price === null || r.price === '';
    const couponEmpty = r.coupon_price === null || r.coupon_price === '';
    const rebateEmpty = r.rebate_amount === null || r.rebate_amount === '';

    if (priceEmpty && couponEmpty && rebateEmpty) {
      hasEmptyPrice = true;
    }
  });

  // 按平台分组输出
  Object.keys(platforms).forEach((p) => {
    console.log(`\n【${p}】`);
    platforms[p].forEach((r) => {
      const price = r.price !== null ? `¥${r.price}` : 'NULL';
      const coupon = r.coupon_price !== null ? `¥${r.coupon_price}` : 'NULL';
      const rebate = r.rebate_amount !== null ? `返¥${r.rebate_amount}` : 'NULL';
      const img = r.image_url ? '✅有图' : '❌无图';
      console.log(`  #${r.id} [${r.sort_order}] ${r.title}`);
      console.log(`      原价:${price} | 券后:${coupon} | 返利:${rebate} | ${img}`);
    });
  });

  console.log('\n' + '='.repeat(60));
  if (hasEmptyPrice) {
    console.log('❌ 发现 price/coupon_price/rebate_amount 均为空的记录');
    console.log('   请执行: mysql -u root -p\'CommunityPwd123!\' community_db < backend/sql/0428_update_benefit_prices.sql');
  } else {
    console.log('✅ 所有记录价格字段均已填写');
  }
  console.log('='.repeat(60) + '\n');

  await connection.end();
}

main().catch((err) => {
  console.error('连接失败:', err.message);
  console.log('\n请确认:');
  console.log('  1. MySQL 服务器 ancientscrolllibrary.cn:3306 可访问');
  console.log('  2. 密码正确');
  console.log('  3. 数据库 community_db 存在\n');
  process.exit(1);
});
