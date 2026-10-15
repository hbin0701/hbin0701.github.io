/* A one-shot duo scene, contained inside its publication card. */
document.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('[data-pubg-ally]');
  const canvas = card?.querySelector('.pubg-ally-canvas');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sprites = new Map();
  let hovered = false;
  let ready = false;
  let running = false;
  let requested = false;
  let frameRequest;
  let startedAt;
  let geometry;
  let loading;
  let loadAttempt = 0;
  const arrivalDuration = 1450;

  const inViewport = () => {
    if (!card.getClientRects().length) return false;
    const rect = card.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight &&
      rect.right > 0 && rect.left < innerWidth;
  };
  const allowed = () => !document.hidden && !reducedMotion.matches && !card.hidden && inViewport();
  const engaged = () => hovered || card.matches(':hover') || card.contains(document.activeElement);
  const clear = () => {
    cancelAnimationFrame(frameRequest);
    running = false;
    requested = false;
    card.classList.remove('is-duo-playing');
    card.dataset.duoPhase = 'idle';
    if (geometry) context.clearRect(0, 0, geometry.width, geometry.height);
  };
  const measure = () => {
    const rect = card.getBoundingClientRect();
    const authors = card.querySelector('.authors').getBoundingClientRect();
    const paperLink = card.querySelector('.pub-actions a').getBoundingClientRect();
    const narrow = rect.width < 330;
    const height = Math.max(48, Math.min(80, rect.bottom - authors.bottom - 30));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    geometry = {
      width: rect.width, height: rect.height, scale: height / 168,
      baseline: rect.height - 12,
      playerX: rect.width - (narrow ? 28 : 54),
      friendX: rect.width - (narrow ? 80 : 132),
      entranceLeft: Math.min(rect.width - 100, Math.max(paperLink.right - rect.left + 10, rect.width - 310)),
    };
  };
  const actor = (name, frame, x, y = 0) => {
    const { scale, baseline } = geometry;
    context.drawImage(sprites.get(name), (frame % 2) * 192, Math.floor(frame / 2) * 224,
      192, 224, Math.round(x - 96 * scale), Math.round(baseline - 216 * scale + y),
      192 * scale, 224 * scale);
  };
  const draw = now => {
    if (!allowed()) return clear();
    const totalElapsed = now - startedAt;
    const { width, height, friendX, playerX } = geometry;
    context.clearRect(0, 0, width, height);
    if (totalElapsed < arrivalDuration) {
      card.dataset.duoPhase = 'arrival';
      const progress = Math.max(0, totalElapsed / arrivalDuration);
      const friendProgress = Math.max(0, (totalElapsed - 130) / (arrivalDuration - 130));
      const ease = value => value * value * (3 - 2 * value);
      const startX = geometry.entranceLeft - 65;
      const playerPosition = startX + (playerX - startX) * ease(progress);
      const friendPosition = startX - 35 + (friendX - startX + 35) * ease(friendProgress);
      const frame = Math.floor(totalElapsed / 110) % 4;
      // Run in through the left edge of the vignette at a constant size.
      // This lane leaves the publication link and metadata unobstructed.
      context.save();
      context.beginPath();
      context.rect(geometry.entranceLeft, 0, width - geometry.entranceLeft, height);
      context.clip();
      context.globalAlpha = Math.min(1, friendProgress / .6);
      actor(friendProgress > .88 ? 'friend-shoot' : 'friend-run', friendProgress > .88 ? 0 : frame, friendPosition);
      context.globalAlpha = Math.min(1, progress / .6);
      actor(progress > .88 ? 'equip' : 'enter', progress > .88 ? 0 : frame, playerPosition);
      context.restore();
      frameRequest = requestAnimationFrame(draw);
      return;
    }
    const elapsed = totalElapsed - arrivalDuration;
    if (elapsed < 1080) {
      card.dataset.duoPhase = 'helmet';
      actor('friend-shoot', 0, friendX);
      const frame = Math.min(3, Math.floor(elapsed / 270));
      actor(frame === 3 ? 'aim' : 'equip', frame === 3 ? 0 : frame, playerX);
    } else if (elapsed < 1680) {
      card.dataset.duoPhase = 'aim';
      actor('friend-shoot', 0, friendX);
      const frame = Math.min(3, Math.floor((elapsed - 1080) / 150));
      // End on the actual firing sheet's ready frame: no pose swap at the handoff.
      actor(frame === 3 ? 'shoot' : 'aim', frame === 3 ? 0 : frame, playerX);
    } else if (elapsed < 3140) {
      card.dataset.duoPhase = 'shoot';
      // Alternate short bursts with longer rests; never use rapid strobe flashes.
      const beat = Math.floor((elapsed - 1680) / 180) % 4;
      actor('friend-shoot', [0, 0, 1, 2][beat], friendX);
      actor('shoot', [0, 1, 2, 0][beat], playerX);
    } else if (elapsed < 4650) {
      card.dataset.duoPhase = 'run';
      const runTime = elapsed - 3140;
      const progress = Math.min(1, runTime / 1330);
      const frame = Math.floor(runTime / 115) % 4;
      const travel = width - friendX + 100;
      const friendProgress = Math.max(0, (runTime - 120) / 1330);
      // Both run through the right edge; the canvas and card clip every pixel.
      actor('friend-run', frame, friendX + travel * friendProgress);
      actor('run', frame, playerX + travel * progress);
    } else {
      return clear();
    }
    frameRequest = requestAnimationFrame(draw);
  };
  const play = () => {
    if (running) return;
    requested = true;
    if (!allowed()) return;
    if (!ready) { loadSprites(); return; }
    requested = false;
    running = true;
    measure();
    card.classList.add('is-duo-playing');
    startedAt = performance.now();
    draw(startedAt);
  };
  card.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') { hovered = true; play(); }
  });
  card.addEventListener('pointerleave', () => { hovered = false; requested = false; });
  card.querySelector('.pub-title').addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') play();
  });
  card.addEventListener('focusin', play);
  card.addEventListener('pubg-ally:play', play);
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && !inViewport()) clear();
    else if (ready && requested && engaged()) play();
  }).observe(card);
  new ResizeObserver(() => { if (running) measure(); }).observe(card);
  const stopWhenHidden = () => {
    if (!allowed()) { requested = false; clear(); }
  };
  document.addEventListener('visibilitychange', stopWhenHidden);
  reducedMotion.addEventListener('change', stopWhenHidden);
  new MutationObserver(stopWhenHidden).observe(card, { attributes: true, attributeFilter: ['hidden'] });
  const files = { enter: 'enter', equip: 'equip-v2', aim: 'aim-v2', shoot: 'shoot', run: 'run-v2',
    'friend-shoot': 'friend-shoot', 'friend-run': 'friend-run-v2' };
  const loadSprites = () => {
    if (ready || loading) return loading;
    const attempt = ++loadAttempt;
    loading = Promise.all(Object.entries(files).map(async ([name, file]) => {
      const image = new Image();
      image.src = `assets/pubg-ally/${file}.png?v=20261015&attempt=${attempt}`;
      await image.decode();
      sprites.set(name, image);
    })).then(() => {
      ready = true;
      card.dataset.duoReady = 'true';
      if (engaged()) play();
    }).catch(() => {
      card.dataset.duoReady = 'error';
      loading = null;
      clear();
    });
    return loading;
  };
  loadSprites();
});
