const FaceAnalysisService = require('../services/faceAnalysisService');
const CelebrityService = require('../services/celebrityService');
const ImageUtils = require('../utils/imageUtils');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middleware/errorHandler');

// 创建服务实例
const faceAnalysisService = new FaceAnalysisService();
const celebrityService = new CelebrityService();

/**
 * 开始人脸分析
 */
const startAnalysis = catchAsync(async (req, res) => {
  const { imageId, imageBase64 } = req.body;

  if (!imageId && !imageBase64) {
    const response = error('请提供 imageId 或 imageBase64', 400);
    return res.status(400).json(response);
  }

  try {
    // 生成分析ID
    const { v4: uuidv4 } = require('uuid');
    const analysisId = uuidv4();

    // 立即返回分析ID，实际分析在另一个接口中执行
    const response = success({
      analysisId,
      status: 'processing',
      message: '分析任务已开始'
    }, '分析任务已创建');

    res.json(response);

  } catch (err) {
    console.error('创建分析任务失败:', err);
    const response = error('创建分析任务失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 执行人脸分析
 */
const performAnalysis = catchAsync(async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    const response = error('请提供图片数据', 400);
    return res.status(400).json(response);
  }

  try {
    // 执行分析
    const result = await faceAnalysisService.analyzeFace(imageBase64);

    // 返回分析结果
    const response = success(result, '分析完成');

    res.json(response);

  } catch (err) {
    console.error('人脸分析失败:', err);
    const response = error(err.message || '人脸分析失败', err.statusCode || 500);
    res.status(err.statusCode || 500).json(response);
  }
});

/**
 * 获取分析结果（如果有的话）
 */
const getAnalysisResult = catchAsync(async (req, res) => {
  const { analysisId } = req.params;

  // 这里简化处理，实际应用中需要将分析结果存储到数据库或缓存中
  const history = faceAnalysisService.getAnalysisHistory();
  const analysis = history.find(item => item.id.startsWith(analysisId.substring(0, 8)));

  if (!analysis) {
    const response = error('分析结果不存在或已过期', 404);
    return res.status(404).json(response);
  }

  const response = success(analysis, '获取分析结果成功');
  res.json(response);
});

/**
 * 获取分析历史记录
 */
const getAnalysisHistory = catchAsync(async (req, res) => {
  try {
    const history = faceAnalysisService.getAnalysisHistory();

    const response = success({
      history,
      total: history.length
    }, '获取历史记录成功');

    res.json(response);

  } catch (err) {
    console.error('获取分析历史失败:', err);
    const response = error('获取历史记录失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 获取名人列表
 */
const getCelebrities = catchAsync(async (req, res) => {
  const { gender } = req.query;

  try {
    const celebrities = await celebrityService.getCelebrities(gender);

    const response = success({
      celebrities,
      total: celebrities.length,
      gender: gender || 'all'
    }, '获取名人列表成功');

    res.json(response);

  } catch (err) {
    console.error('获取名人列表失败:', err);
    const response = error('获取名人列表失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 添加名人
 */
const addCelebrity = catchAsync(async (req, res) => {
  const { name, gender, description } = req.body;

  if (!name || !gender) {
    const response = error('请提供名人姓名和性别', 400);
    return res.status(400).json(response);
  }

  if (!req.file) {
    const response = error('请上传名人照片', 400);
    return res.status(400).json(response);
  }

  try {
    const result = await celebrityService.addCelebrity(
      name,
      gender,
      req.file.buffer,
      description
    );

    const response = success(result, '名人添加成功');
    res.json(response);

  } catch (err) {
    console.error('添加名人失败:', err);
    const response = error(err.message || '添加名人失败', err.statusCode || 500);
    res.status(err.statusCode || 500).json(response);
  }
});

/**
 * 删除名人
 */
const removeCelebrity = catchAsync(async (req, res) => {
  const { gender, filename } = req.params;

  try {
    const result = await celebrityService.removeCelebrity(gender, filename);

    if (result) {
      const response = success(null, '名人删除成功');
      res.json(response);
    } else {
      const response = error('名人不存在或删除失败', 404);
      res.status(404).json(response);
    }

  } catch (err) {
    console.error('删除名人失败:', err);
    const response = error('删除名人失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 获取名人统计信息
 */
const getCelebrityStatistics = catchAsync(async (req, res) => {
  try {
    const statistics = await celebrityService.getStatistics();

    const response = success(statistics, '获取统计信息成功');
    res.json(response);

  } catch (err) {
    console.error('获取统计信息失败:', err);
    const response = error('获取统计信息失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 清理临时文件
 */
const cleanupTempFiles = catchAsync(async (req, res) => {
  try {
    await ImageUtils.cleanupOldFiles(config.upload.directory);

    const response = success(null, '清理完成');
    res.json(response);

  } catch (err) {
    console.error('清理临时文件失败:', err);
    const response = error('清理失败', 500);
    res.status(500).json(response);
  }
});

module.exports = {
  startAnalysis,
  performAnalysis,
  getAnalysisResult,
  getAnalysisHistory,
  getCelebrities,
  addCelebrity,
  removeCelebrity,
  getCelebrityStatistics,
  cleanupTempFiles
};