const axios = require('axios');
const config = require('../config');
const AppError = require('../middleware/errorHandler').AppError;

/**
 * 阿里云百炼 API 服务
 */
class AiService {
  constructor() {
    this.apiKey = config.dashscope.apiKey;
    this.baseUrl = config.dashscope.baseUrl;
    this.endpoint = config.dashscope.endpoint;
    this.model = config.dashscope.model;

    if (!this.apiKey) {
      throw new AppError('阿里云百炼 API Key 未配置', 500);
    }

    // 构建完整的URL
    this.fullUrl = this.baseUrl + this.endpoint;
  }

  /**
   * 调用阿里云百炼API进行人脸分析
   * @param {string} imageBase64 - Base64编码的图片
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeFace(imageBase64) {
    try {
      const prompt = `请分析这张人脸照片，以JSON格式返回以下信息：
{
  "gender": "男/女",
  "age": 数字,
  "hasGlasses": true/false,
  "smileLevel": "无笑容/微笑/开心大笑",
  "beautyScore": 1-100的数字,
  "temperament": "一句话气质描述，如：眼神深邃，气质优雅",
  "healthAnalysis": {
    "complexion": "气色描述，如：气色红润/略显疲态",
    "suggestions": ["健康建议1", "健康建议2", "健康建议3"]
  },
  "facialFeatures": "五官特点描述"
}
只返回JSON，不要其他文字。`;

      const payload = {
        model: this.model,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      };

      console.log('AI API Request [analyzeFace]:', {
        url: this.fullUrl,
        model: this.model
      });

      const response = await axios.post(this.fullUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.analysis.timeout
      });

      console.log('AI API Response Status:', response.status);
      console.log('AI Response Structure:', {
        hasOutput: !!response.data.output,
        hasChoices: !!response.data.choices,
        keys: Object.keys(response.data)
      });

      // 提取AI回复内容 - 兼容OpenAI格式
      let content;
      if (response.data.output && response.data.output.choices) {
        // 阿里云百炼的响应格式
        content = response.data.output.choices[0].message.content;
      } else if (response.data.choices) {
        // 标准OpenAI兼容格式
        content = response.data.choices[0].message.content;
      } else {
        throw new Error('无法解析API响应');
      }

      // 尝试解析JSON
      let analysisResult;
      try {
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI回复中未找到有效JSON');
        }
      } catch (parseError) {
        console.error('解析AI回复失败:', content);
        throw new AppError('AI分析结果解析失败', 500);
      }

      // 验证结果完整性
      const requiredFields = ['gender', 'age', 'hasGlasses', 'smileLevel', 'beautyScore'];
      for (const field of requiredFields) {
        if (analysisResult[field] === undefined) {
          throw new AppError(`AI分析结果缺少必要字段: ${field}`, 500);
        }
      }

      return analysisResult;

    } catch (error) {
      console.error('AI服务调用失败:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        throw new AppError('API密钥无效或已过期', 401);
      } else if (error.response?.status === 429) {
        throw new AppError('API调用频率过高，请稍后再试', 429);
      } else if (error.code === 'ECONNABORTED') {
        throw new AppError('请求超时，请稍后再试', 408);
      }

      throw new AppError('AI分析服务暂时不可用，请稍后再试', 503);
    }
  }

  /**
   * 比较两张人脸的相似度
   * @param {string} imageBase641 - 第一张图片的Base64
   * @param {string} imageBase642 - 第二张图片的Base64
   * @returns {Promise<number>} 相似度评分 (0-100)
   */
  async compareFaces(imageBase641, imageBase642) {
    try {
      const prompt = `请比较这两张人脸照片的相似度，返回0-100之间的数字。
100表示完全相同，0表示完全不同。
请考虑面部轮廓、五官特征、整体气质等因素。
只返回数字，不要其他文字。`;

      const payload = {
        model: this.model,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase641
              }
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase642
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      };

      const response = await axios.post(this.fullUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.analysis.timeout
      });

      // 提取AI回复内容 - 兼容OpenAI格式
      let content;
      if (response.data.output && response.data.output.choices) {
        // 阿里云百炼的响应格式
        content = response.data.output.choices[0].message.content;
      } else if (response.data.choices) {
        // 标准OpenAI兼容格式
        content = response.data.choices[0].message.content;
      } else {
        return 50; // 默认中等相似度
      }

      // 提取数字
      const scoreMatch = content.match(/\d+/);
      if (scoreMatch) {
        const score = parseInt(scoreMatch[0]);
        return Math.min(100, Math.max(0, score)); // 确保在0-100范围内
      }

      return 50; // 默认中等相似度

    } catch (error) {
      console.error('人脸比较失败:', error);
      return 50; // 默认中等相似度
    }
  }
}

module.exports = AiService;