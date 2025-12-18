const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * 图片爬取服务 - 从网络获取明星照片
 */
class ImageScraperService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../../cache/celebrity-photos');
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7天缓存
    this.initCache();
  }

  /**
   * 初始化缓存目录
   */
  async initCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('初始化缓存目录失败:', error);
    }
  }

  /**
   * 生成缓存键
   */
  getCacheKey(celebrityName) {
    return crypto.createHash('md5').update(celebrityName).digest('hex');
  }

  /**
   * 获取缓存的照片路径
   */
  async getCachedPhoto(celebrityName) {
    try {
      const cacheKey = this.getCacheKey(celebrityName);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.jpg`);
      
      // 检查文件是否存在
      try {
        const stats = await fs.stat(cacheFile);
        
        // 检查缓存是否过期
        const now = Date.now();
        if (now - stats.mtimeMs < this.cacheExpiry) {
          return `/cache/celebrity-photos/${cacheKey}.jpg`;
        }
      } catch (err) {
        // 文件不存在，返回 null
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('获取缓存照片失败:', error);
      return null;
    }
  }

  /**
   * 保存照片到缓存
   */
  async saveToCache(celebrityName, imageBuffer) {
    try {
      const cacheKey = this.getCacheKey(celebrityName);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.jpg`);
      
      // 压缩并保存图片
      await sharp(imageBuffer)
        .resize(500, 500, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(cacheFile);
      
      return `/cache/celebrity-photos/${cacheKey}.jpg`;
    } catch (error) {
      console.error('保存缓存照片失败:', error);
      return null;
    }
  }

  /**
   * 从百度图片搜索获取明星照片
   */
  async fetchFromBaidu(celebrityName) {
    try {
      // 百度图片搜索API（使用简单的爬取方式）
      const searchUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&word=${encodeURIComponent(celebrityName + ' 明星')}&pn=0&rn=1`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://image.baidu.com/'
        },
        timeout: 10000
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const imageData = response.data.data.find(item => item.thumbURL || item.middleURL);
        
        if (imageData) {
          const imageUrl = imageData.middleURL || imageData.thumbURL;
          
          // 下载图片
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://image.baidu.com/'
            },
            timeout: 15000
          });

          if (imageResponse.data) {
            return Buffer.from(imageResponse.data);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('从百度获取照片失败:', error.message);
      return null;
    }
  }

  /**
   * 从Bing图片搜索获取明星照片
   */
  async fetchFromBing(celebrityName) {
    try {
      // Bing图片搜索（备用方案）
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(celebrityName + ' 明星')}&first=1&count=1&qft=+filterui:imagesize-large`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      // 使用正则提取图片URL
      const imageUrlMatch = response.data.match(/"murl":"([^"]+)"/);
      
      if (imageUrlMatch && imageUrlMatch[1]) {
        const imageUrl = imageUrlMatch[1];
        
        // 下载图片
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        if (imageResponse.data) {
          return Buffer.from(imageResponse.data);
        }
      }

      return null;
    } catch (error) {
      console.error('从Bing获取照片失败:', error.message);
      return null;
    }
  }

  /**
   * 使用搜狗图片搜索（备用方案3）
   */
  async fetchFromSogou(celebrityName) {
    try {
      const searchUrl = `https://pic.sogou.com/pics?query=${encodeURIComponent(celebrityName + ' 明星')}&start=0&reqFrom=result`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // 提取JSON数据
      const jsonMatch = response.data.match(/window\.sogou\.ivk\.imageList\s*=\s*(\[[\s\S]*?\]);/);
      
      if (jsonMatch && jsonMatch[1]) {
        const imageList = JSON.parse(jsonMatch[1]);
        
        if (imageList.length > 0 && imageList[0].picUrl) {
          const imageUrl = imageList[0].picUrl;
          
          // 下载图片
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
          });

          if (imageResponse.data) {
            return Buffer.from(imageResponse.data);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('从搜狗获取照片失败:', error.message);
      return null;
    }
  }

  /**
   * 获取明星照片（优先从缓存，否则从网络爬取）
   * @param {string} celebrityName - 明星名字
   * @returns {Promise<string|null>} 照片URL或null
   */
  async getCelebrityPhoto(celebrityName) {
    try {
      // 1. 先检查缓存
      const cachedPhoto = await this.getCachedPhoto(celebrityName);
      if (cachedPhoto) {
        console.log(`使用缓存的明星照片: ${celebrityName}`);
        return cachedPhoto;
      }

      console.log(`开始爬取明星照片: ${celebrityName}`);

      // 2. 依次尝试不同的图片源
      let imageBuffer = null;

      // 尝试百度
      imageBuffer = await this.fetchFromBaidu(celebrityName);
      
      // 如果百度失败，尝试Bing
      if (!imageBuffer) {
        imageBuffer = await this.fetchFromBing(celebrityName);
      }

      // 如果Bing也失败，尝试搜狗
      if (!imageBuffer) {
        imageBuffer = await this.fetchFromSogou(celebrityName);
      }

      // 3. 如果成功获取，保存到缓存
      if (imageBuffer) {
        const photoUrl = await this.saveToCache(celebrityName, imageBuffer);
        console.log(`成功爬取并缓存明星照片: ${celebrityName}`);
        return photoUrl;
      }

      console.log(`无法获取明星照片: ${celebrityName}`);
      return null;

    } catch (error) {
      console.error('获取明星照片失败:', error);
      return null;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > this.cacheExpiry) {
          await fs.unlink(filePath);
          console.log(`清理过期缓存: ${file}`);
        }
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }
}

module.exports = ImageScraperService;
