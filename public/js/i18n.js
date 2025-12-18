const translations = {
  'zh-CN': {
    // Global
    'back': '返回',
    
    // Index Page
    'system_title': 'NXNS 云匹配识别系统',
    'subtitle': 'Neural Network Identification System v2.0',
    'initializing': '系统初始化中...',
    'capture_scan': '扫描人脸',
    'switch_cam': '切换镜头',
    'upload_data': '上传照片',
    'initiate_analysis': '开始分析',
    'discard': '重新拍摄',
    'processing': '正在处理生物特征...',
    'camera_access_required': '需要摄像头权限',
    'camera_desc': '生物特征扫描仪需要光学传感器访问权限以进行识别。',
    'grant_access': '授予权限',
    'manual_upload': '手动上传',
    
    // Result Page
    'analysis_result_title': 'NXNS 分析结果 - 云匹配识别系统',
    'analysis_complete': '分析完成',
    'your_photo': '您的照片',
    'matched_celeb': '匹配明星',
    'basic_info': '基础信息',
    'gender_label': '性别',
    'age_label': '年龄',
    'glasses_label': '眼镜',
    'smile_label': '笑容',
    'face_shape_label': '脸型',
    'temperament_label': '气质',
    'skin_tone_label': '肤色',
    'charm_level_label': '魅力',
    'ai_evaluation': 'AI 智能评价',
    'beauty_score': '颜值评分',
    'eval_loading': '评价加载中...',
    'features_loading': '五官分析加载中...',
    'health_analysis': '健康分析',
    'complexion_label': '气色：',
    'suggestions_loading': '• 建议加载中...',
    'star_match': '明星匹配',
    'most_like_label': '最像的明星：',
    'similarity_label': '相似度：',
    'reason_loading': '匹配原因加载中...',
    'retake_test': '重新测试',
    'share_result': '分享结果',
    'loading_data': '正在加载数据...',
    
    // Start Page
    'start_page_title': 'NXNS 启动界面 // SYSTEM BOOT',
    'boot_sub': '云匹配识别系统 · Neural Network Identification System',
    'booting': 'BOOTING...',
    'init_sequence': 'INITIALIZATION SEQUENCE',
    'enter_system': '进入系统',
    'skip_anim': '跳过动画',
    'hint': '提示：点击任意按钮将触发触感反馈（如设备支持）。',
    'secure_channel': 'SECURE CHANNEL: ENABLED',
    
    // JS Messages
    'browser_no_cam': '您的浏览器不支持摄像头功能',
    'cam_init_fail': '初始化摄像头失败',
    'cam_access_error': '无法访问摄像头，请检查权限设置',
    'starting_cam': '正在启动摄像头...',
    'cam_start_fail': '摄像头启动失败，请检查权限',
    'capture_first': '请先拍照或上传照片',
    'analyzing': '正在分析人脸特征...',
    'analysis_failed': '分析失败',
    'network_error': '网络错误，请稍后重试',
    'select_image': '请选择图片文件',
    'image_too_large': '图片大小不能超过10MB',
    
    // Boot Sequence
    'boot_line_1': '正在初始化安全通道... OK',
    'boot_line_2': '加载生物识别模块... OK',
    'boot_line_3': '校准光学传感器... OK',
    'boot_line_4': '同步明星数据库... OK',
    'boot_line_5': '准备 HUD 渲染器... OK',
    'boot_line_6': '建立 AI 上行链路... OK',
    'boot_line_7': '系统就绪。等待用户输入。',
    'status_online': '系统在线'
  },
  'en': {
    // Global
    'back': 'BACK',
    
    // Index Page
    'system_title': 'NXNS ACCESS TERMINAL',
    'subtitle': 'Neural Network Identification System v2.0',
    'initializing': 'SYSTEM INITIALIZING...',
    'capture_scan': 'CAPTURE SCAN',
    'switch_cam': 'SWITCH CAM',
    'upload_data': 'UPLOAD DATA',
    'initiate_analysis': 'INITIATE ANALYSIS',
    'discard': 'DISCARD',
    'processing': 'PROCESSING BIOMETRICS...',
    'camera_access_required': 'CAMERA ACCESS REQUIRED',
    'camera_desc': 'Biometric scanner requires optical sensor access for identification.',
    'grant_access': 'GRANT ACCESS',
    'manual_upload': 'MANUAL UPLOAD',
    
    // Result Page
    'analysis_result_title': 'NXNS Analysis Result - Cloud Match',
    'analysis_complete': 'ANALYSIS COMPLETE',
    'your_photo': 'SUBJECT',
    'matched_celeb': 'MATCHED TARGET',
    'basic_info': 'BASIC INFO',
    'gender_label': 'GENDER',
    'age_label': 'AGE',
    'glasses_label': 'GLASSES',
    'smile_label': 'SMILE',
    'face_shape_label': 'FACE SHAPE',
    'temperament_label': 'TEMPERAMENT',
    'skin_tone_label': 'SKIN TONE',
    'charm_level_label': 'CHARM',
    'ai_evaluation': 'AI EVALUATION',
    'beauty_score': 'SCORE',
    'eval_loading': 'Loading evaluation...',
    'features_loading': 'Loading features...',
    'health_analysis': 'HEALTH ANALYSIS',
    'complexion_label': 'Complexion:',
    'suggestions_loading': '• Loading suggestions...',
    'star_match': 'STAR MATCH',
    'most_like_label': 'Look-alike:',
    'similarity_label': 'Similarity:',
    'reason_loading': 'Loading match reason...',
    'retake_test': 'RETAKE TEST',
    'share_result': 'SHARE RESULT',
    'loading_data': 'LOADING DATA...',
    
    // Start Page
    'start_page_title': 'NXNS BOOT UI // SYSTEM BOOT',
    'boot_sub': 'Cloud Matching System · Neural Network Identification System',
    'booting': 'BOOTING...',
    'init_sequence': 'INITIALIZATION SEQUENCE',
    'enter_system': 'ENTER SYSTEM',
    'skip_anim': 'SKIP ANIMATION',
    'hint': 'HINT: Clicking any button triggers haptic feedback (if supported).',
    'secure_channel': 'SECURE CHANNEL: ENABLED',
    
    // JS Messages
    'browser_no_cam': 'Browser does not support camera',
    'cam_init_fail': 'Camera initialization failed',
    'cam_access_error': 'Cannot access camera, please check permissions',
    'starting_cam': 'Starting camera...',
    'cam_start_fail': 'Camera start failed, check permissions',
    'capture_first': 'Please capture or upload photo first',
    'analyzing': 'Analyzing facial features...',
    'analysis_failed': 'Analysis failed',
    'network_error': 'Network error, please try again later',
    'select_image': 'Please select an image file',
    'image_too_large': 'Image size cannot exceed 10MB',
    
    // Boot Sequence
    'boot_line_1': 'Initializing secure channel... OK',
    'boot_line_2': 'Loading biometric modules... OK',
    'boot_line_3': 'Calibrating optical sensor... OK',
    'boot_line_4': 'Syncing celebrity database... OK',
    'boot_line_5': 'Preparing HUD renderer... OK',
    'boot_line_6': 'Establishing AI uplink... OK',
    'boot_line_7': 'System ready. Awaiting user input.',
    'status_online': 'ONLINE'
  }
};

class I18n {
  constructor() {
    this.lang = localStorage.getItem('nxns_lang') || 'zh-CN';
    this.observers = [];
    
    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.renderLanguageSwitch();
    this.updatePage();
  }

  setLanguage(lang) {
    if (this.lang !== lang) {
      this.lang = lang;
      localStorage.setItem('nxns_lang', lang);
      this.updatePage();
      this.notifyObservers();
    }
  }

  getLanguage() {
    return this.lang;
  }

  t(key) {
    return translations[this.lang][key] || key;
  }

  updatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (el.tagName === 'INPUT' && el.type === 'placeholder') {
          el.placeholder = this.t(key);
        } else {
          // If the element has child nodes (like icons), we need to be careful not to remove them.
          // But most of our text is simple or wrapped in spans.
          // For buttons with icons: <button><span icon></span><span text>Text</span></button>
          // The data-i18n should be on the text span.
          el.textContent = this.t(key);
        }
      }
    });
    
    document.documentElement.lang = this.lang;
    
    // Update active state of language switch
    const switchBtns = document.querySelectorAll('.lang-switch-btn');
    switchBtns.forEach(btn => {
      if (btn.dataset.lang === this.lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  renderLanguageSwitch() {
    // Avoid duplicate rendering
    if (document.querySelector('.language-switch')) return;

    const container = document.createElement('div');
    container.className = 'language-switch';
    container.innerHTML = `
      <button class="lang-switch-btn ${this.lang === 'zh-CN' ? 'active' : ''}" data-lang="zh-CN">CN</button>
      <span class="divider">/</span>
      <button class="lang-switch-btn ${this.lang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
    `;
    
    // Add styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      .language-switch {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        align-items: center;
        background: rgba(0, 20, 40, 0.6);
        border: 1px solid rgba(0, 255, 255, 0.3);
        padding: 5px 10px;
        border-radius: 20px;
        backdrop-filter: blur(5px);
        font-family: 'Rajdhani', 'Orbitron', sans-serif;
      }
      .lang-switch-btn {
        background: none;
        border: none;
        color: rgba(0, 255, 255, 0.5);
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        padding: 0 5px;
        transition: all 0.3s ease;
      }
      .lang-switch-btn:hover {
        color: rgba(0, 255, 255, 0.8);
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      .lang-switch-btn.active {
        color: #00ffff;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
      }
      .language-switch .divider {
        color: rgba(0, 255, 255, 0.3);
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    // Add event listeners
    container.querySelectorAll('.lang-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setLanguage(btn.dataset.lang);
      });
    });
  }

  onLanguageChange(callback) {
    this.observers.push(callback);
  }
  
  notifyObservers() {
    this.observers.forEach(cb => cb(this.lang));
  }
}

window.i18n = new I18n();
