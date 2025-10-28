(() => {
  async function loadPartial(placeholder) {
    const src = placeholder.getAttribute('data-include');
    if (!src) return null;
    try {
      const res = await fetch(src);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const html = await res.text();
      const temp = document.createElement('template');
      temp.innerHTML = html.trim();
      const fragment = temp.content.cloneNode(true);
      const firstChild = fragment.firstElementChild;
      const parent = placeholder.parentNode;
      parent.replaceChild(fragment, placeholder);
      return firstChild;
    } catch (err) {
      console.error(`Nepodařilo se načíst partial "${src}":`, err);
      return null;
    }
  }

  function resolveNavHref(target) {
    const hash = `#${target}`;
    if (document.getElementById(target)) {
      return hash;
    }
    return `./index.html${hash}`;
  }

  function enhanceHeader(root) {
    if (!root) return;
    const navLinks = root.querySelectorAll('[data-nav-target]');
    navLinks.forEach(link => {
      const target = link.getAttribute('data-nav-target');
      if (!target) return;
      link.setAttribute('href', resolveNavHref(target));
    });
  }

  async function initIncludes() {
    const placeholders = Array.from(document.querySelectorAll('[data-include]'));
    const loaded = await Promise.all(placeholders.map(loadPartial));
    const header = loaded.find(node => node?.tagName === 'HEADER');
    if (header) {
      enhanceHeader(header);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIncludes);
  } else {
    initIncludes();
  }
})();
