/**
 * 服务下单页：从 user/addresses 或本地缓存取默认地址，预填 order-confrim
 */

function pickDefaultAddressRecord(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const def = list.find(
    (a) =>
      a.isDefault === true ||
      a.isDefault === 1 ||
      a.is_default === true ||
      a.is_default === 1
  );
  return def || list[0];
}

/**
 * @param {object} item 地址行（API 或本地缓存）
 * @returns {{ serviceAddr: string, doorNum: string, contactName: string, contactPhone: string, contactGender: string }}
 */
function mapAddressToOrderConfirm(item) {
  if (!item || typeof item !== 'object') return null;
  const province = item.province || '';
  const city = item.city || '';
  const district = item.district || '';
  const regionLine = [province, city, district].filter(Boolean).join('');
  const raw = item._rawAddress != null ? String(item._rawAddress).trim() : '';
  const detail = item.detail != null ? String(item.detail).trim() : '';
  let serviceAddr = raw || regionLine;
  let doorNum = detail;
  if (!serviceAddr && detail) {
    serviceAddr = detail;
    doorNum = '';
  }
  const phoneRaw = item.phone || item.user_mobile || item.userMobile || item.tel || '';
  const phone = String(phoneRaw).replace(/\D/g, '').slice(0, 11);
  const name = item.name != null ? String(item.name).trim() : '';
  const gender = item.gender === '女士' ? '女士' : '先生';
  return {
    serviceAddr,
    doorNum,
    contactName: name,
    contactPhone: phone,
    contactGender: gender
  };
}

/**
 * @param {typeof import('./util.js')} util
 * @returns {Promise<object|null>}
 */
async function fetchDefaultOrderAddressFill(util) {
  const unwrapList = util.unwrapList;
  let list = [];
  try {
    const res = await util.get('user/addresses');
    list = unwrapList(res);
  } catch (e) {
    list = [];
  }
  if (!list.length) {
    try {
      list = wx.getStorageSync('address_list') || [];
    } catch (e2) {
      list = [];
    }
  }
  const row = pickDefaultAddressRecord(list);
  if (!row) return null;
  return mapAddressToOrderConfirm(row);
}

module.exports = {
  pickDefaultAddressRecord,
  mapAddressToOrderConfirm,
  fetchDefaultOrderAddressFill
};
