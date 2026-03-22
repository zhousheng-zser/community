/**
 * 地理工具：GCJ-02 球面距离、国内地址粗解析（地图选点回填省市区用）
 */

/** 地球半径 km */
const R_KM = 6371;

/**
 * Haversine 公式：两点球面直线距离（公里）
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_KM * c;
}

/**
 * 从 `wx.chooseLocation` 返回的 address 字符串粗解析省/市/区与剩余详细（非权威，仅作表单预填）
 * @param {string} address
 * @returns {{ province: string, city: string, district: string, detail: string }}
 */
function parseRegionFromAddress(address) {
  const out = { province: '', city: '', district: '', detail: '' };
  if (!address || typeof address !== 'string') return out;
  const s = address.trim();

  // 直辖市：北京市朝阳区… / 上海市浦东新区…
  const zxs = ['北京', '上海', '天津', '重庆'];
  for (const z of zxs) {
    if (s.startsWith(z)) {
      out.province = `${z}市`;
      out.city = `${z}市`;
      const rest = s.slice(z.length);
      const dm = rest.match(/^(.+?(?:区|县))/);
      if (dm) {
        out.district = dm[1];
        out.detail = rest.slice(dm[1].length).trim();
      } else {
        out.detail = rest.trim();
      }
      return out;
    }
  }

  // 省 + 市 + 区/县
  const m = s.match(/^(.+?(?:省|自治区))(.+?市)(.+?(?:区|县|市))(.+)?$/);
  if (m) {
    out.province = m[1];
    out.city = m[2];
    out.district = m[3];
    out.detail = (m[4] || '').trim();
    return out;
  }

  // 自治区下辖：新疆维吾尔自治区乌鲁木齐市天山区…
  const m2 = s.match(/^(.+?自治区)(.+?市)(.+?(?:区|县))(.+)?$/);
  if (m2) {
    out.province = m2[1];
    out.city = m2[2];
    out.district = m2[3];
    out.detail = (m2[4] || '').trim();
    return out;
  }

  out.detail = s;
  return out;
}

/**
 * 在带坐标的收货地址中，找与当前 GPS 最近的一条；若距离 < thresholdKm 则返回该条（备用/其它场景）
 */
function findNearestAddressWithin(userLat, userLng, addresses, thresholdKm = 1) {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;
  const candidates = [];
  for (const a of addresses) {
    const la = a.latitude != null ? Number(a.latitude) : (a.lat != null ? Number(a.lat) : NaN);
    const ln = a.longitude != null ? Number(a.longitude) : (a.lng != null ? Number(a.lng) : NaN);
    if (Number.isNaN(la) || Number.isNaN(ln)) continue;
    const km = haversineKm(userLat, userLng, la, ln);
    candidates.push({ item: a, km, la, ln });
  }
  if (!candidates.length) return null;
  candidates.sort((x, y) => {
    if (x.km !== y.km) return x.km - y.km;
    if (x.item.isDefault && !y.item.isDefault) return -1;
    if (!x.item.isDefault && y.item.isDefault) return 1;
    return 0;
  });
  const best = candidates[0];
  if (best.km >= thresholdKm) return null;
  const it = best.item;
  const label =
    [it.district, it.tag].filter(Boolean).join('·') ||
    (it.city || '') + (it.district ? '·' + it.district : '') ||
    '收货地址';
  const shortLabel = label.length > 10 ? label.slice(0, 10) + '…' : label;
  return {
    id: it.id,
    lat: best.la,
    lng: best.ln,
    dKm: best.km,
    label: shortLabel
  };
}

/** 优先带 is_default 的项；否则仅一条地址时视为唯一收货点（兼容旧数据） */
function pickDefaultOrSingleAddress(addresses) {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;
  const marked = addresses.find((a) => a.isDefault || a.is_default);
  if (marked) return marked;
  return addresses.length === 1 ? addresses[0] : null;
}

/**
 * 取默认收货地址的经纬度（无距离判断）。用于 GPS 失败时回退。
 * @returns {{ lat: number, lng: number, label: string, id?: any } | null}
 */
function getDefaultAddressCoords(addresses) {
  const def = pickDefaultOrSingleAddress(addresses);
  if (!def) return null;
  const la = def.latitude != null ? Number(def.latitude) : (def.lat != null ? Number(def.lat) : NaN);
  const ln = def.longitude != null ? Number(def.longitude) : (def.lng != null ? Number(def.lng) : NaN);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  let label =
    [def.district, def.tag].filter(Boolean).join('·') ||
    [def.city, def.district].filter(Boolean).join('') ||
    '默认地址';
  if (label.length > 10) label = label.slice(0, 10) + '…';
  return { lat: la, lng: ln, label, id: def.id };
}

function findDefaultAddressWithin(userLat, userLng, addresses, thresholdKm = 1) {
  const def = pickDefaultOrSingleAddress(addresses);
  if (!def) return null;
  const la = def.latitude != null ? Number(def.latitude) : (def.lat != null ? Number(def.lat) : NaN);
  const ln = def.longitude != null ? Number(def.longitude) : (def.lng != null ? Number(def.lng) : NaN);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  const km = haversineKm(userLat, userLng, la, ln);
  if (km >= thresholdKm) return null;
  const it = def;
  const label =
    [it.district, it.tag].filter(Boolean).join('·') ||
    (it.city || '') + (it.district ? '·' + it.district : '') ||
    '默认地址';
  const shortLabel = label.length > 10 ? label.slice(0, 10) + '…' : label;
  return {
    id: it.id,
    lat: la,
    lng: ln,
    dKm: km,
    label: shortLabel
  };
}

module.exports = {
  haversineKm,
  parseRegionFromAddress,
  findNearestAddressWithin,
  findDefaultAddressWithin,
  getDefaultAddressCoords
};
