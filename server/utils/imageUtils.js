const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

/**
 * 图片处理工具类
 */
class ImageUtils {
  /**
   * Base64 转 Buffer
   * @param {string} base64String - Base64编码的图片字符串
   * @returns {Buffer} 图片Buffer
   */
  static base64ToBuffer(base64String) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Base64 转 MIME类型
   * @param {string} base64String - Base64编码的图片字符串
   * @returns {string} MIME类型
   */
  static getBase64MimeType(base64String) {
    const matches = base64String.match(/^data:(.+);base64,/);
    return matches ? matches[1] : 'image/jpeg';
  }

  /**
   * 检测图片是否包含人脸（简单检查）
   * @param {Buffer} imageBuffer - 图片Buffer
   * @returns {boolean} 是否可能包含人脸
   */
  static async detectFace(imageBuffer) {
    try {
      // 使用 sharp 检查图片尺寸
      const metadata = await sharp(imageBuffer).metadata();

      // 图片太小可能不包含清晰的人脸
      if (metadata.width < 100 || metadata.height < 100) {
        return false;
      }

      // 这里可以集成更复杂的人脸检测库
      return true;
    } catch (error) {
      console.error('图片检测失败:', error);
      return false;
    }
  }

  /**
   * 压缩和调整图片大小
   * @param {Buffer} imageBuffer - 原始图片Buffer
   * @param {Object} options - 压缩选项
   * @returns {Buffer} 处理后的图片Buffer
   */
  static async compressImage(imageBuffer, options = {}) {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'jpeg'
    } = options;

    try {
      let transformer = sharp(imageBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });

      if (format === 'jpeg') {
        transformer = transformer.jpeg({ quality });
      } else if (format === 'png') {
        transformer = transformer.png({ quality });
      } else if (format === 'webp') {
        transformer = transformer.webp({ quality });
      }

      return await transformer.toBuffer();
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw new Error('图片处理失败');
    }
  }

  /**
   * 保存图片到本地
   * @param {Buffer} imageBuffer - 图片Buffer
   * @param {string} filename - 文件名
   * @param {string} directory - 保存目录
   * @returns {string} 保存的文件路径
   */
  static async saveImage(imageBuffer, filename, directory) {
    try {
      // 确保目录存在
      await fs.mkdir(directory, { recursive: true });

      const filePath = path.join(directory, filename);
      await fs.writeFile(filePath, imageBuffer);

      return filePath;
    } catch (error) {
      console.error('图片保存失败:', error);
      throw new Error('图片保存失败');
    }
  }

  /**
   * 删除本地文件
   * @param {string} filePath - 文件路径
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('文件删除失败:', error);
    }
  }

  /**
   * 清理过期文件
   * @param {string} directory - 目录路径
   * @param {number} maxAge - 最大保存时间（毫秒）
   */
  static async cleanupOldFiles(directory, maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
          console.log(`清理过期文件: ${file}`);
        }
      }
    } catch (error) {
      console.error('清理文件失败:', error);
    }
  }

  /**
   * 获取文件扩展名
   * @param {string} mimeType - MIME类型
   * @returns {string} 文件扩展名
   */
  static getExtensionFromMimeType(mimeType) {
    const mimeTypes = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    return mimeTypes[mimeType] || '.jpg';
  }
}

module.exports = ImageUtils;