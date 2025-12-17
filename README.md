# NXNS 云匹配识别系统

一个基于纯 Node.js 的智能人脸识别与分析系统，通过摄像头捕捉用户人脸，利用阿里云百炼大模型进行多维度分析，匹配相似名人，并提供包含健康建议的趣味报告。

## 功能特点

- 📸 **摄像头实时捕捉**：支持前后摄像头切换，拍照倒计时动画
- 🤖 **AI 智能分析**：基于阿里云通义千问 VL 视觉模型进行人脸属性分析
- ⭐ **名人匹配**：根据分析结果匹配最相似的明星
- 💊 **健康建议**：基于分析结果提供个性化健康建议
- 🎨 **科幻 HUD 界面**：结果展示采用炫酷的科幻 HUD 风格
- 📱 **响应式设计**：完美适配桌面和移动设备

## 技术栈

- **后端**：Node.js (v18+) + Express.js
- **前端**：原生 HTML5 + CSS3 + JavaScript
- **AI 服务**：阿里云百炼大模型 API (qwen-vl-max)
- **图像处理**：Sharp
- **文件上传**：Multer
- **其他依赖**：axios, cors, dotenv, uuid

## 快速开始

### 1. 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- 阿里云百炼 API Key

### 2. 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-repo/nxns-face-recognition.git
cd nxns-face-recognition

# 安装依赖
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 阿里云百炼API配置
ALIYUN_API_KEY=your_dashscope_api_key
ALIYUN_BASE_URL=https://dashscope.aliyuncs.com
ALIYUN_MODEL=qwen-vl-max

# 文件存储配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 其他配置
ANALYSIS_TIMEOUT=30000
```

### 4. 准备名人照片库

将名人照片放入对应目录：

```
celebrities/
├── male/      # 男性明星照片
├── female/    # 女性明星照片
```

照片命名格式：`明星姓名-描述.jpg`（例如：`周杰伦-华语天王.jpg`）

### 5. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器启动后访问：http://localhost:3000

## API 接口文档

### 上传照片

**POST** `/api/upload`

请求体：
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

响应：
```json
{
  "success": true,
  "data": {
    "imageId": "uuid-xxx",
    "imagePath": "/uploads/uuid-xxx.jpg"
  }
}
```

### 分析人脸

**POST** `/api/analyze`

请求体：
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

响应：
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "analysis": {
      "gender": "男",
      "age": 28,
      "hasGlasses": false,
      "smileLevel": "微笑",
      "beautyScore": 85,
      "temperament": "眼神深邃，气质优雅",
      "healthAnalysis": {
        "complexion": "气色红润",
        "suggestions": ["保持规律作息", "多喝水", "适当户外运动"]
      },
      "healthAdvice": ["建议1", "建议2", "建议3"]
    },
    "celebrity": {
      "name": "周杰伦",
      "photo": "/celebrities/male/jay_chou.jpg",
      "similarity": 78,
      "description": "著名明星",
      "matchReason": "你们都有深邃的眼神和艺术家气质"
    }
  }
}
```

### 其他接口

- `GET /api/health` - 健康检查
- `GET /api/celebrities` - 获取名人列表
- `GET /api/history` - 获取分析历史
- `POST /api/cleanup` - 清理临时文件

## 项目结构

```
nxns-face-recognition/
├── server/                    # 后端服务
│   ├── app.js                # Express 主入口
│   ├── config/
│   │   └── index.js          # 配置文件
│   ├── controllers/          # 控制器
│   ├── middleware/           # 中间件
│   ├── routes/              # 路由定义
│   ├── services/            # 业务服务
│   └── utils/               # 工具函数
├── public/                  # 前端文件
│   ├── index.html          # 首页
│   ├── result.html         # 结果页
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript 文件
│   └── assets/            # 静态资源
├── celebrities/            # 名人照片库
│   ├── male/              # 男性明星
│   └── female/            # 女性明星
├── uploads/               # 用户上传目录
└── package.json
```

## 开发指南

### 添加新功能

1. 在 `server/services/` 中添加业务逻辑
2. 在 `server/controllers/` 中添加控制器
3. 在 `server/routes/api.js` 中添加路由
4. 更新前端页面和 JavaScript

### 自定义 AI 提示词

编辑 `server/services/aiService.js` 中的 `analyzeFace` 方法，修改 `prompt` 变量。

### 修改名人匹配算法

编辑 `server/services/celebrityService.js` 中的 `matchCelebrity` 方法。

## 部署指南

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/app.js --name nxns-face-recognition

# 查看日志
pm2 logs nxns-face-recognition

# 重启应用
pm2 restart nxns-face-recognition
```

### 使用 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t nxns-face-recognition .
docker run -d -p 3000:3000 --env-file .env nxns-face-recognition
```

## 常见问题

### 1. 摄像头无法访问

- 确保使用 HTTPS 访问（或 localhost）
- 检查浏览器权限设置
- 确保没有其他应用占用摄像头

### 2. API 调用失败

- 检查 API Key 是否正确
- 确认网络连接正常
- 查看服务器日志获取详细错误信息

### 3. 名人匹配不准确

- 增加名人照片数量
- 确保照片质量清晰
- 调整匹配算法参数

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志

### v1.0.0 (2024-01-01)

- ✨ 初始版本发布
- 📸 实现摄像头拍照功能
- 🤖 集成阿里云百炼 AI 分析
- ⭐ 添加名人匹配功能
- 🎨 设计科幻 HUD 风格界面
- 📱 支持响应式布局

## 联系我们

- 项目主页：https://github.com/your-repo/nxns-face-recognition
- 问题反馈：https://github.com/your-repo/nxns-face-recognition/issues
- 邮箱：contact@nxns.com

---

**NXNS Team** - 用科技连接未来