/* Drawn sprite frames, paced gestures, and a still resting pose. */
document.addEventListener('DOMContentLoaded', () => {
  const figures = document.querySelectorAll('[data-character]');
  if (!figures.length) return;
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = {
    blink: [[-2, 200]],
    wave: [[0, 100], [1, 140], [2, 170], [3, 170], [2, 170], [3, 170], [1, 140], [0, 100]],
    tilt: [[0, 100], [1, 150], [2, 450], [3, 150], [1, 100], [0, 100]],
    'thumbs-up': [[0, 100], [1, 160], [2, 500], [3, 160], [0, 100]],
  };
  const idleActions = ['tilt', 'thumbs-up'];
  const images = new Map();
  const loadImage = async name => {
    const image = new Image();
    image.src = `assets/character/${name}.png?v=2`;
    await image.decode();
    images.set(name, image);
  };
  const assetsReady = Promise.allSettled(['idle', ...Object.keys(animations)].map(loadImage));

  figures.forEach(figure => {
    const canvas = figure.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!context) return;
    context.imageSmoothingEnabled = false;
    const previewAction = figure.dataset.previewAction;
    let ready = false;
    let inView = false;
    let currentAction = null;
    let blinkTimer;
    let gestureTimer;
    let frameTimer;
    let actionBag = [];
    let lastAction = null;
    let lastGestureStarted = null;
    const canAnimate = () => ready && inView && !document.hidden && !reducedMotion.matches &&
      root.dataset.mode === 'doc' && root.dataset.motion !== 'paused';
    const render = (name = 'idle', frame = 0) => {
      context.clearRect(0, 0, 128, 192);
      if (name === 'idle' || name === 'blink') {
        context.drawImage(images.get('idle'), 0, 0);
        if (name === 'blink' && images.has('blink')) {
          // Eye-only overlay keeps every other pixel of the original still pose intact.
          context.drawImage(images.get('blink'), 40, 64, 50, 20, 40, 64, 50, 20);
        }
      } else {
        context.drawImage(images.get(name), (frame % 2) * 128, Math.floor(frame / 2) * 192, 128, 192, 0, 0, 128, 192);
      }
      if (figure.dataset.animation !== name) figure.dataset.animation = name;
      if (figure.dataset.frame !== String(frame)) figure.dataset.frame = String(frame);
    };
    const clearTimers = () => {
      clearTimeout(blinkTimer);
      clearTimeout(gestureTimer);
      clearTimeout(frameTimer);
    };
    const nextGesture = () => {
      if (!actionBag.length) {
        actionBag = idleActions.filter(name => images.has(name));
        for (let i = actionBag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [actionBag[i], actionBag[j]] = [actionBag[j], actionBag[i]];
        }
        if (actionBag.length > 1 && actionBag.at(-1) === lastAction) {
          [actionBag[0], actionBag[actionBag.length - 1]] = [actionBag.at(-1), actionBag[0]];
        }
      }
      return actionBag.pop();
    };
    const scheduleBlink = (delay = 2000 + Math.random() * 1500) => {
      clearTimeout(blinkTimer);
      if (!canAnimate() || previewAction || !images.has('blink')) return;
      blinkTimer = setTimeout(() => play('blink'), delay);
    };
    // Count from the previous gesture's start, including its animation time.
    const scheduleGesture = (delay = lastGestureStarted === null ? 5000 : Math.max(0, 5000 - (performance.now() - lastGestureStarted))) => {
      clearTimeout(gestureTimer);
      if (!canAnimate()) return;
      gestureTimer = setTimeout(() => {
        if (!canAnimate()) return;
        if (currentAction) {
          scheduleGesture(150);
          return;
        }
        const name = previewAction || nextGesture();
        if (name) play(name);
      }, previewAction ? 2000 : delay);
    };
    const finish = name => {
      currentAction = null;
      render();
      if (!canAnimate()) return;
      if (name === 'blink' && !previewAction) {
        scheduleBlink();
        // Keep the pending gesture timer, so repeated blinks cannot postpone it forever.
      } else {
        scheduleBlink(1100);
        scheduleGesture();
      }
    };
    const play = (name, interrupt = false) => {
      if (!canAnimate() || !Object.hasOwn(animations, name) || !images.has(name)) return false;
      if (currentAction && !interrupt) {
        if (name === 'blink') scheduleBlink(700);
        else scheduleGesture(1000);
        return false;
      }
      clearTimeout(frameTimer);
      clearTimeout(blinkTimer);
      if (name !== 'blink') clearTimeout(gestureTimer);
      currentAction = name;
      if (name !== 'blink') lastGestureStarted = performance.now();
      if (name !== 'blink') lastAction = name;
      const sequence = animations[name];
      const step = index => {
        if (!canAnimate()) {
          currentAction = null;
          render();
          return;
        }
        if (index === sequence.length) return finish(name);
        const [frame, duration] = sequence[index];
        render(frame === -2 ? 'blink' : name, Math.max(0, frame));
        frameTimer = setTimeout(() => step(index + 1), duration);
      };
      step(0);
      return true;
    };
    const sync = () => {
      clearTimers();
      currentAction = null;
      lastGestureStarted = null;
      if (!ready) return;
      render();
      if (canAnimate()) {
        scheduleBlink(1100);
        scheduleGesture(5000);
      }
    };
    figure.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch' || !canAnimate()) return;
      play('wave', true);
    });
    // The preview page and browser QA use the same renderer as the website.
    figure.addEventListener('character:play', event => play(event.detail, true));
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(figure);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-mode', 'data-motion'] });
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    assetsReady.then(() => {
      if (!images.has('idle')) return;
      ready = true;
      figure.classList.add('is-ready');
      sync();
    });
  });
});
