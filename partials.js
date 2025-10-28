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

    const navmenu = root.querySelector('[data-navmenu]');
    if (navmenu) {
      const trigger = navmenu.querySelector('.hamburger');
      const overlay = navmenu.querySelector('.overlay');
      const closeBtn = navmenu.querySelector('.close');
      const closeLinks = navmenu.querySelectorAll('[data-nav-close]');

      const setExpanded = value => {
        if (trigger) {
          trigger.setAttribute('aria-expanded', String(value));
          trigger.setAttribute('aria-label', value ? 'Close menu' : 'Open menu');
        }
      };

      const finishClose = () => {
        navmenu.classList.remove('is-closing');
        if (overlay) overlay.setAttribute('hidden', '');
        document.body.classList.remove('navmenu-open');
      };

      let pendingCloseHandler = null;

      const closeNav = () => {
        if (!navmenu.classList.contains('is-open') || navmenu.classList.contains('is-closing')) return;
        navmenu.classList.add('is-closing');
        navmenu.classList.remove('is-open');
        setExpanded(false);
        if (!overlay) {
          finishClose();
          return;
        }

        const handler = event => {
          if (event.target !== overlay || event.propertyName !== 'transform') return;
          overlay.removeEventListener('transitionend', handler);
          pendingCloseHandler = null;
          finishClose();
        };
        overlay.addEventListener('transitionend', handler, { once: true });
        pendingCloseHandler = handler;
        window.setTimeout(() => {
          if (navmenu.classList.contains('is-closing')) {
            overlay.removeEventListener('transitionend', handler);
            pendingCloseHandler = null;
            finishClose();
          }
        }, 700);
      };

      const openNav = () => {
        if (navmenu.classList.contains('is-open')) return;
        overlay?.removeAttribute('hidden');
        requestAnimationFrame(() => {
          if (pendingCloseHandler && overlay) {
            overlay.removeEventListener('transitionend', pendingCloseHandler);
            pendingCloseHandler = null;
          }
          navmenu.classList.remove('is-closing');
          navmenu.classList.add('is-open');
          document.body.classList.add('navmenu-open');
          setExpanded(true);
        });
      };

      trigger?.addEventListener('click', () => {
        if (navmenu.classList.contains('is-open')) {
          closeNav();
        } else {
          openNav();
        }
      });

      closeBtn?.addEventListener('click', closeNav);
      closeLinks.forEach(link => {
        link.addEventListener('click', closeNav);
      });

      overlay?.addEventListener('click', event => {
        if (event.target === overlay) {
          closeNav();
        }
      });

      if (!document.body.dataset.navmenuEsc) {
        document.body.dataset.navmenuEsc = '1';
        document.addEventListener('keydown', evt => {
          if (evt.key === 'Escape') {
            closeNav();
          }
        });
      }
    }
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
