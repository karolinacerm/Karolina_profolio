(() => {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  const article = document.querySelector('[data-project]');
  const emptyState = document.querySelector('[data-empty-state]');

  if (!article || !emptyState) {
    console.error('Project template chybí v project.html');
    return;
  }

  const getField = name => article.querySelector(`[data-field="${name}"]`);
  const getBlock = name => article.querySelector(`[data-block="${name}"]`);

  function splitParagraphs(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.flatMap(splitParagraphs);
    }
    if (typeof value === 'string') {
      return value
        .split(/\r?\n{2,}/)
        .map(line => line.trim())
        .filter(Boolean);
    }
    if (typeof value === 'object' && value.body) {
      return splitParagraphs(value.body);
    }
    return [];
  }

  function parseProjects(data) {
    if (!data) return [];
    if (Array.isArray(data.projects)) return data.projects;
    if (Array.isArray(data)) return data;
    return [];
  }

  function parseData(text, fallback = '{}') {
    const source = (text || '').trim();
    if (!source) {
      return JSON.parse(fallback);
    }
    if (window.jsyaml && typeof window.jsyaml.load === 'function') {
      return window.jsyaml.load(source);
    }
    return JSON.parse(source);
  }

  async function fetchProjects(src) {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = parseData(text);
    const projects = parseProjects(parsed);
    if (!projects.length) {
      throw new Error('Projects data is empty');
    }
    return projects;
  }

  function renderDetails(details) {
    const container = getField('details');
    if (!container) return;
    if (!details || typeof details !== 'object') {
      container.remove();
      return;
    }

    const entries = Object.entries(details).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    });

    if (!entries.length) {
      container.remove();
      return;
    }

    container.innerHTML = '';
    entries.forEach(([label, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = Array.isArray(value) ? value.join(' · ') : value;
      container.appendChild(dt);
      container.appendChild(dd);
    });
  }

  function createParagraphs(paragraphs, container) {
    paragraphs.forEach(text => {
      if (!text) return;
      const p = document.createElement('p');
      p.textContent = text;
      container.appendChild(p);
    });
  }

  function createFigure(src, alt) {
    const figure = document.createElement('figure');
    figure.className = 'block block--image';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    img.alt = alt || '';
    figure.appendChild(img);
    return figure;
  }

  function createCaption(text) {
    if (!text) return null;
    const p = document.createElement('p');
    p.className = 'block-caption';
    p.textContent = text;
    return p;
  }

  function renderContent(blocks) {
    const wrapper = getField('content');
    if (!wrapper) return;
    if (!Array.isArray(blocks) || !blocks.length) {
      wrapper.remove();
      return;
    }

    wrapper.innerHTML = '';
    blocks.forEach(block => {
      if (!block || typeof block !== 'object') return;
      const type = (block.type || '').toLowerCase();
      const paragraphs = splitParagraphs(block.body || block.text || block.copy);
      const imageSrc = block.src || block.image;
      const alt = block.alt || '';
      const caption = block.caption;

      if ((type === 'image' || (!paragraphs.length && imageSrc)) && imageSrc) {
        const figure = createFigure(imageSrc, alt);
        wrapper.appendChild(figure);
        const cap = createCaption(caption);
        if (cap) wrapper.appendChild(cap);
        return;
      }

      if ((type === 'textimage' || (paragraphs.length && imageSrc)) && imageSrc) {
        const combo = document.createElement('div');
        combo.className = 'block block--text-image';
        createParagraphs(paragraphs, combo);
        const figure = createFigure(imageSrc, alt);
        combo.appendChild(figure);
        const cap = createCaption(caption);
        if (cap) combo.appendChild(cap);
        wrapper.appendChild(combo);
        return;
      }

      if (!paragraphs.length) return;
      const textBlock = document.createElement('div');
      textBlock.className = 'block block--text';
      createParagraphs(paragraphs, textBlock);
      wrapper.appendChild(textBlock);
    });

    if (!wrapper.children.length) {
      wrapper.remove();
    }
  }

  function renderLinks(links) {
    const block = getBlock('links');
    const list = block ? block.querySelector('[data-field="links"]') : null;
    if (!block || !list) return;

    if (!Array.isArray(links) || !links.length) {
      block.remove();
      return;
    }

    list.innerHTML = '';
    links.forEach(link => {
      if (!link?.url) return;
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.textContent = link.label || link.url;
      if (/^https?:\/\//i.test(link.url)) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      list.appendChild(anchor);
    });
    block.hidden = false;
  }

  function renderProject(project) {
    if (!project) {
      article.hidden = true;
      emptyState.hidden = false;
      return;
    }

    document.title = `${project.title} — Karolina C Design`;

    const titleEl = getField('title');
    if (titleEl) titleEl.textContent = project.title || 'Project';

    const metaEl = getField('meta');
    if (metaEl) {
      const meta = project.deck || (Array.isArray(project.tags) ? project.tags.join(' / ') : '');
      if (meta) {
        metaEl.textContent = meta;
      } else {
        metaEl.remove();
      }
    }

    const summaryEl = getField('summary');
    if (summaryEl) {
      if (project.summary) {
        summaryEl.textContent = project.summary;
      } else {
        summaryEl.remove();
      }
    }

    const heroBlock = getBlock('hero');
    if (heroBlock) {
      const heroImage = getField('heroImage');
      if (project.hero?.image || project.hero?.src) {
        const src = project.hero.image || project.hero.src;
        if (heroImage) {
          heroImage.src = src;
          heroImage.alt = project.hero.alt || '';
        }
        const caption = getField("heroCaption")//heroBlock.querySelector('[data-field="heroCaption"]');
        if (caption) {
          if (project.hero.caption) {
            caption.textContent = project.hero.caption;
          } else {
            caption.remove();
          }
        }
        heroBlock.hidden = false;
      } else {
        heroBlock.remove();
      }
    }

    renderDetails(project.details || project.meta);
    renderContent(project.content);
    renderLinks(project.links);

    article.hidden = false;
    emptyState.hidden = true;
  }

  async function init() {
    if (!projectId) {
      renderProject(null);
      return;
    }

    const src = './projects.yaml';
    const inline = document.getElementById('projects-data');

    try {
      const projects = await fetchProjects(src);
      const project = projects.find(item => item.id === projectId);
      renderProject(project || null);
    } catch (err) {
      console.warn('Fetch project selhal, zkusím inline data:', err);
      if (inline) {
        try {
          const text = inline.textContent || '';
          const fallback = parseData(text, '[]');
          const projects = parseProjects(fallback);
          const project = projects.find(item => item.id === projectId);
          renderProject(project || null);
          return;
        } catch (parseErr) {
          console.error('Inline data má chybný formát:', parseErr);
        }
      }
      renderProject(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
