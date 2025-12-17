const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');
const ImageUtils = require('./utils/imageUtils');

// 创建Express应用
const app = express();

// 信任代理（如果使用反向代理）
app.set('trust proxy', 1);

// CORS配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // 生产环境指定域名
    : true, // 开发环境允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// 中间件配置
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/celebrities', express.static(path.join(__dirname, '../celebrities')));
// 禁用默认 index.html，避免与启动页路由冲突
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

// API路由
app.use('/api', require('./routes/api'));

// 启动页路由
app.get(['/', '/start'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/start.html'));
});

// 扫描页路由
app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 结果页路由
app.get('/result', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/result.html'));
});

// 404错误处理
app.use(notFound);

// 全局错误处理
app.use(globalErrorHandler);

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║    NXNS 云匹配识别系统                                        ║
  ║                                                              ║
  ║    服务器运行在: http://localhost:${config.port}                  ║
  ║    环境: ${config.nodeEnv.toUpperCase()}                                          ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});

// 定期清理临时文件（每小时执行一次）
setInterval(async () => {
  try {
    await ImageUtils.cleanupOldFiles(config.upload.directory);
  } catch (error) {
    console.error('自动清理临时文件失败:', error);
  }
}, 60 * 60 * 1000);

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;