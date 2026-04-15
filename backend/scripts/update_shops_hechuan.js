/**
 * 一次性：将所有 market_shops 的经纬度与地址文案更新为「上海市闵行区合川路地铁站」附近（GCJ-02 约值，仅联调）。
 * 用法：node scripts/update_shops_hechuan.js
 */
require('dotenv').config();
const { sequelize, MarketShop } = require('../src/models');

/** 合川路地铁站（9号线）附近参考点，GCJ-02 */
const BASE_LAT = 31.1694;
const BASE_LNG = 121.3783;

function offsetForIndex(i) {
  const dLat = ((i % 5) - 2) * 0.0012;
  const dLng = (Math.floor(i / 5) % 5 - 2) * 0.0012;
  return { lat: BASE_LAT + dLat, lng: BASE_LNG + dLng };
}

async function main() {
  await sequelize.authenticate();
  const shops = await MarketShop.findAll({ order: [['id', 'ASC']] });
  for (let i = 0; i < shops.length; i++) {
    const { lat, lng } = offsetForIndex(i);
    await shops[i].update({
      latitude: lat,
      longitude: lng,
      address: `上海市闵行区合川路地铁站附近（联调示例 ${i + 1}）`
    });
  }
  console.log(`✅ 已更新 ${shops.length} 家店铺坐标与地址（合川路地铁站附近）`);
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
