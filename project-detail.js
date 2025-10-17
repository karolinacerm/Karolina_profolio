(() => {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  const article = document.querySelector('[data-project]');
  const emptyState = document.querySelector('[data-empty-state]');

  if (!article || !emptyState) {
    console.error('Project template chybí v project.html');
    return;
  }

  function setText(el, value) {
    if (!el) return;
    if (value) {
      el.textContent = value;
    } else {
      el.remove();
    }
  }

  function renderProject(project) {
    if (!project) {
      emptyState.hidden = false;
      article.hidden = true;
      return;
    }

    document.title = `${project.title} — Karolina C Design`;
    const categoriesEl = article.querySelector('[data-field="categories"]');
    const categories = (project.categories || project.tags || []).filter(Boolean);
    if (categoriesEl) {
      if (categories.length) {
        categoriesEl.textContent = categories.join(' / ');
      } else {
        categoriesEl.remove();
      }
    }

    setText(article.querySelector('[data-field="title"]'), project.title || 'Project');
    setText(article.querySelector('[data-field="summary"]'), project.summary);

    const heroSection = article.querySelector('[data-block="hero"]');
    if (heroSection) {
      const hero = project.hero;
      if (hero?.src) {
        const img = heroSection.querySelector('[data-field="heroImage"]');
        if (img) {
          img.src = hero.src;
          img.alt = hero.alt || '';
        }
        const caption = heroSection.querySelector('[data-field="heroCaption"]');
        if (caption) {
          if (hero.caption) {
            caption.textContent = hero.caption;
          } else {
            caption.remove();
          }
        }
        heroSection.hidden = false;
      } else {
        heroSection.remove();
      }
    }

    const descEl = article.querySelector('[data-field="description"]');
    if (descEl) {
      const paragraphs = Array.isArray(project.description) ? project.description : [];
      if (paragraphs.length) {
        descEl.innerHTML = '';
        paragraphs.forEach(text => {
          const p = document.createElement('p');
          p.textContent = text;
          descEl.appendChild(p);
        });
      } else {
        descEl.remove();
      }
    }

    const metaEl = article.querySelector('[data-field="meta"]');
    if (metaEl) {
      const meta = project.meta;
      if (meta && typeof meta === 'object' && Object.keys(meta).length) {
        metaEl.innerHTML = '';
        Object.entries(meta).forEach(([label, value]) => {
          const dt = document.createElement('dt');
          dt.textContent = label;
          const dd = document.createElement('dd');
          dd.textContent = Array.isArray(value) ? value.join(', ') : value;
          metaEl.appendChild(dt);
          metaEl.appendChild(dd);
        });
      } else {
        metaEl.remove();
      }
    }

    const gallerySection = article.querySelector('[data-block="gallery"]');
    if (gallerySection) {
      const galleryGrid = gallerySection.querySelector('[data-field="gallery"]');
      const gallery = Array.isArray(project.gallery) ? project.gallery : [];
      if (gallery.length && galleryGrid) {
        galleryGrid.innerHTML = '';
        gallery.forEach(item => {
          if (!item?.src) return;
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.decoding = 'async';
          img.src = item.src;
          img.alt = item.alt || '';
          galleryGrid.appendChild(img);
        });
        gallerySection.hidden = false;
      } else {
        gallerySection.remove();
      }
    }

    const linksSection = article.querySelector('[data-block="links"]');
    if (linksSection) {
      const linksList = linksSection.querySelector('[data-field="links"]');
      const links = Array.isArray(project.links) ? project.links : [];
      if (links.length && linksList) {
        linksList.innerHTML = '';
        links.forEach(link => {
          if (!link?.url) return;
          const a = document.createElement('a');
          a.href = link.url;
          a.textContent = link.label || link.url;
          if (/^https?:\/\//i.test(link.url)) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          linksList.appendChild(a);
        });
        linksSection.hidden = false;
      } else {
        linksSection.remove();
      }
    }

    emptyState.hidden = true;
    article.hidden = false;
  }

  async function loadData() {
    const inline = document.getElementById('projects-data');
    const src = './projects.json';

    if (!projectId) {
      renderProject(null);
      return;
    }

    try {
      const res = await fetch(src, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('projects.json musí být pole');
      const project = data.find(item => item.id === projectId);
      renderProject(project || null);
    } catch (err) {
      console.warn('Fetch project selhal, zkusím inline JSON:', err);
      if (inline) {
        try {
          const fallback = JSON.parse(inline.textContent || '[]');
          const project = Array.isArray(fallback) ? fallback.find(item => item.id === projectId) : null;
          renderProject(project || null);
          return;
        } catch (parseErr) {
          console.error('Inline JSON má chybný formát:', parseErr);
        }
      }
      renderProject(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
  } else {
    loadData();
  }
})();
