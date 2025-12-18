/**
 * 摄像头控制模块
 */
class WebcamController {
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.stream = null;
    this.currentCamera = 'user'; // 'user' 前置, 'environment' 后置
    this.devices = [];
    this.currentDeviceIndex = 0;

    // DOM 元素
    this.captureBtn = document.getElementById('captureBtn');
    this.switchCameraBtn = document.getElementById('switchCameraBtn');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.fileInput = document.getElementById('fileInput');
    this.previewSection = document.getElementById('previewSection');
    this.previewImage = document.getElementById('previewImage');
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.retakeBtn = document.getElementById('retakeBtn');
    this.cameraStatus = document.getElementById('cameraStatus');
    this.statusText = document.getElementById('statusText');
    
    // Loading elements
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');
    this.loadingBar = document.getElementById('loadingBar');
    this.loadingPercent = document.getElementById('loadingPercent');
    this.systemLogs = document.getElementById('systemLogs');
    this.loadingInterval = null;

    this.errorToast = document.getElementById('errorToast');
    this.errorMessage = document.getElementById('errorMessage');
    this.errorClose = document.getElementById('errorClose');
    this.permissionModal = document.getElementById('permissionModal');
    this.allowCameraBtn = document.getElementById('allowCameraBtn');
    this.denyCameraBtn = document.getElementById('denyCameraBtn');
    this.countdown = document.getElementById('countdown');

    // 初始化事件监听
    this.initEventListeners();

    // 检测是否移动设备
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 自动初始化摄像头
    this.init();
  }

  // Helper for i18n
  t(key, defaultText) {
    return (window.i18n && window.i18n.t(key)) || defaultText;
  }

  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 拍照按钮
    this.captureBtn.addEventListener('click', () => {
      this.startCountdownAndCapture();
    });

    // 切换摄像头按钮
    this.switchCameraBtn.addEventListener('click', () => {
      this.switchCamera();
    });

    // 上传按钮
    this.uploadBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    // 文件选择
    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });

    // 分析按钮
    this.analyzeBtn.addEventListener('click', () => {
      this.analyzeImage();
    });

    // 重新拍摄按钮
    this.retakeBtn.addEventListener('click', () => {
      this.retake();
    });

    // 错误提示关闭
    this.errorClose.addEventListener('click', () => {
      this.hideError();
    });

    // 权限请求
    this.allowCameraBtn.addEventListener('click', () => {
      this.hidePermissionModal();
      this.startCamera();
    });

    this.denyCameraBtn.addEventListener('click', () => {
      this.hidePermissionModal();
      this.fileInput.click();
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.adjustVideoSize();
    });
  }

  /**
   * 初始化摄像头
   */
  async init() {
    try {
      // 检查浏览器是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(this.t('browser_no_cam', '您的浏览器不支持摄像头功能'));
      }

      // 获取可用的摄像头设备
      await this.getCameraDevices();

      // 检查摄像头权限状态
      const hasPermission = await this.checkCameraPermission();
      
      if (hasPermission) {
        // 如果已有权限，直接启动摄像头
        await this.startCamera();
      } else {
        // 如果没有权限，显示权限请求模态框
        this.showPermissionModal();
      }

    } catch (error) {
      console.error('初始化摄像头失败:', error);
      this.showError(this.t('cam_access_error', '无法访问摄像头，请检查权限设置'));
    }
  }

  /**
   * 获取可用的摄像头设备
   */
  async getCameraDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');

      // 如果有多个摄像头，显示切换按钮
      if (this.devices.length > 1 && this.isMobile) {
        this.switchCameraBtn.style.display = 'inline-flex';
      }
    } catch (error) {
      console.error('获取摄像头设备失败:', error);
    }
  }

  /**
   * 检查摄像头权限状态
   */
  async checkCameraPermission() {
    try {
      // 尝试使用 Permissions API 检查权限状态
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        return permissionStatus.state === 'granted';
      }
      
      // 如果 Permissions API 不可用，返回 false 以显示权限请求
      return false;
    } catch (error) {
      // 某些浏览器可能不支持 camera 权限查询，返回 false
      console.log('无法查询摄像头权限状态:', error);
      return false;
    }
  }

  /**
   * 启动摄像头
   */
  async startCamera(deviceId = null) {
    try {
      this.showStatus(this.t('starting_cam', '正在启动摄像头...'));

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
            facingMode: this.currentCamera,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
      };

      // 如果已有流，先停止
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      // 等待视频加载
      this.video.onloadedmetadata = () => {
        this.adjustVideoSize();
        this.hideStatus();
        this.captureBtn.disabled = false;
        this.captureBtn.classList.remove('disabled');
      };

    } catch (error) {
      console.error('启动摄像头失败:', error);
      this.showStatus(this.t('cam_start_fail', '摄像头启动失败，请检查权限'));
      this.captureBtn.disabled = true;
      this.captureBtn.classList.add('disabled');
    }
  }

  /**
   * 切换摄像头
   */
  async switchCamera() {
    if (this.devices.length <= 1) return;

    this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.devices.length;
    const deviceId = this.devices[this.currentDeviceIndex].deviceId;

    await this.startCamera(deviceId);
  }

  /**
   * 调整视频尺寸
   */
  adjustVideoSize() {
    const videoRatio = this.video.videoWidth / this.video.videoHeight;
    const containerRatio = this.video.parentElement.clientWidth / this.video.parentElement.clientHeight;

    if (videoRatio > containerRatio) {
      this.video.style.width = '100%';
      this.video.style.height = 'auto';
    } else {
      this.video.style.width = 'auto';
      this.video.style.height = '100%';
    }
  }

  /**
   * 开始倒计时并拍照
   */
  async startCountdownAndCapture() {
    this.captureBtn.disabled = true;

    // 显示倒计时
    this.countdown.style.display = 'block';
    this.countdown.textContent = '3';

    for (let i = 3; i > 0; i--) {
      this.countdown.textContent = i;
      this.countdown.style.transform = 'scale(1.5)';
      await this.sleep(200);
      this.countdown.style.transform = 'scale(1)';
      await this.sleep(800);
    }

    this.countdown.style.display = 'none';
    this.capture();
  }

  /**
   * 拍照
   */
  capture() {
    // 设置canvas尺寸
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    // 绘制视频帧到canvas
    const context = this.canvas.getContext('2d');
    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // 转换为图片
    const imageData = this.canvas.toDataURL('image/jpeg', 0.9);

    // 显示预览
    this.showPreview(imageData);

    // 重新启用拍照按钮
    this.captureBtn.disabled = false;
  }

  /**
   * 显示预览
   */
  showPreview(imageData) {
    this.previewImage.src = imageData;
    this.video.parentElement.parentElement.style.display = 'none';
    this.previewSection.style.display = 'block';

    // 保存图片数据供分析使用
    this.currentImageData = imageData;
  }

  /**
   * 重新拍摄
   */
  retake() {
    this.video.parentElement.parentElement.style.display = 'block';
    this.previewSection.style.display = 'none';
    this.currentImageData = null;
  }

  /**
   * 分析图片
   */
  async analyzeImage() {
    if (!this.currentImageData) {
      this.showError(this.t('capture_first', '请先拍照或上传照片'));
      return;
    }

    // 启动赛博朋克加载序列
    this.startLoadingSequence();

    try {
      const lang = window.i18n ? window.i18n.getLanguage() : 'zh-CN';
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: this.currentImageData,
          lang: lang
        })
      });

      const result = await response.json();

      if (result.success) {
        // 完成加载条
        this.completeLoading();
        
        // 延迟跳转以展示完成状态
        await this.sleep(800);

        // 将结果存储到sessionStorage供结果页使用
        sessionStorage.setItem('analysisResult', JSON.stringify(result.data));
        
        // 保存用户照片到sessionStorage (修复照片不显示的问题)
        if (this.currentImageData) {
          sessionStorage.setItem('userPhoto', this.currentImageData);
        }

        // 跳转到结果页
        window.location.href = '/result';
      } else {
        this.hideLoading();
        this.showError(result.message || this.t('analysis_failed', '分析失败'));
      }
    } catch (error) {
      this.hideLoading();
      console.error('分析请求失败:', error);
      this.showError(this.t('network_error', '网络错误，请稍后重试'));
    }
  }

  /**
   * 启动加载序列
   */
  startLoadingSequence() {
    this.loadingOverlay.style.display = 'flex';
    this.systemLogs.innerHTML = ''; // 清空日志
    this.addSystemLog('> 初始化上传序列...');
    
    let progress = 0;
    const stages = [
      { p: 15, text: '正在加密生物识别数据...', log: '> 加密数据包 [SHA-512]...' },
      { p: 30, text: '连接神经网络...', log: '> 建立安全上行链路...' },
      { p: 45, text: '传输图像数据...', log: '> 上传图像流...' },
      { p: 60, text: '分析面部特征...', log: '> 运行识别算法...' },
      { p: 75, text: '搜索全球数据库...', log: '> 查询名人记录...' },
      { p: 85, text: '生成最终结果...', log: '> 编译分析报告...' },
      { p: 90, text: '准备显示界面...', log: '> 渲染 HUD 界面...' }
    ];

    let currentStage = 0;

    // 清除旧的 interval
    if (this.loadingInterval) clearInterval(this.loadingInterval);

    this.loadingInterval = setInterval(() => {
      // 缓慢增加进度
      if (progress < 95) {
        progress += Math.random() * 2;
        if (progress > 95) progress = 95;
      }

      // 更新进度条 UI
      this.updateLoadingUI(progress);

      // 检查是否达到下一阶段
      if (currentStage < stages.length && progress >= stages[currentStage].p) {
        const stage = stages[currentStage];
        this.loadingText.textContent = stage.text;
        this.loadingText.setAttribute('data-text', stage.text); // For glitch effect
        this.addSystemLog(stage.log);
        currentStage++;
      }
    }, 100);
  }

  /**
   * 更新加载 UI
   */
  updateLoadingUI(percent) {
    const p = Math.floor(percent);
    if (this.loadingBar) this.loadingBar.style.width = `${p}%`;
    if (this.loadingPercent) this.loadingPercent.textContent = `${p}%`;
  }

  /**
   * 添加系统日志
   */
  addSystemLog(message) {
    if (!this.systemLogs) return;
    
    const div = document.createElement('div');
    div.className = 'log-line';
    div.textContent = message;
    this.systemLogs.appendChild(div);
    
    // 自动滚动到底部
    this.systemLogs.scrollTop = this.systemLogs.scrollHeight;
  }

  /**
   * 完成加载
   */
  completeLoading() {
    if (this.loadingInterval) clearInterval(this.loadingInterval);
    this.updateLoadingUI(100);
    this.loadingText.textContent = '分析完成';
    this.loadingText.setAttribute('data-text', '分析完成');
    this.addSystemLog('> 成功。正在重定向...');
  }

  /**
   * 隐藏加载动画
   */
  hideLoading() {
    if (this.loadingInterval) clearInterval(this.loadingInterval);
    this.loadingOverlay.style.display = 'none';
  }

  /**
   * 处理文件选择
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      this.showError(this.t('select_image', '请选择图片文件'));
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      this.showError(this.t('image_too_large', '图片大小不能超过10MB'));
      return;
    }

    // 读取文件
    const reader = new FileReader();
    reader.onload = (e) => {
      this.showPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * 显示状态信息
   */
  showStatus(message) {
    this.statusText.textContent = message;
    this.cameraStatus.style.display = 'flex';
  }

  /**
   * 隐藏状态信息
   */
  hideStatus() {
    this.cameraStatus.style.display = 'none';
  }

  /**
   * 显示加载动画 (Deprecated: Use startLoadingSequence)
   */
  showLoading(text) {
    // Keep for backward compatibility if needed
    this.startLoadingSequence();
  }

  /**
   * 显示错误提示
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorToast.style.display = 'block';

    // 3秒后自动隐藏
    setTimeout(() => {
      this.hideError();
    }, 3000);
  }

  /**
   * 隐藏错误提示
   */
  hideError() {
    this.errorToast.style.display = 'none';
  }

  /**
   * 显示权限请求模态框
   */
  showPermissionModal() {
    this.permissionModal.style.display = 'flex';
  }

  /**
   * 隐藏权限请求模态框
   */
  hidePermissionModal() {
    this.permissionModal.style.display = 'none';
  }

  /**
   * 休眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 页面加载完成后初始化摄像头控制器
document.addEventListener('DOMContentLoaded', () => {
  window.webcamController = new WebcamController();
});
