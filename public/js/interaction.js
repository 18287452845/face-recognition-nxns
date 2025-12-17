(() => {
  const TAP_SELECTORS = [
    'button',
    'a',
    '[role="button"]',
    '.btn',
    '.hud-btn',
    '[data-tap]'
  ].join(',');

  const isDisabled = (el) => {
    if (!el) return true;
    if (el.hasAttribute('disabled')) return true;
    if (el.getAttribute('aria-disabled') === 'true') return true;
    return false;
  };

  const supportsVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  const vibrate = (duration) => {
    if (!supportsVibrate()) return;
    if (document.visibilityState !== 'visible') return;

    try {
      navigator.vibrate(duration);
    } catch {
      // ignore
    }
  };

  const clearPressed = () => {
    document.querySelectorAll('.tap-target.is-pressed').forEach((el) => {
      el.classList.remove('is-pressed');
    });
  };

  const ensureTapTarget = (el) => {
    if (!el.classList.contains('tap-target')) {
      el.classList.add('tap-target');
    }

    const style = window.getComputedStyle(el);
    if (style.position === 'static') {
      el.style.position = 'relative';
    }

    if (style.overflow === 'visible') {
      el.style.overflow = 'hidden';
    }
  };

  const addRipple = (el, clientX, clientY) => {
    const rect = el.getBoundingClientRect();
    const size = Math.ceil(Math.max(rect.width, rect.height) * 1.25);

    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  };

  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target instanceof Element ? e.target.closest(TAP_SELECTORS) : null;
      if (!target || isDisabled(target)) return;

      ensureTapTarget(target);
      target.classList.add('is-pressed');

      const tapColor = target.getAttribute('data-tap-color');
      if (tapColor === 'accent') {
        vibrate(16);
      } else {
        vibrate(12);
      }

      if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        addRipple(target, e.clientX, e.clientY);
      }
    },
    { capture: true }
  );

  window.addEventListener('pointerup', clearPressed, true);
  window.addEventListener('pointercancel', clearPressed, true);
  window.addEventListener('blur', clearPressed);
})();
