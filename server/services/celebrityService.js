const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const ImageUtils = require('../utils/imageUtils');
const { AppError } = require('../middleware/errorHandler');
const ImageScraperService = require('./imageScraperService');

const PUBLIC_DIR = path.join(__dirname, '../../public');

const PUBLIC_CELEBRITY_DIR_ALIASES = {
  male: ['male'],
  female: ['female', 'famale']
};

const DEFAULT_PUBLIC_CELEBRITY_NAMES = {
  male: {
    '1': '吴彦祖',
    '2': '胡歌',
    '3': '彭于晏',
    '4': '王一博',
    '5': '肖战',
    '6': '易烊千玺',
    '7': '陈伟霆',
    '8': '张艺兴',
    '9': '周杰伦',
    '10': '李现'
  },
  female: {
    '1': '刘亦菲',
    '2': '迪丽热巴',
    '3': '杨幂',
    '4': '赵丽颖',
    '5': '古力娜扎',
    '6': '唐嫣',
    '7': 'Angelababy',
    '8': '周冬雨',
    '9': '倪妮',
    '10': '白鹿'
  }
};

/**
 * 名人匹配服务
 */
class CelebrityService {
  constructor() {
    this.celebrityCache = null;
    this.lastCacheUpdate = 0;
    this.cacheUpdateInterval = 5 * 60 * 1000; // 5分钟更新一次缓存
    this.imageScraper = new ImageScraperService();
  }

  normalizeGender(gender) {
    if (!gender) return null;

    if (gender === '女' || gender === '女性' || gender === 'female' || gender === 'Female' || gender === 'famale') return 'female';
    if (gender === '男' || gender === '男性' || gender === 'male' || gender === 'Male') return 'male';

    return null;
  }

  hashSeedFromImageBase64(imageBase64 = '') {
    if (!imageBase64) return Date.now();

    const hash = crypto.createHash('md5').update(imageBase64).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  generateSimilarityScore({ rand, analysis }) {
    const base = 78 + Math.floor(rand() * 12); // 78 - 89

    const beautyScore = typeof analysis?.beautyScore === 'number' ? analysis.beautyScore : null;
    const beautyBonus = beautyScore !== null ? Math.max(-3, Math.min(9, Math.round((beautyScore - 60) / 4))) : 0;

    const smileBonus = analysis?.smileLevel === '开心大笑'
      ? 2
      : analysis?.smileLevel === '微笑'
        ? 1
        : 0;

    const glassesBonus = analysis?.hasGlasses ? 1 : 0;

    const jitter = Math.floor(rand() * 5) - 2; // -2 - +2

    return Math.max(72, Math.min(98, base + beautyBonus + smileBonus + glassesBonus + jitter));
  }

  generateMatchReason({ gender, similarity, analysis, celebrityName, rand }) {
    const isFemale = gender === 'female';

    const highlights = [];
    if (analysis?.smileLevel === '微笑') highlights.push(isFemale ? '温柔的微笑' : '自信的微笑');
    if (analysis?.smileLevel === '开心大笑') highlights.push(isFemale ? '明亮开朗的笑容' : '阳光爽朗的笑容');
    if (analysis?.hasGlasses) highlights.push(isFemale ? '戴眼镜的知性气质' : '戴眼镜的沉稳气质');

    const highlight = highlights.length ? highlights[Math.floor(rand() * highlights.length)] : (isFemale ? '灵动的眼神与精致的轮廓' : '坚毅的轮廓与沉稳的气场');

    if (similarity >= 92) {
      return `相似度非常高！你和「${celebrityName}」在神态与五官比例上高度接近，尤其是${highlight}，给人的整体氛围几乎一眼就能联想到对方。`;
    }

    if (similarity >= 85) {
      return `你和「${celebrityName}」的面部轮廓与气质风格很接近，特别是${highlight}，整体给人的感觉相当契合。`;
    }

    return `你和「${celebrityName}」在某些细节上有几分相似，例如${highlight}，整体气质也有相通之处。`;
  }

  getFallbackPhotoUrl(gender) {
    const normalizedGender = this.normalizeGender(gender) || 'male';

    if (normalizedGender === 'female') {
      const fsSync = require('fs');

      const femaleFallback = path.join(PUBLIC_DIR, 'female', '1.png');
      if (fsSync.existsSync(femaleFallback)) return '/female/1.png';

      const famaleFallback = path.join(PUBLIC_DIR, 'famale', '1.png');
      if (fsSync.existsSync(famaleFallback)) return '/famale/1.png';

      return '/female/1.png';
    }

    return '/male/1.png';
  }

  /**
   * 匹配最相似的名人
   * @param {string} imageBase64 - Base64编码的用户图片
   * @param {Object|string|null} analysisOrGender - 分析结果或性别
   * @returns {Promise<Object>} 匹配结果
   */
  async matchCelebrity(imageBase64, analysisOrGender = null) {
    try {
      const analysis = typeof analysisOrGender === 'object' && analysisOrGender !== null
        ? analysisOrGender
        : { gender: analysisOrGender };

      const normalizedGender = this.normalizeGender(analysis.gender);

      const seed = this.hashSeedFromImageBase64(imageBase64);
      const rand = this.mulberry32(seed);

      let celebrities = await this.getCelebrities(normalizedGender);

      // 优先使用 public/ 下内置的明星照片池（确保按性别匹配 public/male & public/female/famale）
      const publicCelebrities = celebrities.filter(item => item.source === 'public');
      if (publicCelebrities.length) {
        celebrities = publicCelebrities;
      }

      if (!celebrities.length) {
        celebrities = await this.getCelebrities();

        const publicAll = celebrities.filter(item => item.source === 'public');
        if (publicAll.length) {
          celebrities = publicAll;
        }
      }

      if (!celebrities.length) {
        return {
          name: '神秘明星',
          photo: this.getFallbackPhotoUrl(normalizedGender),
          similarity: 0,
          description: '暂无匹配的明星',
          matchReason: '暂无可匹配的明星',
          gender: normalizedGender || 'male'
        };
      }

      const selectedCelebrity = celebrities[Math.floor(rand() * celebrities.length)];
      const similarity = this.generateSimilarityScore({ rand, analysis });
      const matchReason = this.generateMatchReason({
        gender: selectedCelebrity.gender || normalizedGender,
        similarity,
        analysis,
        celebrityName: selectedCelebrity.name,
        rand
      });

      // 尝试从网络获取明星照片
      let photoUrl = selectedCelebrity.photoUrl;
      try {
        const scrapedPhoto = await this.imageScraper.getCelebrityPhoto(selectedCelebrity.name);
        if (scrapedPhoto) {
          photoUrl = scrapedPhoto;
        }
      } catch (error) {
        console.log(`网络获取照片失败，使用本地照片: ${error.message}`);
      }

      return {
        name: selectedCelebrity.name,
        photo: photoUrl || this.getFallbackPhotoUrl(selectedCelebrity.gender || normalizedGender),
        similarity,
        description: selectedCelebrity.description || '著名明星',
        matchReason,
        gender: selectedCelebrity.gender || normalizedGender || 'male'
      };

    } catch (error) {
      console.error('名人匹配失败:', error);

      const normalizedGender = this.normalizeGender(typeof analysisOrGender === 'object' ? analysisOrGender?.gender : analysisOrGender);

      return {
        name: '神秘明星',
        photo: this.getFallbackPhotoUrl(normalizedGender),
        similarity: 0,
        description: '暂无匹配的明星',
        matchReason: '暂无可匹配的明星',
        gender: normalizedGender || 'male'
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
      const normalizedGender = this.normalizeGender(gender) || null;

      const now = Date.now();
      if (this.celebrityCache && (now - this.lastCacheUpdate) < this.cacheUpdateInterval) {
        if (normalizedGender) return this.celebrityCache[normalizedGender] || [];
        return [...(this.celebrityCache.male || []), ...(this.celebrityCache.female || [])];
      }

      const [maleCelebrities, femaleCelebrities] = await Promise.all([
        this.scanAllCelebritySources('male'),
        this.scanAllCelebritySources('female')
      ]);

      this.celebrityCache = {
        male: maleCelebrities,
        female: femaleCelebrities
      };
      this.lastCacheUpdate = now;

      if (normalizedGender) return this.celebrityCache[normalizedGender] || [];
      return [...maleCelebrities, ...femaleCelebrities];

    } catch (error) {
      console.error('获取名人列表失败:', error);
      return [];
    }
  }

  async scanAllCelebritySources(gender) {
    const [publicCelebrities, customCelebrities] = await Promise.all([
      this.scanPublicCelebrityDirectory(gender),
      this.scanCustomCelebrityDirectory(gender)
    ]);

    return [...publicCelebrities, ...customCelebrities];
  }

  async resolvePublicCelebrityDir(gender) {
    const aliases = PUBLIC_CELEBRITY_DIR_ALIASES[gender] || [];

    for (const dirName of aliases) {
      const dirPath = path.join(PUBLIC_DIR, dirName);
      try {
        const stat = await fs.stat(dirPath);
        if (stat.isDirectory()) return { dirPath, dirName };
      } catch (_) {
        // ignore
      }
    }

    return null;
  }

  /**
   * 扫描 public/ 下的名人照片目录
   * @param {string} gender - 性别（male/female）
   * @returns {Promise<Array>} 名人列表
   */
  async scanPublicCelebrityDirectory(gender) {
    try {
      const resolved = await this.resolvePublicCelebrityDir(gender);
      if (!resolved) return [];

      const { dirPath, dirName } = resolved;
      const files = await fs.readdir(dirPath);

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const imageFiles = files
        .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
        .sort((a, b) => {
          const aNum = parseInt(path.parse(a).name, 10);
          const bNum = parseInt(path.parse(b).name, 10);

          if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;

          return a.localeCompare(b, 'zh-CN');
        });

      return imageFiles.map(file => {
        const rawName = path.parse(file).name;
        const nameParts = rawName.split('-');
        const displayNameFromFile = nameParts[0] || rawName;

        const mappedName = DEFAULT_PUBLIC_CELEBRITY_NAMES[gender]?.[rawName];
        const displayName = mappedName || displayNameFromFile;

        const description = nameParts[1] || (gender === 'female' ? '知名女星' : '知名男星');

        return {
          name: displayName,
          filename: file,
          description,
          gender,
          path: path.join(dirPath, file),
          photoUrl: `/${dirName}/${file}`,
          source: 'public'
        };
      });

    } catch (error) {
      console.error(`扫描 public/${gender} 目录失败:`, error);
      return [];
    }
  }

  /**
   * 扫描自定义名人照片目录（celebrities/ 下）
   * @param {string} gender - 性别（male/female）
   * @returns {Promise<Array>} 名人列表
   */
  async scanCustomCelebrityDirectory(gender) {
    try {
      const dir = gender === 'male' ? config.celebrities.maleDir : config.celebrities.femaleDir;

      await fs.mkdir(dir, { recursive: true });

      const files = await fs.readdir(dir);

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const imageFiles = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));

      return imageFiles.map(file => {
        const rawName = path.parse(file).name;
        const nameParts = rawName.split('-');
        const displayName = nameParts[0] || rawName;
        const description = nameParts[1] || '著名明星';

        return {
          name: displayName,
          filename: file,
          description,
          gender,
          path: path.join(dir, file),
          photoUrl: `/celebrities/${gender}/${file}`,
          source: 'custom'
        };
      });

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

      const filename = `${name}-${description || '著名明星'}.jpg`;
      const dir = gender === 'male' ? config.celebrities.maleDir : config.celebrities.femaleDir;

      const compressedBuffer = await ImageUtils.compressImage(imageBuffer, {
        width: 500,
        height: 500,
        quality: 85
      });

      const filePath = await ImageUtils.saveImage(compressedBuffer, filename, dir);

      this.celebrityCache = null;

      return {
        name,
        gender,
        filename,
        description: description || '著名明星',
        path: filePath,
        photoUrl: `/celebrities/${gender}/${filename}`
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
