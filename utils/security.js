/**
 * 安全工具类
 * 提供请求防重复提交、数据验证、敏感信息保护等功能
 */

const pendingRequests = new Map();

function generateRequestKey(url, data) {
  return `${url}_${JSON.stringify(data || {})}`;
}

function isDuplicateRequest(url, data) {
  const key = generateRequestKey(url, data);
  return pendingRequests.has(key);
}

function addPendingRequest(url, data) {
  const key = generateRequestKey(url, data);
  pendingRequests.set(key, Date.now());
  return key;
}

function removePendingRequest(key) {
  pendingRequests.delete(key);
}

function clearPendingRequests() {
  pendingRequests.clear();
}

function debounceRequest(fn, delay) {
  let timer = null;
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall < delay) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay);
    } else {
      lastCall = Date.now();
      fn.apply(this, args);
    }
  };
}

function throttleRequest(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = Date.now();
      fn.apply(this, args);
    }
  };
}

function sanitizeInput(input, options = {}) {
  const {
    maxLength = 1000,
    allowHtml = false,
    trim = true
  } = options;
  if (typeof input !== 'string') return input;
  let result = trim ? input.trim() : input;
  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }
  if (!allowHtml) {
    result = result.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  return result;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

function maskName(name) {
  if (!name || typeof name !== 'string') return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*' + name.slice(-1);
}

function maskIdCard(idCard) {
  if (!idCard || typeof idCard !== 'string') return '';
  if (idCard.length < 8) return idCard;
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
}

function validatePhone(phone) {
  if (!phone) return false;
  return /^1[3-9]\d{9}$/.test(phone);
}

function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateIdCard(idCard) {
  if (!idCard) return false;
  return /^\d{17}[\dXx]$/.test(idCard);
}

function validateAmount(amount) {
  if (amount === null || amount === undefined) return false;
  const num = Number(amount);
  return !isNaN(num) && num >= 0 && num <= 999999999.99;
}

function validateRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return !!value;
}

function createValidator(rules) {
  return function(data) {
    const errors = {};
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      if (rule.required && !validateRequired(value)) {
        errors[field] = rule.message || `${field}不能为空`;
        continue;
      }
      if (value && rule.type === 'phone' && !validatePhone(value)) {
        errors[field] = rule.message || `${field}格式不正确`;
      }
      if (value && rule.type === 'email' && !validateEmail(value)) {
        errors[field] = rule.message || `${field}格式不正确`;
      }
      if (value && rule.type === 'amount' && !validateAmount(value)) {
        errors[field] = rule.message || `${field}格式不正确`;
      }
      if (value && rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors[field] = rule.message || `${field}长度不能超过${rule.maxLength}`;
      }
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field}格式不正确`;
      }
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  };
}

function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback !== undefined ? fallback : null;
  }
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

module.exports = {
  isDuplicateRequest,
  addPendingRequest,
  removePendingRequest,
  clearPendingRequests,
  debounceRequest,
  throttleRequest,
  sanitizeInput,
  maskPhone,
  maskName,
  maskIdCard,
  validatePhone,
  validateEmail,
  validateIdCard,
  validateAmount,
  validateRequired,
  createValidator,
  safeJSONParse,
  deepClone
};
