document.addEventListener('DOMContentLoaded', () => {
  // --- Theme bootstrap (light by default; opt into dark) ---
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    root.setAttribute('data-theme', 'dark');
  }

  // --- SPA-like page switching ---
  const links = Array.from(document.querySelectorAll('.side-link'))
    .filter((a) => a.getAttribute('href') && a.getAttribute('href').startsWith('#'));
  const panels = Array.from(document.querySelectorAll('.content > section.panel'));

  const showPanel = (id) => {
    panels.forEach((sec) => sec.classList.toggle('hidden', sec.id !== id));
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
  };

  const navigate = (id, replace = false) => {
    if (!id) return;
    showPanel(id);
    const url = `#${id}`;
    if (replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
  };

  // Handle clicks
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href.startsWith('#')) return;
      e.preventDefault();
      navigate(href.slice(1));
    });
  });

  // On load: go to hash or default to first
  const initial = (location.hash || '#about').slice(1);
  showPanel(initial);
  history.replaceState(null, '', `#${initial}`);

  // Remove typing effect for a cleaner, calmer hero headline

  // Animate experience cards when visible
  const animEls = document.querySelectorAll('.animate-on-show, .tl-content');
  if (animEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      });
    }, { threshold: 0.12 });
    animEls.forEach((el) => obs.observe(el));
  }

  // Publications: search + details + copy cite
  const pubSearch = document.getElementById('pub-search');
  if (pubSearch) {
    pubSearch.addEventListener('input', () => {
      const q = pubSearch.value.trim().toLowerCase();
      document.querySelectorAll('.pub-item').forEach((li) => {
        const text = li.innerText.toLowerCase();
        li.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('.pub-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const li = btn.closest('.pub-item');
      if (!li) return;
      const isCompact = li.classList.toggle('compact');
      btn.setAttribute('aria-expanded', String(!isCompact));
      btn.textContent = isCompact ? 'Details' : 'Hide';
    });
  });

  document.querySelectorAll('.pub-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const li = btn.closest('.pub-item');
      if (!li) return;
      const title = li.querySelector('.pub-title')?.innerText ?? '';
      const authors = li.querySelector('.authors')?.innerText ?? '';
      const venue = li.querySelector('.venue')?.innerText ?? '';
      const cite = `${authors}. ${title}. ${venue}`.replace(/\s+/g, ' ').trim();
      try {
        await navigator.clipboard.writeText(cite);
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy Cite'), 1000);
      } catch (_) {
        btn.textContent = 'Copy failed';
        setTimeout(() => (btn.textContent = 'Copy Cite'), 1200);
      }
    });
  });

  // Back/forward
  window.addEventListener('popstate', () => {
    const current = (location.hash || '#about').slice(1);
    showPanel(current);
    if (current === 'about') setTimeout(typeHero, 150);
  });
}); 