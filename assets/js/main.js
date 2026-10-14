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
          norm([p.title, p.original, p.category].concat(p.tags || []).join(' ')).includes(term)
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

  /* 상태 필터 + 정렬 (카테고리 / 아카이브 페이지) */
  $$('[data-controls]').forEach((ctrl) => {
    const scope = ctrl.parentElement;
    const cards = $$('.poster', scope);
    const sortSel = $('.sort', ctrl);
    const list = $('[data-list]', scope);
    let status = '';

    const applyFilter = () => {
      cards.forEach((c) => { c.hidden = !!status && c.dataset.status !== status; });
      $$('.year-group', scope).forEach((g) => {
        g.hidden = !$$('.poster', g).some((c) => !c.hidden);
      });
    };

    $$('.chip', ctrl).forEach((chip) => {
      chip.addEventListener('click', () => {
        status = chip.dataset.status;
        $$('.chip', ctrl).forEach((c) => c.classList.toggle('on', c === chip));
        applyFilter();
      });
    });

    if (sortSel && list) {
      const sorters = {
        date: (a, b) => b.dataset.date.localeCompare(a.dataset.date),
        rating: (a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating),
        title: (a, b) => a.dataset.title.localeCompare(b.dataset.title, 'ko'),
      };
      sortSel.addEventListener('change', () => {
        cards.slice().sort(sorters[sortSel.value]).forEach((c) => list.appendChild(c));
      });
    }
  });
})();
