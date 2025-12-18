(() => {
  const enterBtn = document.getElementById('enterBtn');
  const skipBtn = document.getElementById('skipBtn');
  const progressBar = document.getElementById('progressBar');
  const progressValue = document.getElementById('progressValue');
  const bootLog = document.getElementById('bootLog');
  const bootStatus = document.getElementById('bootStatus');
  const bootTime = document.getElementById('bootTime');

  const now = new Date();
  if (bootTime) {
    bootTime.textContent = `[${now.toISOString().replace('T', ' ').substring(0, 19)}]`;
  }

  // Helper for i18n
  const t = (key) => (window.i18n && window.i18n.t(key)) || key;

  const getLines = () => [
    t('boot_line_1'),
    t('boot_line_2'),
    t('boot_line_3'),
    t('boot_line_4'),
    t('boot_line_5'),
    t('boot_line_6'),
    t('boot_line_7')
  ];

  const appendLine = (text, delayMs) => {
    setTimeout(() => {
      if (!bootLog) return;
      const lineEl = document.createElement('div');
      lineEl.className = 'line';
      lineEl.textContent = `> ${text}`;
      bootLog.appendChild(lineEl);

      while (bootLog.children.length > 10) {
        bootLog.removeChild(bootLog.firstChild);
      }
    }, delayMs);
  };

  // Wait for i18n to be ready if needed, but it should be since it's sync
  const lines = getLines();
  lines.forEach((line, idx) => appendLine(line, 220 + idx * 320));

  const finishBoot = () => {
    if (bootStatus) bootStatus.textContent = t('status_online');
    if (enterBtn) {
      enterBtn.disabled = false;
      enterBtn.focus({ preventScroll: true });
    }
  };

  const startProgress = () => {
    const duration = 2400;
    const start = performance.now();

    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const percent = Math.floor(p * 100);

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressValue) progressValue.textContent = `${percent}%`;

      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        finishBoot();
      }
    };

    requestAnimationFrame(tick);
  };

  const enterSystem = () => {
    window.location.href = '/scan';
  };

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (progressBar) progressBar.style.width = '100%';
      if (progressValue) progressValue.textContent = '100%';
      finishBoot();
    });
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      if (enterBtn.disabled) return;
      enterSystem();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && enterBtn && !enterBtn.disabled) {
      enterSystem();
    }
  });

  startProgress();
})();
