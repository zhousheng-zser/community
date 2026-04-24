/**
 * 统一错误处理工具
 * 提供友好的错误提示和错误日志记录
 */

const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  AUTH_ERROR: '登录已过期，请重新登录',
  PERMISSION_ERROR: '权限不足，无法执行此操作',
  NOT_FOUND_ERROR: '请求的资源不存在',
  SERVER_ERROR: '服务器错误，请稍后重试',
  VALIDATION_ERROR: '输入信息有误，请检查后重试',
  UNKNOWN_ERROR: '系统异常，请稍后重试'
};

const ERROR_CODES = {
  400: 'VALIDATION_ERROR',
  401: 'AUTH_ERROR',
  403: 'PERMISSION_ERROR',
  404: 'NOT_FOUND_ERROR',
  500: 'SERVER_ERROR',
  502: 'SERVER_ERROR',
  503: 'SERVER_ERROR'
};

function getErrorMessage(error) {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  if (typeof error === 'string') return error;
  if (error.errmsg) return error.errmsg;
  if (error.message) return error.message;
  if (error.statusCode) {
    const codeKey = ERROR_CODES[error.statusCode];
    return codeKey ? ERROR_MESSAGES[codeKey] : ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

function showToastError(error, duration) {
  const message = getErrorMessage(error);
  wx.showToast({
    title: message,
    icon: 'none',
    duration: duration || 2000
  });
}

function showModalError(error, title) {
  const message = getErrorMessage(error);
  wx.showModal({
    title: title || '操作失败',
    content: message,
    showCancel: false,
    confirmText: '我知道了'
  });
}

function logError(error, context) {
  console.error(`[Error] ${context || 'Unknown'}:`, error);
  try {
    const logs = wx.getStorageSync('error_logs') || [];
    logs.push({
      time: new Date().toISOString(),
      context: context || 'Unknown',
      error: {
        message: getErrorMessage(error),
        statusCode: error.statusCode,
        stack: error.stack
      }
    });
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    wx.setStorageSync('error_logs', logs);
  } catch (e) {
    console.error('Failed to save error log:', e);
  }
}

function clearErrorLogs() {
  try {
    wx.removeStorageSync('error_logs');
  } catch (e) {}
}

function getErrorLogs() {
  try {
    return wx.getStorageSync('error_logs') || [];
  } catch (e) {
    return [];
  }
}

function withErrorHandling(fn, context, options = {}) {
  const {
    showToast = true,
    showModal = false,
    log = true,
    fallback = null
  } = options;

  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      if (log) {
        logError(error, context);
      }
      if (showToast) {
        showToastError(error);
      }
      if (showModal) {
        showModalError(error, context);
      }
      if (fallback) {
        return fallback(error);
      }
      throw error;
    }
  };
}

function retry(fn, maxRetries, delay) {
  return async function(...args) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay || 1000));
        }
      }
    }
    throw lastError;
  };
}

module.exports = {
  ERROR_MESSAGES,
  ERROR_CODES,
  getErrorMessage,
  showToastError,
  showModalError,
  logError,
  clearErrorLogs,
  getErrorLogs,
  withErrorHandling,
  retry
};
