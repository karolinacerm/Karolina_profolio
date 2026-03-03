(() => {
  const grid = document.getElementById('projectsGrid');
  if (!grid) {
    console.warn('#projectsGrid nenalezen');
    return;
  }

  function initAOS() {
    if (!window.AOS) return;
    window.AOS.init({
      duration: 800,
      once: true
    });
  }

  function setupDeferredVideo(video) {
    video.preload = 'none';
    video.autoplay = false;

    const startVideo = () => {
      if (video.dataset.started === 'true') return;
      video.dataset.started = 'true';
      video.preload = 'metadata';
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    if (!('IntersectionObserver' in window)) {
      startVideo();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        startVideo();
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '200px 0px' });

    observer.observe(video);
  }

  function createCard(project) {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = project.href || (project.id ? `./project.html?id=${project.id}` : '#');
    link.setAttribute('aria-label', project.ariaLabel || project.title || 'Project'); 
    
    link.setAttribute('data-aos', 'fade-up');              // typ animace
    link.setAttribute('data-aos-duration', '800');         // délka v ms
    link.setAttribute('data-aos-offset', '150');         // offset scrollu
  
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const thumbSrc = project.card?.thumb || project.card?.image || project.hero?.image || project.hero?.src;
    if (thumbSrc) {
      const isVideoThumb = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(thumbSrc);
      if (isVideoThumb) {
        const video = document.createElement('video');
        video.src = thumbSrc;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('preload', 'none');
        video.setAttribute('aria-label', project.card?.alt || project.hero?.alt || '');
        setupDeferredVideo(video);
        thumb.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.fetchPriority = 'low';
        img.src = thumbSrc;
        img.alt = project.card?.alt || project.hero?.alt || '';
        thumb.appendChild(img);
      }
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
    const inner = document.createElement('div');
    inner.className = 'card-inner';

    inner.appendChild(thumb);
    inner.appendChild(meta);

link.appendChild(inner);
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
    const res = await fetch(src, { cache: 'default' });
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

  initAOS();
})();
