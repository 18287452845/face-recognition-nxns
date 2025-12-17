require('dotenv').config();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 阿里云百炼API配置
  dashscope: {
    apiKey: process.env.ALIYUN_API_KEY,
    model: process.env.ALIYUN_MODEL || 'qwen-vl-max',
    baseUrl: process.env.ALIYUN_BASE_URL || 'https://dashscope.aliyuncs.com',
    endpoint: process.env.ALIYUN_ENDPOINT || '/compatible-mode/v1/chat/completions'
  },

  // 文件存储配置
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },

  // 分析配置
  analysis: {
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT) || 30000 // 30秒
  },

  // 名人照片目录
  celebrities: {
    maleDir: './celebrities/male',
    femaleDir: './celebrities/female'
  }
};