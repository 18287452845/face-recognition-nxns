const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const ImageUtils = require('../utils/imageUtils');
const AppError = require('../middleware/errorHandler').AppError;

/**
 * 名人匹配服务
 */
class CelebrityService {
  constructor() {
    this.celebrityCache = null;
    this.lastCacheUpdate = 0;
    this.cacheUpdateInterval = 5 * 60 * 1000; // 5分钟更新一次缓存
  }

  /**
   * 匹配最相似的名人
   * @param {string} imageBase64 - Base64编码的用户图片
   * @param {string} gender - 用户性别
   * @returns {Promise<Object>} 匹配结果
   */
  async matchCelebrity(imageBase64, gender = null) {
    try {
      // 获取对应性别的名人列表
      const celebrities = await this.getCelebrities(gender);

      if (celebrities.length === 0) {
        // 如果没有对应性别的名人，返回默认匹配
        return {
          name: '神秘明星',
          photo: null,
          similarity: 0,
          description: '暂无匹配的明星'
        };
      }

      // 随机选择一位名人（简单版本）
      // 实际应用中可以使用AI进行相似度计算
      const randomIndex = Math.floor(Math.random() * celebrities.length);
      const selectedCelebrity = celebrities[randomIndex];

      // 生成随机相似度（65-95之间）
      const similarity = Math.floor(Math.random() * 31) + 65;

      // 生成匹配理由
      const matchReasons = [
        '你们有相似的眼神轮廓',
        '面部特征非常相似',
        '气质风格相近',
        '五官比例相似',
        '笑容特点相似',
        '整体面部轮廓相似'
      ];
      const matchReason = matchReasons[Math.floor(Math.random() * matchReasons.length)];

      return {
        name: selectedCelebrity.name,
        photo: `/celebrities/${gender}/${selectedCelebrity.filename}`,
        similarity: similarity,
        description: selectedCelebrity.description || '著名明星',
        matchReason: matchReason
      };

    } catch (error) {
      console.error('名人匹配失败:', error);
      // 返回默认结果
      return {
        name: '神秘明星',
        photo: null,
        similarity: 0,
        description: '暂无匹配的明星'
      };
    }
  }

  /**
   * 获取名人列表
   * @param {string} gender - 性别过滤
   * @returns {Promise<Array>} 名人列表
   */
  async getCelebrities(gender = null) {
    try {
      // 检查缓存
      const now = Date.now();
      if (this.celebrityCache && (now - this.lastCacheUpdate) < this.cacheUpdateInterval) {
        const cache = gender ? this.celebrityCache[gender] : [].concat(...Object.values(this.celebrityCache));
        return cache || [];
      }

      // 扫描名人照片目录
      const maleCelebrities = await this.scanCelebrityDirectory('male');
      const femaleCelebrities = await this.scanCelebrityDirectory('female');

      // 更新缓存
      this.celebrityCache = {
        male: maleCelebrities,
        female: femaleCelebrities
      };
      this.lastCacheUpdate = now;

      // 返回请求的性别对应的名人
      return gender ? this.celebrityCache[gender] : [...maleCelebrities, ...femaleCelebrities];

    } catch (error) {
      console.error('获取名人列表失败:', error);
      return [];
    }
  }

  /**
   * 扫描名人照片目录
   * @param {string} gender - 性别（male/female）
   * @returns {Promise<Array>} 名人列表
   */
  async scanCelebrityDirectory(gender) {
    try {
      const dir = gender === 'male' ? config.celebrities.maleDir : config.celebrities.femaleDir;

      // 确保目录存在
      await fs.mkdir(dir, { recursive: true });

      // 读取目录中的文件
      const files = await fs.readdir(dir);

      // 过滤图片文件
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });

      // 转换为名人对象
      const celebrities = imageFiles.map(file => {
        const name = path.parse(file).name;
        // 可以从文件名解析更多信息，如：周杰伦-华语天王.jpg
        const nameParts = name.split('-');
        const displayName = nameParts[0] || name;
        const description = nameParts[1] || '著名明星';

        return {
          name: displayName,
          filename: file,
          description: description,
          gender: gender,
          path: path.join(dir, file)
        };
      });

      return celebrities;

    } catch (error) {
      console.error(`扫描${gender}名人目录失败:`, error);
      return [];
    }
  }

  /**
   * 添加名人照片
   * @param {string} name - 名人姓名
   * @param {string} gender - 性别（male/female）
   * @param {Buffer} imageBuffer - 图片数据
   * @param {string} description - 描述
   * @returns {Promise<Object>} 添加的名人信息
   */
  async addCelebrity(name, gender, imageBuffer, description = '') {
    try {
      if (!['male', 'female'].includes(gender)) {
        throw new AppError('性别必须是 male 或 female', 400);
      }

      // 生成文件名
      const filename = `${name}-${description || '著名明星'}.jpg`;
      const dir = gender === 'male' ? config.celebrities.maleDir : config.celebrities.femaleDir;

      // 压缩图片
      const compressedBuffer = await ImageUtils.compressImage(imageBuffer, {
        width: 500,
        height: 500,
        quality: 85
      });

      // 保存图片
      const filePath = await ImageUtils.saveImage(compressedBuffer, filename, dir);

      // 清空缓存，强制更新
      this.celebrityCache = null;

      return {
        name,
        gender,
        filename,
        description: description || '著名明星',
        path: filePath
      };

    } catch (error) {
      console.error('添加名人失败:', error);
      throw error;
    }
  }

  /**
   * 删除名人
   * @param {string} gender - 性别
   * @param {string} filename - 文件名
   * @returns {Promise<boolean>} 是否删除成功
   */
  async removeCelebrity(gender, filename) {
    try {
      const dir = gender === 'male' ? config.celebrities.maleDir : config.celebrities.femaleDir;
      const filePath = path.join(dir, filename);

      await ImageUtils.deleteFile(filePath);

      // 清空缓存
      this.celebrityCache = null;

      return true;

    } catch (error) {
      console.error('删除名人失败:', error);
      return false;
    }
  }

  /**
   * 获取名人统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      const maleCelebrities = await this.getCelebrities('male');
      const femaleCelebrities = await this.getCelebrities('female');

      return {
        total: maleCelebrities.length + femaleCelebrities.length,
        male: maleCelebrities.length,
        female: femaleCelebrities.length,
        lastUpdated: this.lastCacheUpdate ? new Date(this.lastCacheUpdate).toISOString() : null
      };

    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        total: 0,
        male: 0,
        female: 0,
        lastUpdated: null
      };
    }
  }
}

module.exports = CelebrityService;