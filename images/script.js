(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  function qs(selector, scope) {
    return (scope || doc).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || doc).querySelectorAll(selector));
  }

  function setBodyLock(locked) {
    body.style.overflow = locked ? 'hidden' : '';
  }

  function openLayer(layer) {
    if (!layer) return;
    layer.hidden = false;
    setBodyLock(true);
  }

  function closeLayer(layer) {
    if (!layer) return;
    layer.hidden = true;
    setBodyLock(false);
  }

  function initMenu() {
    var menu = qs('[data-menu]');
    var open = qs('[data-menu-open]');
    var close = qs('[data-menu-close]');

    if (open) {
      open.addEventListener('click', function () {
        openLayer(menu);
        open.setAttribute('aria-expanded', 'true');
      });
    }

    if (close) {
      close.addEventListener('click', function () {
        closeLayer(menu);
        if (open) open.setAttribute('aria-expanded', 'false');
      });
    }

    if (menu) {
      qsa('a', menu).forEach(function (link) {
        link.addEventListener('click', function () {
          closeLayer(menu);
          if (open) open.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function initSearch() {
    var overlay = qs('[data-search]');
    var open = qs('[data-search-open]');
    var close = qs('[data-search-close]');

    if (open) {
      open.addEventListener('click', function () {
        openLayer(overlay);
        window.setTimeout(function () {
          var input = qs('input[type="text"]', overlay);
          if (input) input.focus();
        }, 80);
      });
    }

    if (close) {
      close.addEventListener('click', function () {
        closeLayer(overlay);
      });
    }
  }

  function initEscapeClose() {
    doc.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeLayer(qs('[data-menu]'));
      closeLayer(qs('[data-search]'));
      var menuOpen = qs('[data-menu-open]');
      if (menuOpen) menuOpen.setAttribute('aria-expanded', 'false');
    });
  }

  function initTheme() {
    var button = qs('[data-theme-toggle]');
    if (!button) return;

    button.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      localStorage.setItem('kernova-theme', next);
    });
  }

  function slugify(text, index) {
    var slug = String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[^\w가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'section-' + index;
  }

  function initTOC() {
    var content = qs('[data-article-content]');
    var toc = qs('[data-toc-container]');
    if (!content || !toc) return;

    var nav = qs('nav', toc);
    var headings = qsa('h2, h3', content).filter(function (heading) {
      return heading.textContent.trim().length > 0;
    });

    if (!nav || headings.length < 2) return;

    var used = {};
    headings.forEach(function (heading, index) {
      if (!heading.id) {
        var base = slugify(heading.textContent, index + 1);
        var id = base;
        var count = 2;
        while (used[id] || doc.getElementById(id)) {
          id = base + '-' + count;
          count += 1;
        }
        heading.id = id;
        used[id] = true;
      }

      var link = doc.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();
      link.dataset.target = heading.id;
      if (heading.tagName === 'H3') link.style.paddingLeft = '0.85rem';
      nav.appendChild(link);
    });

    toc.hidden = false;

    if (!('IntersectionObserver' in window)) return;

    var links = qsa('a', nav);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.dataset.target === entry.target.id);
        });
      });
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    headings.forEach(function (heading) {
      observer.observe(heading);
    });
  }

  function initProgress() {
    var bar = qs('#reading-progress');
    if (!bar) return;

    var ticking = false;

    function update() {
      var scrollTop = window.pageYOffset || doc.documentElement.scrollTop || 0;
      var height = doc.documentElement.scrollHeight - window.innerHeight;
      var progress = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      bar.style.width = progress + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  function cleanCategoryCounts() {
    qsa('.c_cnt').forEach(function (count) {
      count.textContent = count.textContent.replace(/[()]/g, '').trim();
    });
  }

  function normalizeDates() {
    qsa('time, .post-card__meta, .sidebar-list span').forEach(function (el) {
      el.textContent = el.textContent.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '').trim();
    });
  }

  function initExternalLinks() {
    qsa('.article-content a[href^="http"]').forEach(function (link) {
      if (link.hostname && link.hostname !== window.location.hostname) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }

  doc.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSearch();
    initEscapeClose();
    initTheme();
    initTOC();
    initProgress();
    cleanCategoryCounts();
    normalizeDates();
    initExternalLinks();
  });
})();
