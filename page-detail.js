function q(k, d='') { return (document.getElementById(k) || { textContent: d }); }
function parseId() {
  const u = new URL(window.location.href);
  return Number(u.searchParams.get('id') || '0');
}
function loadData() {
  return fetch('./data/crystals.json').then(r => r.json()).catch(() => []);
}

function renderThumbs(images) {
  const wrap = document.getElementById('thumbs');
  if (!wrap) return;
  wrap.innerHTML = '';
  const list = [];
  if (!images) return;
  const candidates = [];
  if (images.full) candidates.push(images.full);
  if (images.thumb) candidates.push(images.thumb);
  if (Array.isArray(images.gallery)) candidates.push(...images.gallery);
  const uniq = [...new Set(candidates.filter(Boolean))];
  uniq.forEach((src, idx) => {
    const im = document.createElement('img');
    im.src = src;
    im.alt = `图 ${idx + 1}`;
    if (idx === 0) im.classList.add('active');
    im.addEventListener('click', () => {
      const main = document.getElementById('detailImg');
      if (main) main.src = src;
      wrap.querySelectorAll('img').forEach(x => x.classList.remove('active'));
      im.classList.add('active');
    });
    wrap.appendChild(im);
  });
}

(async function init() {
  const id = parseId();
  const data = await loadData();
  const item = data.find(x => x.id === id) || data[0];
  if (!item) return;

  const img = document.getElementById('detailImg');
  if (img) {
    if (item.images && (item.images.full || item.images.thumb)) {
      img.src = item.images.full || item.images.thumb;
    }
    img.alt = item.name || 'Crystal';
  }
  renderThumbs(item.images || {});

  q('detailName').textContent = item.name || 'Crystal';
  q('detailIntro').textContent = item.intro || '暂无介绍';
  q('detailOrigin').textContent = item.origin ? [item.origin.country, item.origin.region, item.origin.mine].filter(Boolean).join(' / ') : '未知';
  q('detailTexture').textContent = (item.texture || '—');
  q('detailFeatures').textContent = item.features ? Object.entries(item.features).map(([k,v]) => `${k}:${v}`).join('；') : '—';
  q('detailSystem').textContent = item.crystalSystem || '—';
  q('detailColors').textContent = Array.isArray(item.colors) ? item.colors.join(', ') : (item.color || '—');
})();
