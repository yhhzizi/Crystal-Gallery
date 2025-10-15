function q(k, d='') { return (document.getElementById(k) || { textContent: d }); }
function parseId() {
  const u = new URL(window.location.href);
  return Number(u.searchParams.get('id') || '0');
}
function loadData() {
  return fetch('./data/crystals.json').then(r => r.json()).catch(() => []);
}

(async function init() {
  const id = parseId();
  const data = await loadData();
  const item = data.find(x => x.id === id) || data[0];
  if (!item) return;

  const img = document.getElementById('detailImg');
  if (img) {
    if (item.images && item.images.full) {
      img.src = item.images.full;
    }
    img.alt = item.name || 'Crystal';
  }
  q('detailName').textContent = item.name || 'Crystal';
  q('detailIntro').textContent = item.intro || '暂无介绍';
  q('detailOrigin').textContent = item.origin ? [item.origin.country, item.origin.region, item.origin.mine].filter(Boolean).join(' / ') : '未知';
  q('detailTexture').textContent = (item.texture || '—');
  q('detailFeatures').textContent = item.features ? Object.entries(item.features).map(([k,v]) => `${k}:${v}`).join('；') : '—';
  q('detailSystem').textContent = item.crystalSystem || '—';
  q('detailColors').textContent = Array.isArray(item.colors) ? item.colors.join(', ') : (item.color || '—');
})();
