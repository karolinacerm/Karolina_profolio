(() => {
  function renderProjects(items, grid){
    const frag = document.createDocumentFragment();

    items.forEach(p => {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = p.href || ('#' + (p.id || ''));
      a.setAttribute('aria-label', p.ariaLabel || p.title || 'Project');

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (p.thumb) {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = p.thumb;
        img.alt = p.thumbAlt || '';
        thumb.appendChild(img);
      } else {
        thumb.textContent = '4:3';
      }

      const meta = document.createElement('div');
      meta.className = 'meta';

      const title = document.createElement('p');
      title.className = 'title';
      title.textContent = p.title || 'Untitled';

      const tags = document.createElement('div');
      tags.className = 'tags';
      tags.setAttribute('aria-label', 'Tags');
      (p.tags || []).forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        tags.appendChild(span);
      });

      meta.appendChild(title);
      meta.appendChild(tags);
      a.appendChild(thumb);
      a.appendChild(meta);
      frag.appendChild(a);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  async function init(){
    const grid = document.getElementById('projectsGrid');
    if(!grid){ console.warn('#projectsGrid nenalezen'); return; }

    const src = grid.getAttribute('data-src') || './projects.json';
    try {
      const res = await fetch(src, { cache: 'no-store' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();
      if(!Array.isArray(items)) throw new Error('projects.json: očekávám pole objektů');
      renderProjects(items, grid);
      console.info(`Načteno ${items.length} projektů z ${src}`);
    } catch(err){
      console.error('Nepodařilo se načíst projekty:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(async () => {
  function renderProjects(items, grid){ /* tvoje funkce beze změny */ }

  async function init(){
    const grid = document.getElementById('projectsGrid');
    if(!grid) return;

    const src = grid.getAttribute('data-src') || './projects.json';

    // 1) Zkus fetch (bude fungovat na http://)
    try {
      const res = await fetch(src, { cache: 'no-store' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();
      if(!Array.isArray(items)) throw new Error('projects.json: očekávám pole objektů');
      renderProjects(items, grid);
      return;
    } catch(err){
      console.warn('Fetch selhal, zkouším inline JSON:', err);
    }

    // 2) Fallback: inline JSON <script type="application/json" id="projects-data">
    const inline = document.getElementById('projects-data');
    if (inline) {
      try {
        const items = JSON.parse(inline.textContent || '[]');
        if(Array.isArray(items)) {
          renderProjects(items, grid);
          return;
        }
      } catch(e){ console.error('Inline JSON má chybný formát:', e); }
    }

    console.error('Nenalezeny žádné projektové data.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();