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
      const celebrityMatch = await this.celebrityService.matchCelebrity(imageBase64, analysisResult);

      // 生成健康建议
      const healthAdvice = this.generateHealthAdvice(analysisResult);
      
      // 组装完整结果
      const fullResult = {
        timestamp: new Date().toISOString(),
        analysis: {
          ...analysisResult,
          healthAdvice: healthAdvice,
          // 确保包含所有详细信息
          evaluation: analysisResult.evaluation || '',
          facialFeatures: analysisResult.facialFeatures || '',
          healthAnalysis: {
            complexion: analysisResult.healthAnalysis?.complexion || '',
            skinCondition: analysisResult.healthAnalysis?.skinCondition || '',
            suggestions: healthAdvice,
            strengthPoints: analysisResult.healthAnalysis?.strengthPoints || []
          }
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

    // 从AI返回的建议中获取，如果没有则生成
    if (analysisResult.healthAnalysis && analysisResult.healthAnalysis.suggestions &&
        analysisResult.healthAnalysis.suggestions.length > 0) {
      // AI已经提供了详细的建议，直接使用
      return analysisResult.healthAnalysis.suggestions.slice(0, 4);
    }

    // 备用方案：基于年龄的建议
    if (analysisResult.age) {
      if (analysisResult.age < 25) {
        advice.push('保持良好的作息时间，避免熬夜，青春肌肤需要充足睡眠呵护');
        advice.push('坚持户外运动和健身，增强体质，保持年轻活力');
        advice.push('均衡饮食，多吃富含抗氧化物的食物，保持肌肤光泽');
      } else if (analysisResult.age < 40) {
        advice.push('注意工作与生活的平衡，定期放松身心，适度的压力管理很重要');
        advice.push('每年定期体检，预防慢性疾病，及早发现及时治疗');
        advice.push('坚持适度运动，每周至少3次有氧运动，强化心血管功能');
      } else {
        advice.push('保持适度的运动量，散步、太极、瑜伽都是很好的选择');
        advice.push('注意饮食清淡营养均衡，定期体检了解身体状况');
        advice.push('重视睡眠质量，建立规律的作息，保持精力充沛');
      }
    }

    // 基于眼镜佩戴的建议
    if (analysisResult.hasGlasses) {
      advice.push('定期检查视力并更新眼镜度数，注意用眼卫生，每小时休息10分钟');
    }

    // 基于笑容的建议
    if (analysisResult.smileLevel === '无笑容') {
      advice.push('保持积极乐观的心态，经常微笑可以释放压力，提升气质');
    }

    // 基于气色的建议
    if (analysisResult.healthAnalysis && analysisResult.healthAnalysis.complexion) {
      if (analysisResult.healthAnalysis.complexion.includes('疲态')) {
        advice.push('保证充足睡眠（7-9小时），定期休息恢复体力');
        advice.push('多喝水保持身体水分，适当补充营养，增强免疫力');
      } else {
        advice.push('气色不错！继续保持目前的生活方式，定期运动');
      }
    }

    // 确保至少有3条详细建议
    while (advice.length < 3) {
      advice.push('养成良好生活习惯，保持规律作息，为健康生活奠定坚实基础');
    }

    return advice.slice(0, 4);
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