#!/usr/bin/env node
/**
 * 将测试账号 user_id 绑定到一条集市店铺 + 一条服务商档案，便于工作台登录后操作真实数据。
 * 仅用于开发/联调，生产勿随意执行。
 *
 * 用法（在仓库根目录）:
 *   node backend/scripts/portal-bind-test.js <userId> [--shop-id N] [--provider-id M]
 * 示例:
 *   node backend/scripts/portal-bind-test.js 10001
 *   node backend/scripts/portal-bind-test.js 10001 --shop-id 3 --provider-id 2
 *
 * 登录方式:
 *   - 设置 PORTAL_TEST_BYPASS=1 后，工作台登录页可填 user_id 免密；
 *   - 或确保 users 表存在该手机号的账号及密码。
 */
'use strict';

const path = require('path');
const backendRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });
const db = require(path.join(backendRoot, 'src', 'models'));

async function main() {
  const args = process.argv.slice(2);
  let userId = null;
  let shopId = null;
  let providerId = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--shop-id' && args[i + 1]) shopId = Number(args[++i]);
    else if (args[i] === '--provider-id' && args[i + 1]) providerId = Number(args[++i]);
    else if (!String(args[i]).startsWith('-') && userId == null) userId = Number(args[i]);
  }

  if (!userId || Number.isNaN(userId)) {
    console.error('用法: node backend/scripts/portal-bind-test.js <userId> [--shop-id N] [--provider-id M]');
    process.exit(1);
  }

  const { MerchantShop, ServiceProviderProfile } = db;
  if (!MerchantShop || !ServiceProviderProfile) {
    console.error('MerchantShop / ServiceProviderProfile 模型未加载');
    process.exit(1);
  }

  const shop = shopId
    ? await MerchantShop.findByPk(shopId)
    : await MerchantShop.findOne({ order: [['id', 'ASC']] });

  if (!shop) {
    console.error('未找到集市店铺（可先小程序商家入驻或往 merchant_shops 插入数据）');
  } else {
    const prev = shop.user_id;
    await shop.update({ user_id: userId });
    console.log(`[集市] shop id=${shop.id} name="${shop.name}" user_id: ${prev} -> ${userId}`);
  }

  const sp = providerId
    ? await ServiceProviderProfile.findByPk(providerId)
    : await ServiceProviderProfile.findOne({ order: [['id', 'ASC']] });

  if (!sp) {
    console.error('未找到服务商档案（可先小程序服务商入驻或往 service_provider_profiles 插入数据）');
  } else {
    const prev = sp.user_id;
    await sp.update({ user_id: userId });
    console.log(`[服务商] profile id=${sp.id} shop_name="${sp.shop_name}" user_id: ${prev} -> ${userId}`);
  }

  console.log('\n完成后请用该 user_id 登录 market-portal / service-portal（配合 PORTAL_TEST_BYPASS=1 可免密）。');
  await db.sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
