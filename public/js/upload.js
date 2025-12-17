/**
 * 图片上传处理模块
 */
class UploadHandler {
  constructor() {
    // API基础URL
    this.apiBase = '/api';

    // 初始化拖拽上传功能
    this.initDragAndDrop();
  }

  /**
   * 初始化拖拽上传功能
   */
  initDragAndDrop() {
    // 禁用默认的拖拽行为
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleDroppedFiles(files);
      }
    });

    // 添加拖拽样式
    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
      document.body.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        document.body.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      document.body.classList.remove('drag-over');
    });
  }

  /**
   * 处理拖拽的文件
   */
  handleDroppedFiles(files) {
    const file = files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      window.webcamController.showError('请拖拽图片文件');
      return;
    }

    // 验证文件大小
    if (file.size > 10 * 1024 * 1024) {
      window.webcamController.showError('图片大小不能超过10MB');
      return;
    }

    // 读取并显示图片
    const reader = new FileReader();
    reader.onload = (e) => {
      window.webcamController.showPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * 上传Base64图片到服务器
   * @param {string} imageBase64 - Base64编码的图片
   * @returns {Promise<Object>} 上传结果
   */
  async uploadBase64Image(imageBase64) {
    try {
      const response = await fetch(`${this.apiBase}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageBase64
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '上传失败');
      }

      return result.data;

    } catch (error) {
      console.error('上传失败:', error);
      throw error;
    }
  }

  /**
   * 上传文件到服务器
   * @param {File} file - 文件对象
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${this.apiBase}/upload/file`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '上传失败');
      }

      return result.data;

    } catch (error) {
      console.error('上传失败:', error);
      throw error;
    }
  }

  /**
   * 压缩图片
   * @param {string} imageBase64 - Base64编码的图片
   * @param {Object} options - 压缩选项
   * @returns {Promise<string>} 压缩后的Base64
   */
  async compressImage(imageBase64, options = {}) {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算压缩后的尺寸
        let { width, height } = img;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为Base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = imageBase64;
    });
  }

  /**
   * 获取图片信息
   * @param {string} imageBase64 - Base64编码的图片
   * @returns {Promise<Object>} 图片信息
   */
  getImageInfo(imageBase64) {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          size: Math.round(imageBase64.length * 0.75) // 估算文件大小
        });
      };

      img.src = imageBase64;
    });
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * 创建缩略图
   * @param {string} imageBase64 - Base64编码的图片
   * @param {number} size - 缩略图尺寸
   * @returns {Promise<string>} 缩略图Base64
   */
  async createThumbnail(imageBase64, size = 150) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算缩略图尺寸（保持宽高比）
        let { width, height } = img;
        const ratio = Math.min(size / width, size / height);

        width *= ratio;
        height *= ratio;

        canvas.width = size;
        canvas.height = size;

        // 居中绘制
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, width, height);

        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailBase64);
      };

      img.onerror = () => {
        reject(new Error('创建缩略图失败'));
      };

      img.src = imageBase64;
    });
  }

  /**
   * 检测图片中的人脸（简单检查）
   * @param {string} imageBase64 - Base64编码的图片
   * @returns {Promise<Object>} 检测结果
   */
  async detectFace(imageBase64) {
    // 这里是简单的前端检查
    // 实际的人脸检测应该在服务器端进行
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        // 简单的尺寸检查
        const hasPotentialFace = img.width >= 200 && img.height >= 200;

        resolve({
          hasFace: hasPotentialFace,
          confidence: hasPotentialFace ? 0.7 : 0.3,
          message: hasPotentialFace ? '可能包含人脸' : '图片尺寸过小'
        });
      };

      img.onerror = () => {
        resolve({
          hasFace: false,
          confidence: 0,
          message: '图片加载失败'
        });
      };

      img.src = imageBase64;
    });
  }
}

// 初始化上传处理器
document.addEventListener('DOMContentLoaded', () => {
  window.uploadHandler = new UploadHandler();
});