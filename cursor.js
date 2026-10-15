/* Animate only the native hover cursor. No delayed cursor-following layer. */
document.addEventListener('DOMContentLoaded', () => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const frames = [0, 1, 2].map(frame => `url("assets/cursors/game/hover-${frame}.svg?v=24") 2 2, pointer`);
  const interactive = "a,button:not(:disabled),select,summary,[role='button'],[data-character],input[type='checkbox'],input[type='radio'],input[type='button'],input[type='submit'],input[type='range']";
  let timer;
  let frame = 0;
  let hovering = false;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
    frame = 0;
    root.style.removeProperty('--game-pointer');
  };
  const sync = () => {
    stop();
    if (!hovering || !finePointer.matches || reducedMotion.matches || document.hidden) return;
    timer = setInterval(() => {
      frame = (frame + 1) % frames.length;
      root.style.setProperty('--game-pointer', frames[frame]);
    }, 380);
  };
  // Decode every frame before enabling animation to avoid a blank first hover.
  Promise.all([0, 1, 2].map(async frame => {
    const image = new Image();
    image.src = `assets/cursors/game/hover-${frame}.svg?v=24`;
    await image.decode();
  })).then(() => {
    document.addEventListener('pointerover', event => {
      if (event.pointerType !== 'mouse') return;
      const next = Boolean(event.target.closest(interactive));
      if (next !== hovering) { hovering = next; sync(); }
    });
    document.documentElement.addEventListener('pointerleave', () => { hovering = false; stop(); });
    window.addEventListener('blur', () => { hovering = false; stop(); });
    document.addEventListener('visibilitychange', sync);
    finePointer.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);
  }).catch(() => {});
});
