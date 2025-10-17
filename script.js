(() => {
  const grid = document.getElementById('projectsGrid');
  if (!grid) {
    console.warn('#projectsGrid nenalezen');
    return;
  }

  function createCard(project) {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = project.href || (project.id ? `./project.html?id=${project.id}` : '#');
    link.setAttribute('aria-label', project.ariaLabel || project.title || 'Project');

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (project.thumb) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = project.thumb;
      img.alt = project.thumbAlt || '';
      thumb.appendChild(img);
    } else {
      thumb.textContent = '4:3';
    }

    const meta = document.createElement('div');
    meta.className = 'meta';

    const title = document.createElement('p');
    title.className = 'title';
    title.textContent = project.title || 'Untitled';

    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.setAttribute('aria-label', 'Tags');
    (project.tags || []).forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tags.appendChild(span);
    });

    meta.appendChild(title);
    meta.appendChild(tags);
    link.appendChild(thumb);
    link.appendChild(meta);
    return link;
  }

  function renderProjects(items) {
    const frag = document.createDocumentFragment();
    items.forEach(project => {
      frag.appendChild(createCard(project));
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  async function loadProjects() {
    const src = grid.getAttribute('data-src') || './projects.json';
    const inline = document.getElementById('projects-data');

    try {
      const res = await fetch(src, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        renderProjects(data);
        console.info(`Načteno ${data.length} projektů`);
        return;
      }
      throw new Error('projects.json: očekávám pole objektů');
    } catch (err) {
      console.warn('Fetch selhal, zkouším inline JSON:', err);
      if (inline) {
        try {
          const fallback = JSON.parse(inline.textContent || '[]');
          if (Array.isArray(fallback)) {
            renderProjects(fallback);
            return;
          }
        } catch (parseErr) {
          console.error('Inline JSON má chybný formát:', parseErr);
        }
      }
      grid.innerHTML = '<p style="color:var(--muted)">Žádné projekty se nepodařilo načíst.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
  } else {
    loadProjects();
  }
})();
