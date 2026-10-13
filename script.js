document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.getElementById('workspace');
  const windows = Array.from(document.querySelectorAll('.desktop-window'));
  const mobile = window.matchMedia('(max-width: 900px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.getElementById('desktop-status');
  const hint = document.querySelector('.desktop-hint');
  const states = new Map(windows.map(panel => [panel.id, { mode: panel.hidden ? 'closed' : 'open', opener: null }]));
  let layer = 10;
  let activeId = null;
  let toastTimer;
  let drag = null;

  // Page view is the default; the desktop is an opt-in view for wide screens.
  const root = document.documentElement;
  const modeToggle = document.getElementById('mode-toggle');
  const isPage = () => root.dataset.mode === 'doc';
  const preferredMode = () => {
    try { return localStorage.getItem('view') === 'desktop' ? 'desktop' : 'doc'; } catch { return 'doc'; }
  };
  const applyMode = mode => {
    root.dataset.mode = mobile.matches ? 'doc' : mode;
  };

  const announce = message => {
    status.textContent = message;
    status.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => status.classList.remove('is-visible'), 2500);
  };

  const updateLaunchers = () => {
    document.querySelectorAll('[data-open]').forEach(launcher => {
      const state = states.get(launcher.dataset.open);
      launcher.setAttribute('aria-expanded', String(state.mode === 'open'));
      launcher.classList.toggle('is-open', state.mode === 'open');
      launcher.classList.toggle('is-minimized', state.mode === 'minimized');
      launcher.classList.toggle('is-active', launcher.dataset.open === activeId && state.mode === 'open');
    });
    hint.hidden = windows.some(panel => !panel.hidden);
  };

  const bringForward = panel => {
    if (panel.hidden) return;
    windows.forEach(item => item.classList.toggle('is-focused', item === panel));
    panel.style.zIndex = String(++layer);
    activeId = panel.id;
    updateLaunchers();
  };

  const openWindow = (id, { opener = null, navigate = true, focus = true } = {}) => {
    const panel = windows.find(item => item.id === id);
    if (!panel) return;
    const state = states.get(id);
    if (opener) state.opener = opener;
    state.mode = 'open';
    panel.hidden = false;
    bringForward(panel);
    if (navigate && location.hash !== `#${id}`) history.pushState({ window: id }, '', `#${id}`);
    if (focus) panel.focus({ preventScroll: true });
    if (mobile.matches && focus) panel.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  };

  const hideWindow = (panel, mode) => {
    states.get(panel.id).mode = mode;
    panel.hidden = true;
    panel.classList.remove('is-focused');
    if (location.hash === `#${panel.id}`) history.replaceState(null, '', location.pathname + location.search);
    if (activeId === panel.id) {
      const remaining = windows.filter(item => !item.hidden).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
      activeId = null;
      if (remaining[0]) bringForward(remaining[0]);
    }
    const opener = states.get(panel.id).opener || document.querySelector(`.desktop-shortcuts [data-open="${panel.id}"]`);
    opener?.focus({ preventScroll: true });
    updateLaunchers();
    announce(`${panel.id === 'publications' ? 'Papers' : panel.id[0].toUpperCase() + panel.id.slice(1)} ${mode === 'minimized' ? 'minimized. Click its dock icon to reopen.' : 'closed. Click its icon to reopen.'}`);
  };

  const toggleMaximize = panel => {
    if (mobile.matches) return;
    const maximized = panel.classList.toggle('is-maximized');
    const button = panel.querySelector('[data-action="maximize"]');
    button.setAttribute('aria-label', `${maximized ? 'Restore' : 'Maximize'} ${panel.id}`);
    button.title = maximized ? 'Restore size' : 'Maximize';
    bringForward(panel);
  };

  document.addEventListener('click', event => {
    const launcher = event.target.closest('[data-open]');
    if (launcher && isPage()) return;
    if (launcher && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      openWindow(launcher.dataset.open, { opener: launcher });
      return;
    }
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const panel = action.closest('.desktop-window');
    if (action.dataset.action === 'minimize') hideWindow(panel, 'minimized');
    if (action.dataset.action === 'close') hideWindow(panel, 'closed');
    if (action.dataset.action === 'maximize') toggleMaximize(panel);
  });

  windows.forEach(panel => {
    panel.addEventListener('pointerdown', () => bringForward(panel));
    panel.addEventListener('focusin', () => {
      if (activeId !== panel.id) bringForward(panel);
    });
    const bar = panel.querySelector('[data-drag-handle]');
    bar.addEventListener('dblclick', event => {
      if (!isPage() && !event.target.closest('button')) toggleMaximize(panel);
    });
    bar.addEventListener('pointerdown', event => {
      if (isPage() || mobile.matches || panel.classList.contains('is-maximized') || event.button !== 0 || event.target.closest('button')) return;
      event.preventDefault();
      const bounds = workspace.getBoundingClientRect();
      const rect = panel.getBoundingClientRect();
      panel.style.left = `${rect.left - bounds.left}px`;
      panel.style.top = `${rect.top - bounds.top}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = `${rect.width}px`;
      panel.style.height = `${rect.height}px`;
      drag = { panel, pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      bar.setPointerCapture(event.pointerId);
      document.body.classList.add('is-dragging');
    });
    bar.addEventListener('pointermove', event => {
      if (!drag || drag.panel !== panel || drag.pointerId !== event.pointerId) return;
      const bounds = workspace.getBoundingClientRect();
      const x = Math.max(0, Math.min(event.clientX - bounds.left - drag.offsetX, bounds.width - panel.offsetWidth));
      const y = Math.max(0, Math.min(event.clientY - bounds.top - drag.offsetY, bounds.height - panel.offsetHeight));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    });
    const finishDrag = event => {
      if (!drag || drag.panel !== panel || drag.pointerId !== event.pointerId) return;
      if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
      drag = null;
      document.body.classList.remove('is-dragging');
    };
    bar.addEventListener('pointerup', finishDrag);
    bar.addEventListener('pointercancel', finishDrag);
    bar.addEventListener('lostpointercapture', finishDrag);
  });

  const updateWindowControls = () => {
    windows.forEach(panel => {
      const button = panel.querySelector('[data-action="maximize"]');
      button.disabled = mobile.matches;
      button.title = mobile.matches ? 'Windows stack on small screens' : 'Maximize';
    });
  };
  const restoreGeometry = () => {
    windows.forEach(panel => {
      panel.removeAttribute('style');
      panel.classList.remove('is-maximized');
      panel.querySelector('[data-action="maximize"]').setAttribute('aria-label', `Maximize ${panel.id}`);
    });
    if (activeId) bringForward(document.getElementById(activeId));
    updateWindowControls();
  };
  mobile.addEventListener('change', () => {
    applyMode(preferredMode());
    restoreGeometry();
  });
  window.addEventListener('resize', () => {
    if (mobile.matches) return;
    const bounds = workspace.getBoundingClientRect();
    windows.filter(panel => panel.style.left && !panel.classList.contains('is-maximized')).forEach(panel => {
      panel.style.width = `${Math.min(panel.offsetWidth, bounds.width)}px`;
      panel.style.height = `${Math.min(panel.offsetHeight, bounds.height)}px`;
      panel.style.left = `${Math.max(0, Math.min(parseFloat(panel.style.left), bounds.width - panel.offsetWidth))}px`;
      panel.style.top = `${Math.max(0, Math.min(parseFloat(panel.style.top), bounds.height - panel.offsetHeight))}px`;
    });
  });

  document.getElementById('reset-layout').addEventListener('click', () => {
    activeId = null;
    layer = 10;
    windows.forEach(panel => {
      const open = panel.id !== 'contact';
      panel.hidden = !open;
      states.get(panel.id).mode = open ? 'open' : 'closed';
      panel.classList.remove('is-focused');
    });
    restoreGeometry();
    bringForward(document.getElementById('about'));
    history.replaceState(null, '', location.pathname + location.search);
    announce('Desktop back in order.');
  });

  modeToggle.addEventListener('click', () => {
    const next = isPage() ? 'desktop' : 'doc';
    try { localStorage.setItem('view', next); } catch {}
    applyMode(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
    announce(next === 'desktop' ? 'Desktop view. Drag windows around, or switch back to the page view anytime.' : 'Page view.');
  });

  const followHash = () => {
    if (isPage()) return;
    const id = location.hash.slice(1);
    if (states.has(id)) openWindow(id, { navigate: false });
  };
  window.addEventListener('popstate', followHash);
  window.addEventListener('hashchange', followHash);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || isPage() || !activeId || event.target.matches('input, select, textarea')) return;
    hideWindow(document.getElementById(activeId), 'closed');
  });

  // Filtering uses the original, complete publication text from the CV.
  const search = document.getElementById('paper-search');
  const year = document.getElementById('paper-year');
  const papers = Array.from(document.querySelectorAll('.paper'));
  const filterPapers = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    papers.forEach(paper => {
      const matches = paper.textContent.toLowerCase().includes(query)
        && (year.value === 'all' || paper.dataset.year === year.value);
      paper.hidden = !matches;
      if (matches) visible++;
    });
    document.getElementById('paper-empty').hidden = visible > 0;
    document.getElementById('paper-results').textContent = `${visible} ${visible === 1 ? 'paper' : 'papers'} shown`;
    document.querySelector('.library-total').textContent = `${visible} ${visible === 1 ? 'paper' : 'papers'}`;
  };
  search.addEventListener('input', filterPapers);
  year.addEventListener('change', filterPapers);

  const tabs = Array.from(document.querySelectorAll('[data-tab]'));
  const activateTab = button => {
    tabs.forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  };
  tabs.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  });

  document.getElementById('copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('hbin0701@kaist.ac.kr');
      announce('Email address copied.');
    } catch {
      announce('You can select the address to copy it, or click it to send an email.');
    }
  });
  const clock = document.getElementById('desktop-clock');
  const updateClock = () => {
    clock.textContent = `SEOUL ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
  };
  updateClock();
  setInterval(updateClock, 60000);
  updateWindowControls();
  filterPapers();
  bringForward(document.getElementById('about'));
  if (states.has(location.hash.slice(1))) followHash();
});
