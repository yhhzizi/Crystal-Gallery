// 简易数据与占位策略（后续可替换为真实 data/crystals.json 加载）
const DATA = Array.from({ length: 120 }).map((_, i) => ({
  id: i + 1,
  name: `Crystal ${i + 1}`,
  region: ["asia", "europe", "americas"][i % 3],
  color: ["clear", "pink", "purple", "green"][i % 4],
  system: ["hexagonal", "cubic", "trigonal"][i % 3],
  img: null // 使用占位图
}));

const gallery = document.getElementById('gallery');
const zoomRange = document.getElementById('zoomRange');
const zoomHint = document.getElementById('zoomHint');
const filterToggle = document.getElementById('filterToggle');
const filterPanel = document.getElementById('filterPanel');
const clearFilters = document.getElementById('clearFilters');
const closeFilters = document.getElementById('closeFilters');

const state = {
  zoom: Number(zoomRange ? zoomRange.value : 3),
  filters: { region: new Set(), color: new Set(), system: new Set() }
};

function updateZoomHint() {
  const sizeMap = { 1: '最密', 2: '较密', 3: '适中', 4: '较疏', 5: '最疏' };
  if (zoomHint) zoomHint.textContent = sizeMap[state.zoom] || '';
}

function getVisibleItems() {
  // 缩放越大，数量越少
  const divisor = { 1: 1, 2: 1.5, 3: 2, 4: 3, 5: 4 }[state.zoom] || 2;
  const base = Math.ceil(DATA.length / divisor);

  // 过滤交集逻辑
  const filtered = DATA.filter(item => {
    const { region, color, system } = state.filters;
    const matchRegion = region.size ? region.has(item.region) : true;
    const matchColor = color.size ? color.has(item.color) : true;
    const matchSystem = system.size ? system.has(item.system) : true;
    return matchRegion && matchColor && matchSystem;
  });

  return filtered.slice(0, base);
}

function render() {
  if (!gallery) return;
  const items = getVisibleItems();
  gallery.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card placeholder';
    const img = document.createElement('img');
    img.alt = item.name;
    img.loading = 'lazy';
    // 若有真实图片：img.src = item.img
    // 这里保持空，让 CSS 背景作为占位
    card.appendChild(img);
    card.title = `${item.name}`;
    card.addEventListener('click', () => {
      window.location.href = `./detail.html?id=${item.id}`;
    });
    gallery.appendChild(card);
  });
}

function applyFilterFromInputs() {
  const regions = [...document.querySelectorAll('input[name="region"]:checked')].map(i => i.value);
  const colors = [...document.querySelectorAll('input[name="color"]:checked')].map(i => i.value);
  const systems = [...document.querySelectorAll('input[name="system"]:checked')].map(i => i.value);
  state.filters.region = new Set(regions);
  state.filters.color = new Set(colors);
  state.filters.system = new Set(systems);
}

// 事件绑定
if (zoomRange) {
  zoomRange.addEventListener('input', e => {
    state.zoom = Number(e.target.value);
    updateZoomHint();
    render();
  });
}

if (filterToggle && filterPanel) {
  filterToggle.addEventListener('click', () => {
    const isHidden = filterPanel.hasAttribute('hidden');
    if (isHidden) {
      filterPanel.removeAttribute('hidden');
      filterToggle.setAttribute('aria-expanded', 'true');
    } else {
      filterPanel.setAttribute('hidden', '');
      filterToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

if (filterPanel) {
  filterPanel.addEventListener('change', () => {
    applyFilterFromInputs();
    render();
  });
}

if (clearFilters) {
  clearFilters.addEventListener('click', () => {
    document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(i => i.checked = false);
    applyFilterFromInputs();
    render();
  });
}

if (closeFilters && filterPanel) {
  closeFilters.addEventListener('click', () => {
    filterPanel.setAttribute('hidden', '');
    filterToggle && filterToggle.setAttribute('aria-expanded', 'false');
  });
}

// 初始化
updateZoomHint();
render();
