/**
 * 敏感字审核工具
 * 提供敏感字过滤、替换和检测功能
 * 支持前端本地检测 + 后端API双重验证
 */

const { post, get } = require('./util.js');

const SENSITIVE_WORDS = [
  '违法', '暴力', '色情', '赌博', '毒品', '诈骗', '传销',
  '政治敏感词', '反动', '恐怖', '极端', '歧视', '辱骂'
];

const SENSITIVE_WORDS_CACHE_KEY = 'sensitive_words_cache';
const SENSITIVE_WORDS_CACHE_EXPIRE = 24 * 60 * 60 * 1000; // 24小时

/**
 * 获取敏感词列表（优先从缓存获取，其次从后端获取）
 */
async function getSensitiveWords() {
  try {
    const cache = wx.getStorageSync(SENSITIVE_WORDS_CACHE_KEY);
    if (cache && cache.expire > Date.now()) {
      return cache.words;
    }
  } catch (e) {
    console.log('读取敏感词缓存失败', e);
  }

  try {
    const res = await get('/content/sensitive-words');
    const words = res.words || (res.data && res.data.words) || SENSITIVE_WORDS;
    wx.setStorageSync(SENSITIVE_WORDS_CACHE_KEY, {
      words,
      expire: Date.now() + SENSITIVE_WORDS_CACHE_EXPIRE
    });
    return words;
  } catch (e) {
    console.log('从后端获取敏感词失败，使用本地词库', e);
    return SENSITIVE_WORDS;
  }
}

/**
 * 检测文本是否包含敏感词（调用后端API）
 * @param {string} text - 待检测文本
 * @returns {object} { hasSensitive: boolean, words: string[] }
 */
async function checkSensitiveTextAsync(text) {
  if (!text) return { hasSensitive: false, words: [] };

  try {
    const res = await post('/content/check', { content: text });
    return {
      hasSensitive: res.hasSensitive || (res.data && res.data.hasSensitive) || false,
      words: res.words || (res.data && res.data.words) || []
    };
  } catch (e) {
    console.log('后端敏感词检测失败，使用本地检测', e);
    return checkSensitiveText(text);
  }
}

/**
 * 检测文本是否包含敏感词（本地检测）
 * @param {string} text - 待检测文本
 * @returns {object} { hasSensitive: boolean, words: string[] }
 */
function checkSensitiveText(text) {
  if (!text) return { hasSensitive: false, words: [] };
  
  const words = getSensitiveWords();
  const found = [];
  
  for (const word of words) {
    if (text.includes(word)) {
      found.push(word);
    }
  }
  
  return {
    hasSensitive: found.length > 0,
    words: found
  };
}

/**
 * 替换敏感词为*（调用后端API）
 * @param {string} text - 待处理文本
 * @returns {string} 替换后的文本
 */
async function replaceSensitiveTextAsync(text) {
  if (!text) return '';

  try {
    const res = await post('/content/replace', { content: text });
    return res.replaced || (res.data && res.data.replaced) || text;
  } catch (e) {
    console.log('后端敏感词替换失败，使用本地替换', e);
    return replaceSensitiveText(text);
  }
}

/**
 * 替换敏感词为*（本地替换）
 * @param {string} text - 待处理文本
 * @returns {string} 替换后的文本
 */
function replaceSensitiveText(text) {
  if (!text) return '';
  
  const words = getSensitiveWords();
  let result = text;
  
  for (const word of words) {
    const regex = new RegExp(word, 'g');
    result = result.replace(regex, '*'.repeat(word.length));
  }
  
  return result;
}

/**
 * 验证文本是否安全（不含敏感词）
 * @param {string} text - 待验证文本
 * @returns {boolean}
 */
async function isTextSafeAsync(text) {
  const result = await checkSensitiveTextAsync(text);
  return !result.hasSensitive;
}

/**
 * 验证文本是否安全（本地检测）
 * @param {string} text - 待验证文本
 * @returns {boolean}
 */
function isTextSafe(text) {
  return !checkSensitiveText(text).hasSensitive;
}

/**
 * 中间件：在发送消息前自动检测敏感词（异步版本，调用后端）
 * @param {string} text - 消息内容
 * @param {function} onSuccess - 检测通过后的回调
 * @param {function} onFail - 检测失败后的回调
 */
async function sensitiveCheckAsync(text, onSuccess, onFail) {
  const result = await checkSensitiveTextAsync(text);
  
  if (result.hasSensitive) {
    if (onFail) {
      onFail(result);
    } else {
      wx.showModal({
        title: '提示',
        content: `内容包含敏感词汇：${result.words.join('、')}，请修改后重试`,
        showCancel: false
      });
    }
    return false;
  }
  
  if (onSuccess) {
    onSuccess();
  }
  return true;
}

/**
 * 中间件：在发送消息前自动检测敏感词（同步版本，本地检测）
 * @param {string} text - 消息内容
 * @param {function} onSuccess - 检测通过后的回调
 * @param {function} onFail - 检测失败后的回调
 */
function sensitiveCheck(text, onSuccess, onFail) {
  const result = checkSensitiveText(text);
  
  if (result.hasSensitive) {
    if (onFail) {
      onFail(result);
    } else {
      wx.showModal({
        title: '提示',
        content: `内容包含敏感词汇：${result.words.join('、')}，请修改后重试`,
        showCancel: false
      });
    }
    return false;
  }
  
  if (onSuccess) {
    onSuccess();
  }
  return true;
}

module.exports = {
  getSensitiveWords,
  checkSensitiveText,
  checkSensitiveTextAsync,
  replaceSensitiveText,
  replaceSensitiveTextAsync,
  isTextSafe,
  isTextSafeAsync,
  sensitiveCheck,
  sensitiveCheckAsync
};
