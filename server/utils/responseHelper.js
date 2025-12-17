/**
 * 统一响应格式工具
 */

/**
 * 返回成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @returns {Object} 格式化的响应对象
 */
const success = (data = null, message = '操作成功') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 返回失败响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误代码
 * @param {*} error - 错误详情
 * @returns {Object} 格式化的响应对象
 */
const error = (message = '操作失败', code = 500, error = null) => {
  return {
    success: false,
    message,
    code,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    timestamp: new Date().toISOString()
  };
};

/**
 * Express 响应发送器
 * @param {Object} res - Express response对象
 * @param {number} statusCode - HTTP状态码
 * @param {Object} response - 响应对象
 */
const send = (res, statusCode, response) => {
  res.status(statusCode).json(response);
};

module.exports = {
  success,
  error,
  send
};