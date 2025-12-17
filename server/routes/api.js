const express = require('express');
const router = express.Router();

// 导入控制器
const webcamController = require('../controllers/webcamController');
const analysisController = require('../controllers/analysisController');

// =================
// 文件上传相关路由
// =================

// 上传Base64图片
router.post('/upload', webcamController.uploadBase64Image);

// 上传multipart/form-data图片
router.post('/upload/file', webcamController.upload.single('image'), webcamController.handleImageUpload);

// 获取上传的图片
router.get('/upload/:imageId', webcamController.getUploadedImage);

// 删除上传的图片
router.delete('/upload/:imageId', webcamController.deleteUploadedImage);

// =================
// 人脸分析相关路由
// =================

// 开始分析任务（异步）
router.post('/analyze/start', analysisController.startAnalysis);

// 执行人脸分析（同步）
router.post('/analyze', analysisController.performAnalysis);

// 获取分析结果
router.get('/result/:analysisId', analysisController.getAnalysisResult);

// 获取分析历史记录
router.get('/history', analysisController.getAnalysisHistory);

// =================
// 名人管理相关路由
// =================

// 获取名人列表
router.get('/celebrities', analysisController.getCelebrities);

// 添加名人（需要上传图片）
router.post('/celebrities', webcamController.upload.single('image'), analysisController.addCelebrity);

// 删除名人
router.delete('/celebrities/:gender/:filename', analysisController.removeCelebrity);

// 获取名人统计信息
router.get('/celebrities/stats', analysisController.getCelebrityStatistics);

// =================
// 系统相关路由
// =================

// 健康检查
router.get('/health', (req, res) => {
  const { success } = require('../utils/responseHelper');

  const response = success({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, '系统运行正常');

  res.json(response);
});

// 清理临时文件
router.post('/cleanup', analysisController.cleanupTempFiles);

// =================
// 错误处理路由
// =================

// 404处理
router.use('*', (req, res) => {
  const { error } = require('../utils/responseHelper');
  const response = error(`API端点不存在: ${req.originalUrl}`, 404);
  res.status(404).json(response);
});

module.exports = router;