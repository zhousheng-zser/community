/**
 * 性能优化工具
 * 提供数据缓存、图片优化、列表虚拟化等功能
 */

const CACHE_PREFIX = 'app_cache_';
const DEFAULT_EXPIRY = 5 * 60 * 1000;

function setCache(key, data, expiry) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expiry: expiry || DEFAULT_EXPIRY
    };
    wx.setStorageSync(CACHE_PREFIX + key, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache set failed:', e);
  }
}

function getCache(key) {
  try {
    const cacheStr = wx.getStorageSync(CACHE_PREFIX + key);
    if (!cacheStr) return null;
    const cacheData = JSON.parse(cacheStr);
    const now = Date.now();
    if (now - cacheData.timestamp > cacheData.expiry) {
      wx.removeStorageSync(CACHE_PREFIX + key);
      return null;
    }
    return cacheData.data;
  } catch (e) {
    console.warn('Cache get failed:', e);
    return null;
  }
}

function removeCache(key) {
  try {
    wx.removeStorageSync(CACHE_PREFIX + key);
  } catch (e) {
    console.warn('Cache remove failed:', e);
  }
}

function clearCache() {
  try {
    const keys = wx.getStorageInfoSync().keys;
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        wx.removeStorageSync(key);
      }
    });
  } catch (e) {
    console.warn('Cache clear failed:', e);
  }
}

function preloadImages(urls) {
  if (!Array.isArray(urls)) return;
  urls.forEach(url => {
    wx.getImageInfo({
      src: url,
      success: () => {},
      fail: () => {}
    });
  });
}

function optimizeImage(src, options = {}) {
  const {
    width = 300,
    height = 300,
    quality = 80
  } = options;
  if (!src) return src;
  if (src.startsWith('data:') || src.startsWith('wxfile://')) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}imageView2/1/w/${width}/h/${height}/q/${quality}`;
}

function lazyLoadImage(page, imageKey, src) {
  const observer = wx.createIntersectionObserver(page);
  observer.relativeToViewport({ bottom: 100 }).observe(`.${imageKey}`, (res) => {
    if (res.intersectionRatio > 0) {
      page.setData({ [`${imageKey}Loaded`]: true });
      observer.disconnect();
    }
  });
}

function paginateList(list, page, pageSize) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return list.slice(start, end);
}

function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) return cache[key];
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}

function batchUpdateData(page, data, callback) {
  const keys = Object.keys(data);
  const batchSize = 10;
  let index = 0;
  function updateBatch() {
    if (index >= keys.length) {
      if (callback) callback();
      return;
    }
    const batch = {};
    for (let i = 0; i < batchSize && index < keys.length; i++, index++) {
      batch[keys[index]] = data[keys[index]];
    }
    page.setData(batch, updateBatch);
  }
  updateBatch();
}

function getStorageSize() {
  try {
    const info = wx.getStorageInfoSync();
    return {
      currentSize: info.currentSize,
      limitSize: info.limitSize,
      usagePercent: ((info.currentSize / info.limitSize) * 100).toFixed(2) + '%'
    };
  } catch (e) {
    return { currentSize: 0, limitSize: 0, usagePercent: '0%' };
  }
}

function clearStorageIfNeeded(thresholdPercent = 80) {
  const { usagePercent } = getStorageSize();
  const percent = parseFloat(usagePercent);
  if (percent > thresholdPercent) {
    clearCache();
    return true;
  }
  return false;
}

module.exports = {
  setCache,
  getCache,
  removeCache,
  clearCache,
  preloadImages,
  optimizeImage,
  lazyLoadImage,
  paginateList,
  debounce,
  throttle,
  memoize,
  batchUpdateData,
  getStorageSize,
  clearStorageIfNeeded
};
