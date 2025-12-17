const { error: errorHelper } = require('../utils/responseHelper');

/**
 * 404 错误处理中间件
 * @param {Object} req - Express request对象
 * @param {Object} res - Express response对象
 * @param {Function} next - next中间件函数
 */
const notFound = (req, res, next) => {
  const response = errorHelper(`未找到请求的资源: ${req.originalUrl}`, 404);
  res.status(404).json(response);
};

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express request对象
 * @param {Object} res - Express response对象
 * @param {Function} next - next中间件函数
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose错误处理
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    const response = errorHelper(`验证失败: ${errors.join(', ')}`, 400);
    return res.status(400).json(response);
  }

  // Multer错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    const response = errorHelper('文件大小超过限制', 400);
    return res.status(400).json(response);
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    const response = errorHelper('无效的访问令牌', 401);
    return res.status(401).json(response);
  }

  // 默认错误处理
  const statusCode = err.statusCode || 500;
  const response = errorHelper(
    err.message || '服务器内部错误',
    statusCode,
    err
  );

  res.status(statusCode).json(response);
};

/**
 * 异步错误捕获包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 创建自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  notFound,
  globalErrorHandler,
  catchAsync,
  AppError
};