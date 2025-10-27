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

  function normalizeMarkdown(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map(normalizeMarkdown).filter(Boolean).join('\n\n');
    }
    if (typeof value === 'object') {
      if (value.body !== undefined) return normalizeMarkdown(value.body);
      if (value.text !== undefined) return normalizeMarkdown(value.text);
      if (value.copy !== undefined) return normalizeMarkdown(value.copy);
      if (value.paragraph !== undefined) return normalizeMarkdown(value.paragraph);
      if (value.value !== undefined) return normalizeMarkdown(value.value);
    }
    return '';
  }

  function renderMarkdown(container, markdown, { inline = false } = {}) {
    const source = normalizeMarkdown(markdown);
    if (!source) return false;
    const marked = window.marked;
    if (marked && typeof marked === 'object') {
      if (inline && typeof marked.parseInline === 'function') {
        container.innerHTML = marked.parseInline(source);
      } else if (typeof marked.parse === 'function') {
        container.innerHTML = marked.parse(source);
      } else {
        container.textContent = source;
      }
    } else {
      container.textContent = source;
    }
    return container.innerHTML !== '' || container.textContent !== '';
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
    const source = normalizeMarkdown(text).trim();
    if (!source) return null;
    const p = document.createElement('p');
    p.className = 'block-caption';
    const marked = window.marked;
    if (marked?.parseInline) {
      p.innerHTML = marked.parseInline(source);
    } else if (marked?.parse) {
      p.innerHTML = marked.parse(source);
    } else {
      p.textContent = source;
    }
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
      const textValue =
        block.body ??
        block.text ??
        block.copy ??
        block.description ??
        block.value ??
        block.content ??
        '';
      const hasText = normalizeMarkdown(textValue).trim().length > 0;
      const imageSrc = block.src || block.image;
      const alt = block.alt || '';
      const caption = block.caption;

      if ((type === 'image' || (!hasText && imageSrc)) && imageSrc) {
        const figure = createFigure(imageSrc, alt);
        wrapper.appendChild(figure);
        const cap = createCaption(caption);
        if (cap) wrapper.appendChild(cap);
        return;
      }

      if ((type === 'textimage' || (hasText && imageSrc)) && imageSrc) {
        const combo = document.createElement('div');
        combo.className = 'block block--text-image';
        if (hasText) {
          const textBlock = document.createElement('div');
          textBlock.className = 'block block--text';
          if (renderMarkdown(textBlock, textValue)) {
            combo.appendChild(textBlock);
          }
        }
        const figure = createFigure(imageSrc, alt);
        combo.appendChild(figure);
        const cap = createCaption(caption);
        if (cap) combo.appendChild(cap);
        wrapper.appendChild(combo);
        return;
      }

      if (!hasText) return;
      const textBlock = document.createElement('div');
      textBlock.className = 'block block--text';
      if (renderMarkdown(textBlock, textValue)) {
        wrapper.appendChild(textBlock);
      }
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
