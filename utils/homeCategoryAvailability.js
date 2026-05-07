/**
 * 首页「九大服务类目」与本小区热卖/服务数据的可用性推导。
 * rawRows：core/community/hot 或 core/services/hot 等返回的单条服务对象数组。
 */

const VALID_GROUP_KEYS = new Set([
  'tidy',
  'urgent_fix',
  'appliance_clean',
  'pioneer_clean',
  'mite_remove',
  'furniture_care',
  'baby_home',
  'house_repair',
  'beauty_home'
]);

// 与 pages/tidy-service/tidy-service.js 内各专区「类目」文案一致（用于接口返回 category）
const CATEGORY_LABEL_TO_GROUP = {
  衣橱收纳: 'tidy',
  厨房收纳: 'tidy',
  搬家整理: 'tidy',
  全屋收纳: 'tidy',
  净水器维修: 'urgent_fix',
  灯具维修: 'urgent_fix',
  柜子维修: 'urgent_fix',
  管道疏通: 'urgent_fix',
  手机维修: 'urgent_fix',
  电路维修: 'urgent_fix',
  水路维修: 'urgent_fix',
  马桶维修: 'urgent_fix',
  厨房烟道串味: 'urgent_fix',
  零星打胶家修杂事: 'urgent_fix',
  漏水检测: 'appliance_clean',
  瓷砖空鼓: 'appliance_clean',
  地暖检测: 'appliance_clean',
  地暖清洗: 'appliance_clean',
  灯具清洗: 'appliance_clean',
  空调清洗: 'appliance_clean',
  油烟机清洗: 'appliance_clean',
  洗衣机清洗: 'appliance_clean',
  冰箱清洗: 'appliance_clean',
  热水器清洗: 'appliance_clean',
  开荒保洁: 'pioneer_clean',
  全床除螨: 'mite_remove',
  居室除螨: 'mite_remove',
  地板翻新: 'furniture_care',
  地暖清洁: 'furniture_care',
  床垫清洗: 'furniture_care',
  沙发清洗: 'furniture_care',
  窗帘清洁: 'furniture_care',
  地毯清洗: 'furniture_care',
  地板打蜡: 'furniture_care',
  大理石抛光: 'furniture_care',
  孩子接送: 'baby_home',
  陪读辅导: 'baby_home',
  起居照顾: 'baby_home',
  育儿嫂: 'baby_home',
  岩板修复: 'house_repair',
  瓷砖修复: 'house_repair',
  瓷砖铺贴: 'house_repair',
  壁纸铺贴: 'house_repair',
  漏水防水: 'house_repair',
  地板铺贴: 'house_repair',
  墙面刷新: 'house_repair',
  墙面修补: 'house_repair',
  上门纹绣: 'beauty_home',
  上门美容: 'beauty_home',
  化妆造型: 'beauty_home',
  上门美甲: 'beauty_home',
  上门美瞳: 'beauty_home',
  上门美发: 'beauty_home'
};

function isServiceLikelyOnShelf(row) {
  if (!row || typeof row !== 'object') return false;
  const status = String(row.status || '').trim();
  if (status === 'off_sale') return false;
  if (row.on_shelf === false) return false;
  if (row.is_published === 0 || row.is_published === false) return false;
  return true;
}

function inferGroupKeyFromTitle(title) {
  const t = String(title || '').trim();
  if (!t) return null;
  if (/美甲|美发|美容|化妆|纹绣|美瞳/.test(t)) return 'beauty_home';
  if (/开荒/.test(t)) return 'pioneer_clean';
  if (/除螨/.test(t)) return 'mite_remove';
  if (/接送小孩|接送|陪读辅导|课后陪读|育儿嫂|起居照顾|儿童起居|宝宝|小孩|儿童/.test(t)) return 'baby_home';
  if (/厨卫漏水防水|漏水防水|防水修缮|岩板破损|瓷砖裂纹|铺贴|壁纸铺贴|墙纸|墙面刷新|墙面修补|地板铺贴/.test(t)) return 'house_repair';
  if (/收纳|整理/.test(t)) return 'tidy';
  if (/灯具.*清洗|清洗.*灯具|灯具深度/.test(t)) return 'appliance_clean';
  if (/全屋漏水点|漏水点检测|瓷砖空鼓|地暖回路|地暖管路清洗|地暖.*清洗|深度清洗【|拆洗/.test(t)) return 'appliance_clean';
  if (/沙发清洗|布艺|皮质沙发|窗帘清洁|地毯|打蜡|大理石抛光|床垫|木地板翻新/.test(t)) return 'furniture_care';
  if (/维修|疏通|打胶|烟道|净水器|柜门铰链|手机维修|电路|水路|马桶|灯具线路|灯具与灯体/.test(t)) return 'urgent_fix';
  return null;
}

function inferGroupKeyFromHotRow(row) {
  const raw = row.group_key != null ? row.group_key : row.groupKey;
  if (raw != null) {
    const gk = String(raw).trim();
    if (VALID_GROUP_KEYS.has(gk)) return gk;
  }
  const cat = row.category || row.service_category || row.cat || '';
  if (typeof cat === 'string' && cat.trim() && CATEGORY_LABEL_TO_GROUP[cat.trim()]) {
    return CATEGORY_LABEL_TO_GROUP[cat.trim()];
  }
  const title = row.title || row.name || row.goods_name || '';
  return inferGroupKeyFromTitle(title);
}

function collectAvailableGroupKeys(rawRows) {
  const s = new Set();
  if (!Array.isArray(rawRows)) return s;
  rawRows.forEach((row) => {
    if (!isServiceLikelyOnShelf(row)) return;
    const gk = inferGroupKeyFromHotRow(row);
    if (gk && VALID_GROUP_KEYS.has(gk)) s.add(gk);
  });
  return s;
}

/**
 * 仅当热卖原始数据非空且至少能推导出一个类目时，才给未命中的九宫格打上「不可提供」。
 */
function applyHomeCategoryAvailability(categoryList, rawRows) {
  if (!Array.isArray(categoryList) || !categoryList.length) return categoryList;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return categoryList.map((x) => ({ ...x, unsupported: false, saleStatusText: '' }));
  }
  const available = collectAvailableGroupKeys(rawRows);
  if (available.size === 0) {
    return categoryList.map((x) => ({ ...x, unsupported: false, saleStatusText: '' }));
  }
  return categoryList.map((x) => {
    const gk = x.groupKey || x.group_key;
    if (!gk || !VALID_GROUP_KEYS.has(String(gk).trim())) {
      return { ...x, unsupported: false, saleStatusText: '' };
    }
    const key = String(gk).trim();
    const unsupported = !available.has(key);
    return { ...x, unsupported, saleStatusText: unsupported ? '不可提供' : '' };
  });
}

module.exports = {
  VALID_GROUP_KEYS,
  applyHomeCategoryAvailability,
  collectAvailableGroupKeys
};
