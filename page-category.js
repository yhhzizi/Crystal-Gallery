const categoryTitle = document.getElementById('categoryTitle');
const grid = document.getElementById('categoryGrid');
const sortBy = document.getElementById('sortBy');
const countHint = document.getElementById('countHint');
const backHome = document.getElementById('backHome');
const loadHint = document.getElementById('loadHint');

function parseQuery() {
  const u = new URL(window.location.href);
  return {
    category: u.searchParams.get('category') || 'default',
    zoom: u.searchParams.get('zoom') || '',
    region: u.searchParams.get('region') || '',
    color: u.searchParams.get('color') || '',
    system: u.searchParams.get('system') || ''
  };
}

function writeBackHomeLink(params) {
  if (!backHome) return;
  const base = new URL('./index.html', window.location.href);
  if (params.zoom) base.searchParams.set('zoom', params.zoom);
  if (params.region) base.searchParams.set('region', params.region);
  if (params.color) base.searchParams.set('color', params.color);
  if (params.system) base.searchParams.set('system', params.system);
  backHome.href = base.toString();
}

function loadData() {
  return fetch('./data/crystals.json')
    .then(r => r.json())
    .catch(() => []);
}

function applySort(list, key) {
  const k = key || 'id';
  const cp = list.slice();
  cp.sort((a, b) => {
    if (k === 'id') return (a.id || 0) - (b.id || 0);
    const av = (a[k] || '').toString();
    const bv = (b[k] || '').toString();
    return av.localeCompare(bv, 'zh-Hans-CN');
  });
  return cp;
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card placeholder';
  const img = document.createElement('img');
  img.alt = item.name;
  img.loading = 'lazy';
  if (item.images && (item.images.thumb || item.images.full)) {
    img.src = item.images.thumb || item.images.full;
  }
  card.title = item.name;
  card.addEventListener('click', () => {
    window.location.href = `./detail.html?id=${item.id}`;
  });
  card.appendChild(img);
  return card;
}

let ALL = [];
let VISIBLE = 0;
const PAGE_SIZE = 24;

function renderMore() {
  const next = ALL.slice(VISIBLE, VISIBLE + PAGE_SIZE);
  next.forEach(it => grid.appendChild(createCard(it)));
  VISIBLE += next.length;
  if (countHint) countHint.textContent = `已显示 ${VISIBLE} / 共 ${ALL.length}`;
  if (loadHint) loadHint.textContent = (VISIBLE >= ALL.length) ? '已加载全部' : '下拉加载更多…';
}

function onScroll() {
  const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200);
  if (nearBottom && VISIBLE < ALL.length) renderMore();
}

(async function init() {
  const params = parseQuery();
  writeBackHomeLink(params);
  const raw = await loadData();
  const list = raw.filter(it => (it.categoryId || 'default') === params.category);
  ALL = applySort(list.length ? list : raw.slice(0, 60), (sortBy && sortBy.value) || 'id');
  grid.innerHTML = '';
  VISIBLE = 0;
  renderMore();

  window.addEventListener('scroll', onScroll);
  if (sortBy) {
    sortBy.addEventListener('change', () => {
      ALL = applySort(ALL, sortBy.value);
      grid.innerHTML = '';
      VISIBLE = 0;
      renderMore();
    });
  }
})();
