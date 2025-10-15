const categoryTitle = document.getElementById('categoryTitle');
const grid = document.getElementById('categoryGrid');

function parseQuery() {
  const u = new URL(window.location.href);
  return {
    category: u.searchParams.get('category') || 'default'
  };
}

function loadData() {
  return fetch('./data/crystals.json')
    .then(r => r.json())
    .catch(() => []);
}

function renderList(list) {
  grid.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card placeholder';
    const img = document.createElement('img');
    img.alt = item.name;
    img.loading = 'lazy';
    card.title = item.name;
    card.addEventListener('click', () => {
      window.location.href = `./detail.html?id=${item.id}`;
    });
    card.appendChild(img);
    grid.appendChild(card);
  });
}

(async function init() {
  const { category } = parseQuery();
  if (categoryTitle) categoryTitle.textContent = `当前类别：${category}`;
  const data = await loadData();
  const list = data.filter(it => (it.categoryId || 'default') === category);
  renderList(list.length ? list : data.slice(0, 30));
})();
