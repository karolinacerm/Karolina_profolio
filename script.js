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
  
    // ← přidej AOS atributy ↓
    link.setAttribute('data-aos', 'fade-up');              // typ animace
    link.setAttribute('data-aos-duration', '800');         // délka v ms
    link.setAttribute('data-aos-offset', '150');         // offset scrollu
  
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const thumbSrc = project.card?.thumb || project.card?.image || project.hero?.image || project.hero?.src;
    if (thumbSrc) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = thumbSrc;
      img.alt = project.card?.alt || project.hero?.alt || '';
      thumb.appendChild(img);
    } else {
      thumb.textContent = '4:3';
    }
  
    const meta = document.createElement('div');
    meta.className = 'meta';
  
    const title = document.createElement('p');
    title.className = 'title';
    title.textContent = project.title || 'Untitled';
  
    meta.appendChild(title);
  
    if (project.summary) {
      const summary = document.createElement('p');
      summary.className = 'summary';
      summary.textContent = project.summary;
      meta.appendChild(summary);
    }
  
    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.setAttribute('aria-label', 'Tags');
    (project.tags || []).forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tags.appendChild(span);
    });
  
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

  function parseProjects(data) {
    if (!data) return [];
    if (Array.isArray(data?.projects)) return data.projects;
    if (Array.isArray(data)) return data;
    return [];
  }

  async function fetchProjects(src) {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = window.jsyaml ? window.jsyaml.load(text) : JSON.parse(text);
    const projects = parseProjects(parsed);
    if (!projects.length) {
      throw new Error('projects data: očekávám pole projektů');
    }
    return projects;
  }

  async function loadProjects() {
    const src = grid.getAttribute('data-src') || './projects.yaml';
    const inline = document.getElementById('projects-data');

    try {
      const projects = await fetchProjects(src);
      renderProjects(projects);
      console.info(`Načteno ${projects.length} projektů`);
      return;
    } catch (err) {
       console.warn('Fetch selhal, zkouším inline data:', err);
      if (inline) {
        try {
          const text = inline.textContent || '';
          const fallback = window.jsyaml ? window.jsyaml.load(text) : JSON.parse(text || '[]');
          const projects = parseProjects(fallback);
          if (projects.length) {
            renderProjects(projects);
            return;
          }
        } catch (parseErr) {
          console.error('Inline data má chybný formát:', parseErr);
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

  // — až TEĎ inicializuj AOS —
  AOS.init({
    duration: 800,
    once: false
  });
})();

