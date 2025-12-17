const AiService = require('./aiService');
const CelebrityService = require('./celebrityService');
const ImageUtils = require('../utils/imageUtils');
const AppError = require('../middleware/errorHandler').AppError;

/**
 * 人脸分析业务服务
 */
class FaceAnalysisService {
  constructor() {
    this.aiService = new AiService();
    this.celebrityService = new CelebrityService();
    this.analysisCache = new Map(); // 简单的内存缓存
  }

  /**
   * 分析人脸图片
   * @param {string} imageBase64 - Base64编码的图片
   * @returns {Promise<Object>} 完整的分析结果
   */
  async analyzeFace(imageBase64) {
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(imageBase64);
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      // 转换图片Buffer
      const imageBuffer = ImageUtils.base64ToBuffer(imageBase64);

      // 验证图片是否包含人脸
      const hasFace = await ImageUtils.detectFace(imageBuffer);
      if (!hasFace) {
        throw new AppError('图片中未检测到清晰的人脸', 400);
      }

      // 先执行AI分析
      const analysisResult = await this.aiService.analyzeFace(imageBase64);

      // 然后根据分析结果进行名人匹配
      const celebrityMatch = await this.celebrityService.matchCelebrity(imageBase64, analysisResult.gender);

      // 组装完整结果
      const fullResult = {
        timestamp: new Date().toISOString(),
        analysis: {
          ...analysisResult,
          healthAdvice: this.generateHealthAdvice(analysisResult)
        },
        celebrity: celebrityMatch
      };

      // 缓存结果
      this.cacheResult(cacheKey, fullResult);

      return fullResult;

    } catch (error) {
      console.error('人脸分析失败:', error);
      throw error;
    }
  }

  /**
   * 生成健康建议
   * @param {Object} analysisResult - AI分析结果
   * @returns {Array<string>} 健康建议列表
   */
  generateHealthAdvice(analysisResult) {
    const advice = [];

    // 基于年龄的建议
    if (analysisResult.age) {
      if (analysisResult.age < 25) {
        advice.push('保持良好的作息时间，避免熬夜');
        advice.push('多进行户外运动，增强体质');
      } else if (analysisResult.age < 40) {
        advice.push('注意工作与生活的平衡');
        advice.push('定期体检，预防慢性疾病');
      } else {
        advice.push('保持适度的运动量');
        advice.push('注意饮食清淡，定期体检');
      }
    }

    // 基于眼镜佩戴的建议
    if (analysisResult.hasGlasses) {
      advice.push('注意用眼卫生，定时休息');
    }

    // 基于笑容的建议
    if (analysisResult.smileLevel === '无笑容') {
      advice.push('保持积极乐观的心态，多微笑');
    }

    // 基于气色的建议
    if (analysisResult.healthAnalysis && analysisResult.healthAnalysis.complexion) {
      if (analysisResult.healthAnalysis.complexion.includes('疲态')) {
        advice.push('保证充足睡眠，注意休息');
        advice.push('多喝水，保持身体水分');
      }
    }

    // 确保至少有3条建议
    while (advice.length < 3) {
      advice.push('保持规律作息，健康生活');
    }

    return advice.slice(0, 3);
  }

  /**
   * 生成缓存键
   * @param {string} imageBase64 - Base64图片
   * @returns {string} 缓存键
   */
  generateCacheKey(imageBase64) {
    // 使用图片的哈希值作为缓存键
    const crypto = require('crypto');
    return crypto.createHash('md5').update(imageBase64).digest('hex');
  }

  /**
   * 缓存分析结果
   * @param {string} key - 缓存键
   * @param {Object} result - 分析结果
   */
  cacheResult(key, result) {
    // 设置缓存，最多缓存100个结果
    if (this.analysisCache.size > 100) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    this.analysisCache.set(key, result);
  }

  /**
   * 获取分析历史记录
   * @returns {Array} 分析历史记录摘要
   */
  getAnalysisHistory() {
    const history = Array.from(this.analysisCache.entries()).map(([key, value]) => ({
      id: key.substring(0, 8),
      timestamp: value.timestamp,
      gender: value.analysis.gender,
      age: value.analysis.age,
      celebrity: value.celebrity.name
    }));

    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

module.exports = FaceAnalysisService;