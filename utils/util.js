const config = require('./config.js');
const images = require('./images.js');

let _uploadsSubdirSet = null;
function uploadsSubdirSet() {
  if (!_uploadsSubdirSet) {
    _uploadsSubdirSet = new Set(config.uploadsImageSubdirs || []);
  }
  return _uploadsSubdirSet;
}

/**
 * 数据库常见存法：`uploads/...` 或 `market/xxx.jpg` 无前导斜杠，先规范为以 `/` 开头再拼 imageBaseUrl。
 */
const normalizeServerImagePath = (path) => {
  if (path == null || path === '') return '';
  const raw = String(path).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw.replace(/^\/+/, '')}`;
};

/**
 * 将路径转成完整服务器图片 URL
 * - 已是 http 开头 → 原样返回
 * - 本地占位图路径 → 映射到服务器已上传文件（images.resolve）
 * - /img/<uploads 子目录>/... → imageBaseUrl + /uploads/...（段 encodeURIComponent，与后端静态目录一致）
 * - 其余 /img/... → 保留为小程序包内路径
 * - 其他以 / 开头的路径 → 拼接 imageBaseUrl（如接口返回 /uploads/...）
 */
const imgUrl = (path, fallback) => {
  if (path == null || path === '') return fallback != null ? imgUrl(fallback) : images.homeCleaning;
  const raw = String(path).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  let normalized = normalizeServerImagePath(raw);
  const resolved = images.resolve(normalized);
  if (resolved !== normalized) return resolved;

  const base = config.imageBaseUrl.replace(/\/$/, '');
  if (normalized.startsWith('/img/')) {
    const segments = normalized.split('/').filter(Boolean);
    if (segments[0] === 'img' && segments.length >= 2 && uploadsSubdirSet().has(segments[1])) {
      const rest = segments.slice(1);
      const encoded = rest.map(encodeURIComponent).join('/');
      return `${base}/uploads/${encoded}`;
    }
    return normalized;
  }
  return base + (normalized.startsWith('/') ? normalized : '/' + normalized);
};

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const buildUrl = (url) => {
  let finalUrl = config.baseUrl;
  if (!finalUrl.endsWith('/') && !url.startsWith('/')) {
    finalUrl += '/';
  } else if (finalUrl.endsWith('/') && url.startsWith('/')) {
    finalUrl = finalUrl.slice(0, -1);
  }
  return finalUrl + url;
};

const request = (method, url, data, contentType = 'application/json') => {
  const finalUrl = buildUrl(url);

  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: finalUrl,
      method,
      data,
      header: {
        'content-type': contentType,
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        const body = res.data;
        if (res.statusCode === 401) {
          try {
            wx.removeStorageSync('token');
          } catch (e) { }
          reject({
            errno: 401,
            errmsg: (body && body.errmsg) || '请先登录'
          });
          return;
        }
        // 兼容两种响应格式：errno（旧）和 code（新后端文档标准）
        const hasErrno = body != null && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'errno');
        const hasCode = body != null && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code');
        const errnoNum = hasErrno ? Number(body.errno) : NaN;
        const codeNum = hasCode ? Number(body.code) : NaN;
        
        // 优先检查 code 字段（新后端标准）
        if (hasCode && codeNum !== 0) {
          reject({
            errno: body.code,
            errmsg: body.message || body.errmsg || body.error || '请求失败'
          });
          return;
        }
        // 兼容 errno 字段（旧格式）
        if (hasErrno && errnoNum !== 0) {
          reject({
            errno: body.errno,
            errmsg: body.errmsg || body.message || body.error || '请求失败'
          });
          return;
        }
        const ok =
          (hasCode && codeNum === 0) ||
          (hasErrno && errnoNum === 0) ||
          (!hasCode && !hasErrno && (res.statusCode === 200 || res.statusCode === 201));
        if (!ok) {
          reject({
            errno: res.statusCode,
            errmsg: (body && body.errmsg) || '请求失败'
          });
          return;
        }
        resolve(body.data !== undefined ? body.data : body);
      },
      fail: (res) => {
        const errorMsg = res.errMsg || '网络连接失败';
        wx.showToast({
          title: errorMsg.includes('timeout') ? '请求超时，请检查网络' : errorMsg.includes('fail to load') ? '无法连接到服务器' : '网络错误',
          icon: 'none'
        });
        reject(res);
      }
    })
  })
}
const get = (url, query) => {
  const contentType = query ? "application/x-www-form-urlencoded" : "application/json";
  const data = query || {};
  return request('GET', url, data, contentType);
}
const post = (url, data) => {
  return request('POST', url, data);
}
const put = (url, data) => {
  return request('PUT', url, data);
}
const patch = (url, data) => {
  return request('PATCH', url, data);
}
const del = (url, query) => {
  const contentType = query ? "application/x-www-form-urlencoded" : "application/json";
  const data = query || {};
  return request('DELETE', url, data, contentType);
}
const uploadFile = (url, filePath, name = 'file', formData = {}) => {
  // 智能拼接 URL
  const finalUrl = buildUrl(url);

  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: finalUrl,
      filePath: filePath,
      name: name,
      formData: formData,
      header: {
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (res.statusCode === 401) {
          try {
            wx.removeStorageSync('token');
          } catch (e) { }
          reject({ errno: 401, errmsg: (data && data.errmsg) || '请先登录' });
          return;
        }
        const hasErrno = data != null && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'errno');
        if (hasErrno && Number(data.errno) !== 0) {
          reject({ errno: data.errno, errmsg: data.errmsg || '上传失败' });
          return;
        }
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(data.data !== undefined ? data.data : data)
        } else {
          reject(data)
        }
      },
      fail: (res) => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(res)
      }
    })
  })
}
const booksStateTabel = (state) => {
  var result = [];
  switch (state) {
    case "0":
      result = {
        name: "已预约",
        icon: "/img/order/orderdetail-1.png",
        title: "已预约",
        desc: "",
        btn: ""
      }
      break;
    case "1":
      result = {
        name: "已完成",
        icon: "/img/order/orderdetail-1.png",
        title: "已完成",
        desc: "",
        btn: ""
      }
      break;
    case "2":
      result = {
        name: "施工中",
        icon: "/img/order/orderdetail-1.png",
        title: "施工中",
        desc: "",
        btn: "施工结束"
      }
      break;
    default:
      result = {
        name: "已预约",
        icon: "/img/order/orderdetail-1.png",
        title: "已预约",
        desc: "",
        btn: ""
      }
  }
  return result;
}
const goodsStateTabel = (state) => {
  var result = {};
  switch (state) {
    case "pending_payment":
      result = {
        name: "待付款",
        icon: "/img/order/orderdetail-1.png",
        title: "待付款",
        desc: "待付款",
        btn: "去支付"
      }
      break;
    case "pending_accept":
      result = {
        name: "待接单",
        icon: "/img/order/orderdetail-1.png",
        title: "买家已付款",
        desc: "等待商家接单",
        btn: ""
      }
      break;
    case "pending_service":
      result = {
        name: "备货中",
        icon: "/img/order/orderdetail-1.png",
        title: "商家已接单",
        desc: "商家备货/出餐中",
        btn: ""
      }
      break;
    case "pending_shipment":
      result = {
        name: "待发货",
        icon: "/img/order/orderdetail-1.png",
        title: "待发货",
        desc: "商家正在为您发货",
        btn: ""
      }
      break;
    case "pending_receipt":
      result = {
        name: "待收货",
        icon: "/img/order/orderdetail-1.png",
        title: "已发货",
        desc: "配送中，等待确认收货",
        btn: "确认收货"
      }
      break;
    case "completed":
      result = {
        name: "已完成",
        icon: "/img/order/orderdetail-1.png",
        title: "订单完成",
        desc: "您可对本次服务进行评价",
        btn: "评价"
      }
      break;
    case "cancelled":
      result = {
        name: "已取消",
        icon: "/img/order/orderdetail-2.png",
        title: "订单关闭",
        desc: "订单已取消",
        btn: ""
      }
      break;
    case "refunded":
      result = {
        name: "已退款",
        icon: "/img/order/orderdetail-2.png",
        title: "订单关闭",
        desc: "订单已退款",
        btn: ""
      }
      break;
    default:
      result = {
        name: "未知状态",
        icon: "/img/order/orderdetail-2.png",
        title: "未知状态",
        desc: "",
        btn: ""
      }
  }
  return result;
}
const stateTabel = (state, userFlag) => {
  var result = [];
  if (userFlag == 0) {//客户
    switch (state) {
      case "1":
        result = {
          name: "已预约",
          icon: "/img/order/orderdetail-1.png",
          title: "预约成功",
          desc: "正在为您分配服务人员",
          btn: "取消订单"
        }
        break;
      case "2":
        result = {
          name: "已分配",
          icon: "/img/order/orderdetail-1.png",
          title: "分配成功",
          desc: "请等待服务人员与您联系",
          btn: ""
        }
        break;
      case "3":
        result = {
          name: "待付款",
          icon: "/img/order/orderdetail-1.png",
          title: "待付款",
          desc: "本次服务已完成，请支付",
          btn: "去支付"
        }
        break;
      case "4":
        result = {
          name: "已付款",
          icon: "/img/order/orderdetail-1.png",
          title: "订单完成",
          desc: "您可对本次服务进行评价",
          btn: "评价"
        }
        break;
      case "5":
        result = {
          name: "已完成",
          icon: "/img/order/orderdetail-1.png",
          title: "订单完成",
          desc: "您可对本次服务进行评价",
          btn: "评价"
        }
        break;
      case "6":
        result = {
          name: "已取消",
          icon: "/img/order/orderdetail-2.png",
          title: "订单关闭",
          desc: "",
          btn: ""
        }
        break;
      default:
        result = {
          name: "已预约",
          icon: "/img/order/orderdetail-1.png",
          title: "预约成功",
          desc: "正在为您分配服务人员",
          btn: "取消订单"
        }
    }
  } else {
    switch (state) {
      case "1":
        result = {
          name: "待分配",
          icon: "/img/order/orderdetail-1.png",
          title: "等待分配",
          desc: "正在分配服务人员",
          btn: ""
        }
        break;
      case "2":
        result = {
          name: "待完成",
          icon: "/img/order/orderdetail-1.png",
          title: "正在施工",
          desc: "请尽快与客户联系并完成本次服务",
          btn: "施工结束"
        }
        break;
      case "3":
        result = {
          name: "施工结束",
          icon: "/img/order/orderdetail-1.png",
          title: "施工完成，客户未付款",
          desc: "本次服务已完成，等待客户付款",
          btn: ""
        }
        break;
      case "4":
        result = {
          name: "订单完成",
          icon: "/img/order/orderdetail-1.png",
          title: "施工完成，客户已付款",
          desc: "本次服务已完成",
          btn: ""
        }
        break;
      case "5":
        result = {
          name: "订单完成",
          icon: "/img/order/orderdetail-1.png",
          title: "施工完成，客户已付款",
          desc: "本次服务已完成",
          btn: ""
        }
        break;
      case "6":
        result = {
          name: "已取消",
          icon: "/img/order/orderdetail-2.png",
          title: "订单关闭",
          desc: "",
          btn: ""
        }
        break;
      default:
        result = {
          name: "待分配",
          icon: "/img/order/orderdetail-1.png",
          title: "等待分配",
          desc: "正在分配服务人员",
          btn: ""
        }
    }
  }
  return result;
}

/**
 * 合并接口里可能出现的嵌套店铺对象（如 data.shop / store），避免列表与详情字段层级不一致。
 */
const flattenMarketShopPayload = (item) => {
  if (!item || typeof item !== 'object') return {};
  const shop = item.shop && typeof item.shop === 'object' ? item.shop : {};
  const store = item.store && typeof item.store === 'object' ? item.store : {};
  return Object.assign({}, store, shop, item);
};

const firstNonEmptyString = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return '';
  for (let i = 0; i < keys.length; i++) {
    const v = obj[keys[i]];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

/**
 * 本地集市：列表缩略图与详情页「店铺 Logo」共用同一套字段优先级，
 * 避免封面(cover)与 Logo 混用导致首页卡片与详情头图不一致。
 * 顺序：logo 类 → 封面/列表图类；兼容 camelCase 与常见别名。
 * 注意：若列表接口完全不返回 logo 类字段，仍会回退到 cover，与详情不一致——需接口补全 logo。
 */
const pickMarketShopAvatarPath = (item) => {
  const src = flattenMarketShopPayload(item);
  const logoKeys = [
    'logo_url', 'logoUrl', 'shop_logo_url', 'shopLogoUrl',
    'logo', 'avatar', 'avatar_url', 'avatarUrl',
    'brand_logo', 'brandLogo', 'headimg', 'head_img', 'headImg'
  ];
  const coverKeys = [
    'cover_url', 'coverUrl', 'cover', 'cover_image', 'coverImage',
    'list_cover_url', 'listCoverUrl',
    'thumb', 'thumbnail', 'thumbnail_url', 'thumbnailUrl',
    'shop_image', 'shopImage'
  ];
  return firstNonEmptyString(src, logoKeys) || firstNonEmptyString(src, coverKeys) || '';
};

const toNumberOrNull = (val) => {
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
};

/**
 * 从商品对象取主图原始路径（不拼域名），兼容多种后端字段与嵌套 product/goods。
 */
const pickShopProductCoverRaw = (item) => {
  if (!item || typeof item !== 'object') return '';
  const keys = [
    'main_image', 'mainPicture', 'main_picture', 'cover_image', 'coverImage',
    'image', 'thumb_url', 'thumbUrl', 'goods_image', 'goodsImage', 'pic_url', 'picUrl',
    'goods_image_url', 'cover', 'snapshot_image', 'snapshotImage'
  ];
  for (let i = 0; i < keys.length; i++) {
    const v = item[keys[i]];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  const nested = item.product || item.goods;
  if (nested && typeof nested === 'object') {
    for (let i = 0; i < keys.length; i++) {
      const v = nested[keys[i]];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return '';
};

const extractDistanceKmFromProduct = (item) => {
  if (!item || typeof item !== 'object') return null;
  const possible = [
    item.distance_km,
    item.shop_distance_km,
    item.distanceKm,
    item.distance,
    item.shop && item.shop.distance_km
  ];
  for (let i = 0; i < possible.length; i++) {
    const n = toNumberOrNull(possible[i]);
    if (n != null) return n;
  }
  return null;
};

const filterShopProductsByDistance = (list, maxKm = 5) => {
  if (!Array.isArray(list)) return [];
  return list.filter((g) => {
    const km = extractDistanceKmFromProduct(g);
    if (km == null) return true;
    return km <= maxKm;
  });
};

/**
 * 列表/频道页统一商品行（含 shareTag 供频道瀑布流使用）
 */
const normalizeShopProductRow = (item, idx = 0) => {
  const id = item.id || item.goods_id || idx;
  const name = item.name || item.title || item.goods_name || '商品';
  const raw = pickShopProductCoverRaw(item);
  const image = raw ? imgUrl(raw) : '';
  const priceRaw = item.pay_price != null ? item.pay_price : (item.price != null ? item.price : item.goods_price);
  const shop = item.shop && typeof item.shop === 'object' ? item.shop : {};
  const store = item.store && typeof item.store === 'object' ? item.store : {};
  const merchant = item.merchant && typeof item.merchant === 'object' ? item.merchant : {};
  const shopId =
    item.shop_id || item.shopId ||
    item.store_id || item.storeId ||
    item.market_shop_id || item.marketShopId ||
    item.merchant_id || item.merchantId ||
    shop.id || shop.shop_id || shop.shopId ||
    store.id || store.shop_id || store.shopId ||
    merchant.id || merchant.shop_id || merchant.shopId ||
    '';
  const detailUrl = `/pages/push-product-detail/push-product-detail?id=${encodeURIComponent(String(id))}&shopId=${encodeURIComponent(String(shopId))}&image=${encodeURIComponent(image)}&name=${encodeURIComponent(name)}&price=${encodeURIComponent(String(priceRaw != null ? priceRaw : ''))}`;
  const commRaw = item.rebate_amount != null ? item.rebate_amount : (item.comm != null ? item.comm : 0);
  const commStr = String(commRaw != null ? commRaw : 0);
  const shareFromApi = item.share_tag || item.shareTag;
  return {
    id,
    name,
    image,
    detailUrl,
    price: String(priceRaw != null ? priceRaw : ''),
    comm: commStr,
    tag: item.tag || '',
    shareTag: shareFromApi || (`分享赚/购买返￥${commStr}`)
  };
};

/**
 * 列表页请求公共参数：与首页本地商城一致，带 5km 半径语义。
 */
const buildShopGoodsQuery = (extra = {}) => {
  const q = { ...extra };
  const lat = wx.getStorageSync('market_user_lat');
  const lng = wx.getStorageSync('market_user_lng');
  if (lat != null && lng != null && lat !== '' && lng !== '') {
    q.user_lat = Number(lat);
    q.user_lng = Number(lng);
  }
  q.distance_km = q.distance_km != null ? q.distance_km : 5;
  return q;
};

/**
 * 子页进入时尽量拿到坐标（复用本地集市 storage 键，与首页一致）
 */
const ensureUserCoordsForShop = () => new Promise((resolve) => {
  const lat0 = wx.getStorageSync('market_user_lat');
  const lng0 = wx.getStorageSync('market_user_lng');
  if (lat0 != null && lng0 != null && lat0 !== '' && lng0 !== '') {
    resolve({ hasCoords: true });
    return;
  }
  wx.getLocation({
    type: 'gcj02',
    success: (res) => {
      wx.setStorageSync('market_user_lat', res.latitude);
      wx.setStorageSync('market_user_lng', res.longitude);
      resolve({ hasCoords: true });
    },
    fail: () => resolve({ hasCoords: false })
  });
});

/** 解析 { list } 或裸数组（core/workers、service-orders/my、goods/featured 等） */
const unwrapList = (res) => {
  if (res == null) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.list)) return res.list;
  if (Array.isArray(res.items)) return res.items;
  return [];
};

/** ========== 本地集市位置缓存快捷操作（减少 pages/index/index.js 重复代码） ========== */

const MARKET_KEYS = {
  lat: 'market_user_lat',
  lng: 'market_user_lng',
  manual: 'market_user_location_manual',
  refresh: 'market_refresh_after_address',
  snapId: 'market_snap_address_id',
  snapDk: 'market_snap_distance_km',
  label: 'market_location_label'
};

/** 获取集市用户坐标 { lat, lng }，缺失或为空时返回 null */
const getMarketUserCoords = () => {
  const lat = wx.getStorageSync(MARKET_KEYS.lat);
  const lng = wx.getStorageSync(MARKET_KEYS.lng);
  if (lat == null || lng == null || lat === '' || lng === '') return null;
  return { lat: Number(lat), lng: Number(lng) };
};

/** 设置集市用户坐标 */
const setMarketUserCoords = (lat, lng) => {
  wx.setStorageSync(MARKET_KEYS.lat, lat);
  wx.setStorageSync(MARKET_KEYS.lng, lng);
};

/** 清除集市用户坐标 */
const removeMarketUserCoords = () => {
  wx.removeStorageSync(MARKET_KEYS.lat);
  wx.removeStorageSync(MARKET_KEYS.lng);
  wx.removeStorageSync(MARKET_KEYS.manual);
};

/** 清除集市快照信息 */
const removeMarketSnapInfo = () => {
  wx.removeStorageSync(MARKET_KEYS.snapId);
  wx.removeStorageSync(MARKET_KEYS.snapDk);
};

/** 清除集市位置标签 */
const removeMarketLocationLabel = () => {
  wx.removeStorageSync(MARKET_KEYS.label);
};

/** 一键清除所有集市位置缓存（地址变更后调用） */
const clearMarketLocationCache = () => {
  wx.removeStorageSync(MARKET_KEYS.refresh);
  removeMarketUserCoords();
  removeMarketSnapInfo();
  removeMarketLocationLabel();
};

/** 设置集市快照信息 */
const setMarketSnapInfo = (id, dKm) => {
  wx.setStorageSync(MARKET_KEYS.snapId, id);
  wx.setStorageSync(MARKET_KEYS.snapDk, dKm);
};

/** 设置集市位置标签 */
const setMarketLocationLabel = (label) => {
  wx.setStorageSync(MARKET_KEYS.label, label);
};

module.exports = {
  formatTime,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  goodsStateTabel,
  booksStateTabel,
  stateTabel,
  imgUrl,
  normalizeServerImagePath,
  flattenMarketShopPayload,
  pickMarketShopAvatarPath,
  pickShopProductCoverRaw,
  extractDistanceKmFromProduct,
  filterShopProductsByDistance,
  normalizeShopProductRow,
  buildShopGoodsQuery,
  ensureUserCoordsForShop,
  unwrapList,
  getMarketUserCoords,
  setMarketUserCoords,
  removeMarketUserCoords,
  removeMarketSnapInfo,
  removeMarketLocationLabel,
  clearMarketLocationCache,
  setMarketSnapInfo,
  setMarketLocationLabel
}
