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

  /* Menu 버튼: 사이드바 열기 / 닫기 */
  const menuBtn = $('#menu-btn');
  const menuClose = $('#menu-close');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  }
  if (menuClose) menuClose.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  /* 패널 형태(좁은 화면)에서는 바깥을 눌러도 닫힙니다 */
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('menu-open') || window.innerWidth > 1239) return;
    if (e.target.closest('#side') || e.target.closest('#menu-btn')) return;
    setMenu(false);
  });

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
  /* ‹ 1 … 4 5 6 … 17 › 형태의 간단한 페이지 이동 */
  const buildPager = (box, page, pages, go) => {
    box.innerHTML = '';
    if (pages < 2) return;
    const add = (label, target, cls, aria) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg' + (cls ? ' ' + cls : '');
      b.textContent = label;
      if (aria) b.setAttribute('aria-label', aria);
      if (target === null) b.disabled = true;
      else b.addEventListener('click', () => go(target));
      box.appendChild(b);
    };
    add('‹', page > 1 ? page - 1 : null, '', '이전 페이지');
    const want = new Set([1, pages, page - 1, page, page + 1]);
    let last = 0;
    for (let i = 1; i <= pages; i++) {
      if (!want.has(i)) continue;
      if (i - last > 1) {
        const dots = document.createElement('span');
        dots.className = 'pg-gap';
        dots.textContent = '…';
        box.appendChild(dots);
      }
      add(String(i), i, i === page ? 'on' : '', i + ' 페이지');
      last = i;
    }
    add('›', page < pages ? page + 1 : null, '', '다음 페이지');
  };
  $$('[data-controls]').forEach((ctrl) => {
    const scope = ctrl.parentElement;
    const list = $('[data-list]', scope);
    if (!list) {
      /* 홈(아카이브): 연도 칩 + 페이지 나누기 */
      const chipBox0 = $('.chips', ctrl);
      const groups = $$('.year-group', scope);
      if (!chipBox0 || !groups.length) return;
      groups.forEach((g) => {
        const grid = $('.grid', g);
        if (!grid) return;
        $$('.poster', grid)
          .sort((a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating))
          .forEach((c) => grid.appendChild(c));
      });
      const all = $$('.poster', scope);
      const pager0 = document.createElement('nav');
      pager0.className = 'pages';
      pager0.setAttribute('aria-label', '페이지');
      groups[groups.length - 1].after(pager0);
      let y0 = '';
      let page0 = 1;
      const draw = () => {
        const shown = all.filter((c) => !y0 || c.dataset.date.slice(0, 4) === y0);
        const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
        if (page0 > pages) page0 = pages;
        const cur = new Set(shown.slice((page0 - 1) * PER_PAGE, page0 * PER_PAGE));
        all.forEach((c) => { c.hidden = !cur.has(c); });
        groups.forEach((g) => { g.hidden = !$$('.poster', g).some((c) => !c.hidden); });
        buildPager(pager0, page0, pages, (i) => {
          page0 = i;
          draw();
          scope.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      };
      ['', ...groups.map((g) => g.dataset.year)].forEach((y) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (y === '' ? ' on' : '');
        b.textContent = y === '' ? '전체' : y;
        b.addEventListener('click', () => {
          y0 = y;
          page0 = 1;
          $$('.chip', chipBox0).forEach((c) => c.classList.toggle('on', c === b));
          draw();
        });
        chipBox0.appendChild(b);
      });
      draw();
      return;
    }
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
      $$('.divider', list).forEach((d) => d.remove());
      order.forEach((c) => list.appendChild(c));
      cards.forEach((c) => { c.hidden = true; });
      const visible = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);
      visible.forEach((c) => { c.hidden = false; });
      if (sortSel && sortSel.value === 'rating') {
        /* "4"와 "4.0"처럼 표기가 달라도 같은 별점으로 묶기 위해 숫자로 비교합니다 */
        const key = (c) => String(parseFloat(c.dataset.rating) || 0);
        const count = {};
        shown.forEach((c) => { count[key(c)] = (count[key(c)] || 0) + 1; });
        let prev = null;
        visible.forEach((c) => {
          const k = key(c);
          if (k === prev) return;
          prev = k;
          const d = document.createElement('div');
          d.className = 'divider';
          const r = parseFloat(k);
          d.innerHTML = '<span>' + (r > 0 ? '★ ' + r : '별점 없음') + '</span><small>' + count[k] + '</small>';
          list.insertBefore(d, c);
        });
      }
      buildPager(pager, page, pages, (i) => {
        page = i;
        render();
        scope.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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
