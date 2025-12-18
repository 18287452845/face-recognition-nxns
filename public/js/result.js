/**
 * 结果页交互逻辑
 */
class ResultPage {
  constructor() {
    this.analysisData = null;
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    // 加载分析数据
    this.loadAnalysisData();

    // 初始化事件监听
    this.initEventListeners();

    // 更新时间戳
    this.updateTimestamp();

    // 开始动画
    this.startAnimations();
  }

  /**
   * 加载分析数据
   */
  loadAnalysisData() {
    try {
      // 从sessionStorage获取分析结果
      const storedData = sessionStorage.getItem('analysisResult');
      if (!storedData) {
        console.error('未找到分析数据');
        this.redirectToHome();
        return;
      }

      this.analysisData = JSON.parse(storedData);

      // 渲染数据到页面
      this.renderData();

      // 隐藏加载屏幕
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 2000);

    } catch (error) {
      console.error('加载分析数据失败:', error);
      this.redirectToHome();
    }
  }

  /**
   * 渲染数据到页面
   */
  renderData() {
    if (!this.analysisData) return;

    const { analysis, celebrity } = this.analysisData;

    // 基础信息
    this.setTextContent('gender', this.formatGender(analysis.gender));
    this.setTextContent('age', `${analysis.age}岁`);
    this.setTextContent('glasses', analysis.hasGlasses ? '有' : '无');
    this.setTextContent('smile', this.formatSmileLevel(analysis.smileLevel));

    // AI评价
    this.animateScore(analysis.beautyScore);
    this.typewriterEffect('temperament', analysis.temperament, 50);
    
    // 详细评价
    if (analysis.evaluation) {
      this.renderEvaluation(analysis.evaluation);
    }
    
    // 五官分析
    if (analysis.facialFeatures) {
      this.renderFacialFeatures(analysis.facialFeatures);
    }

    // 健康分析
    this.renderHealthAnalysis(analysis.healthAnalysis);

    // 明星匹配
    this.renderCelebrityMatch(celebrity);

    // 用户照片（从缓存中获取或使用占位图）
    this.renderUserPhoto();
  }

  /**
   * 渲染用户照片
   */
  renderUserPhoto() {
    const userPhotoEl = document.getElementById('userPhoto');

    // 尝试从sessionStorage获取照片 (优先)
    const storedPhoto = sessionStorage.getItem('userPhoto');

    if (storedPhoto) {
      userPhotoEl.src = storedPhoto;
    } else if (window.opener && window.opener.webcamController && window.opener.webcamController.currentImageData) {
      // 兼容旧方式
      userPhotoEl.src = window.opener.webcamController.currentImageData;
    } else {
      // 使用占位图
      userPhotoEl.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="250" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#0a0a1a"/>
          <text x="50%" y="50%" fill="#00f7ff" text-anchor="middle" font-size="16">用户照片</text>
        </svg>
      `);
    }
  }

  /**
   * 渲染健康分析
   */
  renderHealthAnalysis(healthAnalysis) {
    if (!healthAnalysis) return;

    // 气色
    const complexionEl = document.querySelector('.complexion-value');
    if (complexionEl) {
      complexionEl.textContent = healthAnalysis.complexion || '未知';
    }

    // 建议
    const suggestionsEl = document.getElementById('suggestions');
    if (suggestionsEl && healthAnalysis.suggestions) {
      suggestionsEl.innerHTML = '';
      healthAnalysis.suggestions.forEach((suggestion, index) => {
        setTimeout(() => {
          const item = document.createElement('div');
          item.className = 'suggestion-item';
          item.textContent = `• ${suggestion}`;
          item.style.opacity = '0';
          suggestionsEl.appendChild(item);

          // 淡入动画
          setTimeout(() => {
            item.style.transition = 'opacity 0.5s ease';
            item.style.opacity = '1';
          }, 50);
        }, index * 200);
      });
    }
  }

  /**
   * 渲染评价
   */
  renderEvaluation(evaluation) {
    const evaluationEl = document.getElementById('evaluation');
    if (evaluationEl) {
      const textEl = evaluationEl.querySelector('.evaluation-text');
      if (textEl) {
        // 直接在段落元素上实现打字机效果
        const safeText = typeof evaluation === 'string' ? evaluation : String(evaluation ?? '');
        textEl.textContent = '';
        let index = 0;
        const type = () => {
          if (index < safeText.length) {
            textEl.textContent += safeText[index];
            index++;
            setTimeout(type, 30);
          }
        };
        setTimeout(type, 1000);
      }
    }
  }

  /**
   * 渲染五官分析
   */
  renderFacialFeatures(facialFeatures) {
    const featuresEl = document.getElementById('facialFeatures');
    if (featuresEl) {
      const textEl = featuresEl.querySelector('.features-text');
      if (textEl) {
        // 直接在段落元素上实现打字机效果
        const safeText = typeof facialFeatures === 'string' ? facialFeatures : String(facialFeatures ?? '');
        textEl.textContent = '';
        let index = 0;
        const type = () => {
          if (index < safeText.length) {
            textEl.textContent += safeText[index];
            index++;
            setTimeout(type, 30);
          }
        };
        setTimeout(type, 1200);
      }
    }
  }

  /**
   * 渲染明星匹配
   */
  renderCelebrityMatch(celebrity) {
    if (!celebrity) return;

    // 明星信息
    this.setTextContent('celebrityName', celebrity.name);
    this.setTextContent('similarity', `${celebrity.similarity}%`);

    const celebrityPhotoNameEl = document.getElementById('celebrityPhotoName');
    if (celebrityPhotoNameEl) {
      celebrityPhotoNameEl.textContent = celebrity.name || '';
    }

    // 匹配原因
    this.typewriterEffect('matchReason', celebrity.matchReason, 50);

    // 明星照片（确保一定有图：若加载失败则回退到 SVG 占位图）
    const celebrityPhotoEl = document.getElementById('celebrityPhoto');
    if (!celebrityPhotoEl) return;

    const setFallback = () => {
      celebrityPhotoEl.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="250" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#0a0a1a"/>
          <text x="50%" y="50%" fill="#00f7ff" text-anchor="middle" font-size="16">${celebrity.name || '明星'}</text>
        </svg>
      `);
    };

    if (celebrity.photo) {
      celebrityPhotoEl.src = celebrity.photo;
    } else {
      setFallback();
    }

    celebrityPhotoEl.onerror = () => {
      setFallback();
    };
  }

  /**
   * 初始化事件监听
   */
  initEventListeners() {
    // 重新测试按钮
    const retakeBtn = document.getElementById('retakeBtn');
    retakeBtn.addEventListener('click', () => {
      this.redirectToHome();
    });

    // 分享按钮
    const shareBtn = document.getElementById('shareBtn');
    shareBtn.addEventListener('click', () => {
      this.shareResults();
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.redirectToHome();
      } else if (e.key === 's' || e.key === 'S') {
        this.shareResults();
      }
    });
  }

  /**
   * 更新时间戳
   */
  updateTimestamp() {
    const timestampEl = document.getElementById('timestamp');
    if (timestampEl) {
      const now = new Date();
      const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
      timestampEl.textContent = `[${timestamp}]`;
    }
  }

  /**
   * 开始动画
   */
  startAnimations() {
    // 添加HUD扫描效果
    this.addScanEffects();

    // 数据加载动画
    this.dataLoadingAnimations();
  }

  /**
   * 添加扫描效果
   */
  addScanEffects() {
    const scanLines = document.querySelectorAll('.scan-line');
    scanLines.forEach((line, index) => {
      line.style.animationDelay = `${index * 0.5}s`;
    });
  }

  /**
   * 数据加载动画
   */
  dataLoadingAnimations() {
    const dataItems = document.querySelectorAll('.data-item');
    dataItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';

      setTimeout(() => {
        item.style.transition = 'all 0.5s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 1000 + index * 100);
    });
  }

  /**
   * 隐藏加载屏幕
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.transition = 'opacity 0.5s ease';
      loadingScreen.style.opacity = '0';

      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  /**
   * 分数动画
   */
  animateScore(targetScore) {
    const canvas = document.getElementById('scoreCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 50;

    let currentScore = 0;
    const animationDuration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // 使用缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      currentScore = Math.floor(targetScore * easeOutQuart);

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景圆
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0, 247, 255, 0.2)';
      ctx.lineWidth = 8;
      ctx.stroke();

      // 绘制进度圆
      const angle = (currentScore / 100) * 2 * Math.PI - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);

      // 根据分数选择颜色
      if (currentScore >= 80) {
        ctx.strokeStyle = '#00ff88';
      } else if (currentScore >= 60) {
        ctx.strokeStyle = '#00f7ff';
      } else {
        ctx.strokeStyle = '#ff6b00';
      }

      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 更新分数文本
      const scoreText = document.getElementById('beautyScore');
      if (scoreText) {
        scoreText.textContent = currentScore;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * 打字机效果
   */
  typewriterEffect(elementId, text, speed = 50) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const target = container.querySelector('span') || container;
    const safeText = typeof text === 'string' ? text : String(text ?? '');

    target.textContent = '';
    let index = 0;

    const type = () => {
      if (index < safeText.length) {
        target.textContent += safeText[index];
        index++;
        setTimeout(type, speed);
      }
    };

    setTimeout(type, 1000);
  }

  /**
   * 设置文本内容
   */
  setTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * 格式化性别
   */
  formatGender(gender) {
    const genderMap = {
      '男': '男性',
      '女': '女性'
    };
    return genderMap[gender] || gender;
  }

  /**
   * 格式化笑容等级
   */
  formatSmileLevel(smileLevel) {
    const smileMap = {
      '无笑容': '无',
      '微笑': '微笑',
      '开心大笑': '大笑'
    };
    return smileMap[smileLevel] || smileLevel;
  }

  /**
   * 分享结果
   */
  shareResults() {
    const shareData = {
      title: 'NXNS 人脸识别结果',
      text: `我在 NXNS 进行了人脸识别，颜值评分：${this.analysisData.analysis.beautyScore}分，最像的明星是${this.analysisData.celebrity.name}！`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          console.log('分享成功');
        })
        .catch((error) => {
          console.log('分享失败:', error);
          this.fallbackShare(shareData);
        });
    } else {
      this.fallbackShare(shareData);
    }
  }

  /**
   * 备用分享方法
   */
  fallbackShare(shareData) {
    // 复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareData.text + ' ' + shareData.url)
        .then(() => {
          this.showNotification('分享链接已复制到剪贴板');
        })
        .catch(() => {
          this.showNotification('复制失败，请手动复制分享内容');
        });
    }
  }

  /**
   * 显示通知
   */
  showNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 247, 255, 0.9);
      color: white;
      padding: 15px 30px;
      border-radius: 25px;
      font-size: 14px;
      z-index: 10000;
      animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒后移除
    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * 重定向到首页
   */
  redirectToHome() {
    window.location.href = '/scan';
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.resultPage = new ResultPage();
});

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);