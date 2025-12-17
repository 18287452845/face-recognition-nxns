const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const ImageUtils = require('../utils/imageUtils');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * 配置multer存储
 */
const storage = multer.memoryStorage();

/**
 * 文件过滤器
 */
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG 和 WebP 格式的图片'), false);
  }
};

/**
 * 创建multer实例
 */
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize
  },
  fileFilter
});

/**
 * 处理Base64图片上传
 */
const uploadBase64Image = catchAsync(async (req, res) => {
  const { image } = req.body;

  if (!image) {
    const response = error('请提供图片数据', 400);
    return res.status(400).json(response);
  }

  try {
    // 验证Base64格式
    if (!/^data:image\/\w+;base64,/.test(image)) {
      const response = error('图片格式无效', 400);
      return res.status(400).json(response);
    }

    // 转换为Buffer
    const imageBuffer = ImageUtils.base64ToBuffer(image);

    // 生成唯一文件名
    const imageId = uuidv4();
    const mimeType = ImageUtils.getBase64MimeType(image);
    const extension = ImageUtils.getExtensionFromMimeType(mimeType);
    const filename = `${imageId}${extension}`;

    // 压缩图片
    const compressedBuffer = await ImageUtils.compressImage(imageBuffer, {
      width: 800,
      height: 600,
      quality: 80
    });

    // 保存图片
    const imagePath = await ImageUtils.saveImage(
      compressedBuffer,
      filename,
      config.upload.directory
    );

    // 返回成功响应
    const response = success({
      imageId,
      imagePath: `/${path.relative(process.cwd(), imagePath).replace(/\\/g, '/')}`,
      filename
    }, '图片上传成功');

    res.json(response);

  } catch (err) {
    console.error('图片上传处理失败:', err);
    const response = error('图片处理失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 处理multipart/form-data图片上传
 */
const handleImageUpload = catchAsync(async (req, res) => {
  if (!req.file) {
    const response = error('请上传图片文件', 400);
    return res.status(400).json(response);
  }

  try {
    // 生成唯一文件名
    const imageId = uuidv4();
    const extension = ImageUtils.getExtensionFromMimeType(req.file.mimetype);
    const filename = `${imageId}${extension}`;

    // 压缩图片
    const compressedBuffer = await ImageUtils.compressImage(req.file.buffer, {
      width: 800,
      height: 600,
      quality: 80
    });

    // 保存图片
    const imagePath = await ImageUtils.saveImage(
      compressedBuffer,
      filename,
      config.upload.directory
    );

    // 返回成功响应
    const response = success({
      imageId,
      imagePath: `/${path.relative(process.cwd(), imagePath).replace(/\\/g, '/')}`,
      filename,
      originalName: req.file.originalname,
      size: compressedBuffer.length
    }, '图片上传成功');

    res.json(response);

  } catch (err) {
    console.error('图片上传处理失败:', err);
    const response = error('图片处理失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 获取上传的图片
 */
const getUploadedImage = catchAsync(async (req, res) => {
  const { imageId } = req.params;
  const filename = `${imageId}.jpg`;
  const imagePath = path.join(config.upload.directory, filename);

  try {
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(imagePath)) {
      const response = error('图片不存在', 404);
      return res.status(404).json(response);
    }

    // 发送文件
    res.sendFile(imagePath);

  } catch (err) {
    console.error('获取图片失败:', err);
    const response = error('获取图片失败', 500);
    res.status(500).json(response);
  }
});

/**
 * 删除上传的图片
 */
const deleteUploadedImage = catchAsync(async (req, res) => {
  const { imageId } = req.params;

  // 尝试多种可能的扩展名
  const extensions = ['.jpg', '.png', '.webp'];
  let deleted = false;

  for (const ext of extensions) {
    const filename = `${imageId}${ext}`;
    const imagePath = path.join(config.upload.directory, filename);

    try {
      await ImageUtils.deleteFile(imagePath);
      deleted = true;
      break;
    } catch (error) {
      // 继续尝试下一个扩展名
    }
  }

  if (deleted) {
    const response = success(null, '图片删除成功');
    res.json(response);
  } else {
    const response = error('图片不存在或删除失败', 404);
    res.status(404).json(response);
  }
});

module.exports = {
  uploadBase64Image,
  handleImageUpload,
  getUploadedImage,
  deleteUploadedImage,
  upload // 导出multer实例供路由使用
};