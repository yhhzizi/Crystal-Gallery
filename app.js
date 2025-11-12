// 从 data/crystals.json 加载数据，支持占位图；将缩放与筛选同步到 URL 参数
const gallery = document.getElementById('gallery');
const zoomRange = document.getElementById('zoomRange');
const zoomHint = document.getElementById('zoomHint');
const filterToggle = document.getElementById('filterToggle');
const filterPanel = document.getElementById('filterPanel');
const clearFilters = document.getElementById('clearFilters');
const closeFilters = document.getElementById('closeFilters');

let DATA = [];

const state = {
  zoom: Number(zoomRange ? zoomRange.value : 3),
  filters: { region: new Set(), color: new Set(), system: new Set() }
};

function parseParams() {
  const u = new URL(window.location.href);
  const zoom = Number(u.searchParams.get('zoom')) || state.zoom;
  const region = (u.searchParams.get('region') || '').split(',').filter(Boolean);
  const color = (u.searchParams.get('color') || '').split(',').filter(Boolean);
  const system = (u.searchParams.get('system') || '').split(',').filter(Boolean);
  return { zoom, region, color, system };
}

function writeParams() {
  const u = new URL(window.location.href);
  u.searchParams.set('zoom', String(state.zoom));
  const r = [...state.filters.region].join(',');
  const c = [...state.filters.color].join(',');
  const s = [...state.filters.system].join(',');
  if (r) u.searchParams.set('region', r); else u.searchParams.delete('region');
  if (c) u.searchParams.set('color', c); else u.searchParams.delete('color');
  if (s) u.searchParams.set('system', s); else u.searchParams.delete('system');
  window.history.replaceState({}, '', u.toString());
}

function updateZoomHint() {
  const sizeMap = { 1: '最密', 2: '较密', 3: '适中', 4: '较疏', 5: '最疏' };
  if (zoomHint) zoomHint.textContent = sizeMap[state.zoom] || '';
}

function normalizeItem(src, idx) {
  // 兼容示例与真实数据字段
  return {
    id: src.id ?? (idx + 1),
    name: src.name || `Crystal ${idx + 1}`,
    region: src.region || (src.origin ? (src.origin.region || src.origin.country || 'unknown') : 'unknown'),
    color: src.color || (Array.isArray(src.colors) ? src.colors[0] : 'clear'),
    system: src.system || src.crystalSystem || 'trigonal',
    img: (src.images && (src.images.thumb || src.images.full)) || ''
  };
}

function getVisibleItems() {
  // 缩放越大，数量越少
  const divisor = { 1: 1, 2: 1.5, 3: 2, 4: 3, 5: 4 }[state.zoom] || 2;
  const base = Math.ceil(DATA.length / divisor);

  // 过滤交集逻辑
  const filtered = DATA.filter(item => {
    const { region, color, system } = state.filters;
    const matchRegion = region.size ? region.has(String(item.region).toLowerCase()) : true;
    const matchColor = color.size ? color.has(String(item.color).toLowerCase()) : true;
    const matchSystem = system.size ? system.has(String(item.system).toLowerCase()) : true;
    return matchRegion && matchColor && matchSystem;
  });

  return filtered.slice(0, base);
}

function applyEvenColumnOffset() {
  if (!gallery) return;
  const cards = gallery.querySelectorAll('.card');
  if (cards.length === 0) return;
  
  // 先清除所有偏移
  cards.forEach(card => card.classList.remove('even-column'));
  
  const firstCard = cards[0];
  const firstRect = firstCard.getBoundingClientRect();
  const cardWidth = firstRect.width;
  const gap = parseFloat(getComputedStyle(gallery).gap) || 12;
  const galleryLeft = gallery.getBoundingClientRect().left;
  
  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const relativeLeft = cardRect.left - galleryLeft;
    // 计算列索引：考虑 gap
    const columnIndex = Math.round(relativeLeft / (cardWidth + gap));
    // 偶数列（列索引从0开始，所以是奇数索引）添加偏移
    if (columnIndex % 2 === 1) {
      card.classList.add('even-column');
    }
  });
}

function render() {
  if (!gallery) return;
  const items = getVisibleItems();
  gallery.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    const img = document.createElement('img');
    img.alt = item.name;
    img.loading = 'lazy';
    
    if (item.img && item.img.trim() !== '') {
      // 有图片路径，先设置占位符，然后加载图片
      card.className = 'card placeholder';
      // 确保路径正确（如果是相对路径，确保以 ./ 开头）
      let imgPath = item.img;
      if (imgPath && !imgPath.startsWith('http') && !imgPath.startsWith('/') && !imgPath.startsWith('./')) {
        imgPath = './' + imgPath;
      }
      img.src = imgPath;
      console.log('尝试加载图片:', imgPath, '原始路径:', item.img);
      
      img.onerror = function() {
        // 图片加载失败，保持占位符显示
        console.warn('图片加载失败:', imgPath, '请检查图片是否已上传到GitHub');
        this.style.display = 'none';
      };
      
      img.onload = function() {
        // 图片加载成功，移除占位符背景，显示图片
        console.log('图片加载成功:', imgPath);
        card.classList.remove('placeholder');
        this.style.display = 'block';
      };
    } else {
      // 没有图片路径，只显示占位符
      console.warn('没有图片路径:', item.name);
      card.className = 'card placeholder';
      img.style.display = 'none';
    }
    
    card.appendChild(img);
    card.title = `${item.name}`;
    card.addEventListener('click', () => {
      window.location.href = `./detail.html?id=${item.id}`;
    });
    gallery.appendChild(card);
  });

  // 等待布局完成后，计算奇偶列并添加偏移
  requestAnimationFrame(() => {
    applyEvenColumnOffset();
  });
}

function applyFilterFromInputs() {
  const regions = [...document.querySelectorAll('input[name="region"]:checked')].map(i => i.value.toLowerCase());
  const colors = [...document.querySelectorAll('input[name="color"]:checked')].map(i => i.value.toLowerCase());
  const systems = [...document.querySelectorAll('input[name="system"]:checked')].map(i => i.value.toLowerCase());
  state.filters.region = new Set(regions);
  state.filters.color = new Set(colors);
  state.filters.system = new Set(systems);
}

function setInputsFromParams(params) {
  if (zoomRange && params.zoom) {
    zoomRange.value = String(params.zoom);
    state.zoom = params.zoom;
  }
  const map = [
    { name: 'region', values: params.region },
    { name: 'color', values: params.color },
    { name: 'system', values: params.system }
  ];
  map.forEach(({ name, values }) => {
    const lower = (values || []).map(v => v.toLowerCase());
    document.querySelectorAll(`input[name="${name}"]`).forEach(i => {
      i.checked = lower.includes(i.value.toLowerCase());
    });
  });
  applyFilterFromInputs();
}

async function loadData() {
  try {
    const res = await fetch('./data/crystals.json', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const raw = await res.json();
    DATA = raw.map((x, i) => normalizeItem(x, i));
    console.log('数据加载成功，共', DATA.length, '条记录');
    // 确保所有数据都有图片路径
    DATA.forEach(item => {
      if (!item.img || item.img.trim() === '') {
        item.img = './crystal-real.png';
        console.log('为', item.name, '添加默认图片路径');
      }
    });
  } catch (e) {
    console.error('数据加载失败:', e);
    // 兜底：若加载失败，用简单占位数据，但都添加图片路径
    DATA = Array.from({ length: 60 }).map((_, i) => ({
      id: i + 1,
      name: `Crystal ${i + 1}`,
      region: ["asia", "europe", "americas"][i % 3],
      color: ["clear", "pink", "purple", "green"][i % 4],
      system: ["hexagonal", "cubic", "trigonal"][i % 3],
      img: './crystal-real.png'
    }));
    console.warn('使用兜底数据，共', DATA.length, '条记录');
  }
}

// 事件绑定
if (zoomRange) {
  zoomRange.addEventListener('input', e => {
    state.zoom = Number(e.target.value);
    updateZoomHint();
    writeParams();
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
    writeParams();
    render();
  });
}

if (clearFilters) {
  clearFilters.addEventListener('click', () => {
    document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(i => i.checked = false);
    applyFilterFromInputs();
    writeParams();
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
(async function init() {
  const params = parseParams();
  setInputsFromParams(params);
  updateZoomHint();
  await loadData();
  render();
  writeParams();

  // 窗口大小改变时重新计算奇偶列偏移
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyEvenColumnOffset();
    }, 150);
  });
})();
