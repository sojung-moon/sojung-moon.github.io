(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const base = document.body.dataset.base || '';
  const root = document.documentElement;

  /* 다크 모드 */
  const themeBtn = $('#theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* Menu 팝오버 */
  const menuBtn = $('#menu-btn');
  const menuPop = $('#menu-pop');
  if (menuBtn && menuPop) {
    const setOpen = (open) => {
      menuPop.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(menuPop.hidden);
    });
    document.addEventListener('click', (e) => {
      if (!menuPop.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* 검색 (빌드 때 생성되는 /search.json 사용) */
  const input = $('#q');
  const box = $('#results');
  if (input && box) {
    let data = null;
    let loading = null;
    const load = () => {
      if (!loading) {
        loading = fetch(base + '/search.json')
          .then((r) => r.json())
          .then((d) => (data = d))
          .catch(() => (data = []));
      }
      return loading;
    };
    const esc = (s) =>
      String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    const norm = (s) => String(s == null ? '' : s).toLowerCase();

    const render = async () => {
      const term = norm(input.value).trim();
      if (!term) { box.hidden = true; return; }
      await load();
      if (norm(input.value).trim() !== term) return;
      const hits = data
        .filter((p) =>
          norm([p.title, p.original, p.category, p.cname].concat(p.tags || []).join(' ')).includes(term)
        )
        .slice(0, 8);
      box.innerHTML = hits.length
        ? '<ul>' + hits.map((p) =>
            '<li><a href="' + esc(p.url) + '"><img src="' + esc(p.thumb) + '" alt="" loading="lazy">' +
            '<span><b>' + esc(p.title) + '</b><small>' + esc(p.category) +
            (p.tags && p.tags.length ? ' · ' + p.tags.map((t) => '#' + esc(t)).join(' ') : '') +
            '</small></span></a></li>'
          ).join('') + '</ul>'
        : '<p class="none">검색 결과가 없습니다.</p>';
      box.hidden = false;
    };
    input.addEventListener('input', render);
    input.addEventListener('focus', load);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { input.value = ''; box.hidden = true; }
    });
  }

  /* 연도 필터 + 정렬 + 페이지 나누기 (카테고리 페이지) */
  const PER_PAGE = 24;
  $$('[data-controls]').forEach((ctrl) => {
    const scope = ctrl.parentElement;
    const list = $('[data-list]', scope);
    if (!list) return;
    const cards = $$('.poster', list);
    const sortSel = $('.sort', ctrl);
    const chipBox = $('.chips', ctrl);
    const pager = document.createElement('nav');
    pager.className = 'pages';
    pager.setAttribute('aria-label', '페이지');
    list.after(pager);
    let year = '';
    let page = 1;
    let order = cards.slice();

    const sorters = {
      rating: (a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating),
      title: (a, b) => a.dataset.title.localeCompare(b.dataset.title, 'ko'),
    };

    const render = () => {
      const shown = order.filter((c) => !year || c.dataset.date.slice(0, 4) === year);
      const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
      if (page > pages) page = pages;
      order.forEach((c) => list.appendChild(c));
      cards.forEach((c) => { c.hidden = true; });
      shown.slice((page - 1) * PER_PAGE, page * PER_PAGE).forEach((c) => { c.hidden = false; });
      pager.innerHTML = '';
      if (pages < 2) return;
      for (let i = 1; i <= pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pg' + (i === page ? ' on' : '');
        b.textContent = i;
        if (i === page) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => {
          page = i;
          render();
          scope.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        pager.appendChild(b);
      }
    };

    if (chipBox) {
      const years = Array.from(new Set(cards.map((c) => c.dataset.date.slice(0, 4)))).sort().reverse();
      ['', ...years].forEach((y) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (y === '' ? ' on' : '');
        b.textContent = y === '' ? '전체' : y;
        b.addEventListener('click', () => {
          year = y;
          page = 1;
          $$('.chip', chipBox).forEach((c) => c.classList.toggle('on', c === b));
          render();
        });
        chipBox.appendChild(b);
      });
    }

    if (sortSel) {
      const applySort = () => { order = cards.slice().sort(sorters[sortSel.value]); page = 1; render(); };
      sortSel.addEventListener('change', applySort);
      applySort(); // 첫 항목(별점 높은순)이 기본 정렬
    } else {
      render();
    }
  });
})();
