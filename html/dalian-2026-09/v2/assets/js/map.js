(() => {
  const data = window.DALIAN_TRIP;
  const config = window.TRIP_MAP_CONFIG || {};
  const queryDay = new URLSearchParams(location.search).get('day');
  const state = { day: data.days[queryDay] ? queryDay : 'd1', mode: 'plan', map: null, placeSearch: null, resolved: new Map(), markers: [], segmentLines: [], selected: null, renderToken: 0 };
  const typeIcon = { stay: '⌂', food: '■', sight: '●', coffee: '◆', market: '⬡' };
  const typeName = { stay: '住/夜景', food: '餐饮', sight: '景点', coffee: '咖啡', market: '市场/雨天' };
  document.head.insertAdjacentHTML('beforeend', '<style>.segment-route{display:block;width:100%;margin-top:10px;padding:11px;border:1px solid #c6e1e3;border-radius:10px;background:#eef8f8;color:#075b70;text-align:center;font-size:13px;font-weight:850}</style>');
  const error = (message) => { const el = document.querySelector('#map-error'); el.textContent = message; el.classList.remove('hidden'); };
  const esc = (value) => String(value || '').replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));

  function getStop(item) {
    if (item.ref === 'stay') return { ...data.origin, ...item, name: data.origin.name, query: data.origin.query };
    return item;
  }
  function currentItems() {
    const day = data.days[state.day];
    return state.mode === 'plan' ? day.stops.map(getStop) : day.candidates.map((x, i) => ({ ...x, id: `candidate-${state.day}-${i}`, time: '备选', label: x.name }));
  }
  function setDay(id) { state.day = id; state.mode = 'plan'; state.selected = null; closeDrawer(); render(); }
  function renderSwitches() {
    const list = document.querySelector('#day-switches');
    list.innerHTML = Object.entries(data.days).map(([id, day]) => `<button class="switch ${id === state.day ? 'active' : ''}" data-day="${id}">${day.label}</button>`).join('');
    list.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => setDay(el.dataset.day)));
    document.querySelector('#plan-mode').classList.toggle('active', state.mode === 'plan');
    document.querySelector('#candidate-mode').classList.toggle('active', state.mode === 'candidate');
  }
  function renderSheet() {
    const day = data.days[state.day];
    const items = currentItems();
    document.documentElement.style.setProperty('--day', day.color);
    document.querySelector('#sheet-title').textContent = state.mode === 'plan' ? `${day.label} · ${day.title}` : `${day.label} · 候选点`;
    document.querySelector('#sheet-note').textContent = state.mode === 'plan' ? '按时间从上往下走；点步骤或地图编号查看详情。' : '仅当主选排队、下雨或临时补给时使用；不会混进确认路线。';
    const box = document.querySelector('#route-steps');
    box.innerHTML = items.map((item, index) => `<button class="route-step ${state.selected === item.id ? 'selected' : ''}" data-id="${esc(item.id)}"><span class="badge">${state.mode === 'plan' ? index + 1 : typeIcon[item.kind] || '•'}</span><span><b>${esc(item.label || item.name)}</b><small>${esc(item.time || '备选')} · ${typeName[item.kind] || '点位'}${item.budget ? ` · ${esc(item.budget)}` : ''}</small></span></button>`).join('');
    box.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', () => showItem(currentItems().find(x => x.id === el.dataset.id))));
  }
  function showItem(item) {
    if (!item) return;
    state.selected = item.id;
    renderSheet();
    const poi = state.resolved.get(item.id);
    if (poi && state.map) state.map.setZoomAndCenter(16, poi.location);
    const address = poi?.address ? `${poi.district || ''}${poi.address}` : '正在按高德结果核对位置';
    const url = poi?.location ? `https://uri.amap.com/marker?position=${poi.location.lng},${poi.location.lat}&name=${encodeURIComponent(item.name)}&coordinate=gaode&callnative=1` : `https://uri.amap.com/search?keyword=${encodeURIComponent(item.query)}&city=大连`;
    const drawer = document.querySelector('#drawer');
    const index = currentItems().findIndex(x => x.id === item.id);
    drawer.innerHTML = `<button class="drawer-close" aria-label="收起">×</button><span class="drawer-tag">${typeName[item.kind] || '点位'} · ${esc(data.days[state.day].label)}</span><h2>${typeIcon[item.kind] || '•'} ${esc(item.label || item.name)}</h2><div class="fact"><div><b>时间 / 预算</b><span>${esc(item.time || '候选')}${item.budget ? ` · ${esc(item.budget)}` : ''}</span></div><div><b>高德位置</b><span>${esc(address)}</span></div></div><p>${esc(item.info || item.reason || '按当天实际情况选择。')}</p>${item.fallback ? `<p><b>替换：</b>${esc(item.fallback)}</p>` : ''}${state.mode === 'plan' && index > 0 ? `<button class="segment-route" data-segment="${index}">查看上一段真实高德路线</button>` : ''}<a class="navigate" target="_blank" rel="noopener" href="${url}">在高德中核对 / 导航 ↗</a>`;
    drawer.classList.add('open');
    drawer.querySelector('.drawer-close').addEventListener('click', closeDrawer);
    drawer.querySelector('[data-segment]')?.addEventListener('click', () => drawSegment(index));
  }
  function closeDrawer() { document.querySelector('#drawer').classList.remove('open'); state.selected = null; }
  function clearMap() { state.map.remove(state.markers); state.map.remove(state.segmentLines); state.markers = []; state.segmentLines = []; }
  function findPoi(item) {
    if (state.resolved.has(item.id)) return Promise.resolve(state.resolved.get(item.id));
    return new Promise(resolve => state.placeSearch.search(item.query, (status, result) => {
      const poi = status === 'complete' ? result?.poiList?.pois?.[0] : null;
      if (poi?.location) state.resolved.set(item.id, poi);
      resolve(poi || null);
    }));
  }
  function markerHtml(index, item, color) { return `<div style="width:32px;height:32px;border:3px solid #fff;border-radius:50%;background:${color};box-shadow:0 2px 8px #16333a55;color:#fff;display:grid;place-items:center;font:800 13px -apple-system,BlinkMacSystemFont,'PingFang SC'">${state.mode === 'plan' ? index + 1 : typeIcon[item.kind] || '•'}</div>`; }
  async function drawSegment(index) {
    const items = currentItems();
    const [from, to] = await Promise.all([findPoi(items[index - 1]), findPoi(items[index])]);
    if (!from?.location || !to?.location || state.mode !== 'plan') return;
    state.map.remove(state.segmentLines); state.segmentLines = [];
    const driving = new AMap.Driving({ policy: AMap.DrivingPolicy.LEAST_TIME, hideMarkers: true });
    driving.search(from.location, to.location, (status, result) => {
      const path = status === 'complete' ? result?.routes?.[0]?.steps?.flatMap(step => step.path || []) : [];
      if (!path?.length) return;
      const line = new AMap.Polyline({ path, isOutline: true, outlineColor: '#fff', borderWeight: 2, strokeColor: data.days[state.day].color, strokeOpacity: .9, strokeWeight: 6, lineJoin: 'round' });
      state.segmentLines = [line]; state.map.add(line); state.map.setFitView([line], false, [80, 70, 260, 70]);
    });
  }
  async function renderMap() {
    clearMap();
    const items = currentItems();
    const token = ++state.renderToken;
    const color = data.days[state.day].color;
    const valid = [];
    await Promise.all(items.map(async (item, index) => {
      const poi = await findPoi(item);
      if (token !== state.renderToken || !poi?.location) return;
      valid.push(poi);
      const marker = new AMap.Marker({ position: poi.location, content: markerHtml(index, item, color), offset: new AMap.Pixel(-16, -16), anchor: 'center', zIndex: 120 });
      marker.on('click', () => showItem(item));
      state.markers.push(marker);
      state.map.add(marker);
    }));
    if (valid.length) state.map.setFitView(state.markers, false, [80, 70, 240, 70]);
  }
  async function render() { renderSwitches(); renderSheet(); await renderMap(); }
  function boot() {
    state.map = new AMap.Map('amap', { viewMode: '2D', zoom: 12, center: [121.62, 38.91], mapStyle: 'amap://styles/normal', resizeEnable: true });
    AMap.plugin(['AMap.PlaceSearch', 'AMap.Driving'], () => { state.placeSearch = new AMap.PlaceSearch({ city: data.city, citylimit: true, pageSize: 1, extensions: 'base' }); render(); });
    state.map.on('click', closeDrawer);
    document.querySelector('#plan-mode').addEventListener('click', () => { state.mode = 'plan'; closeDrawer(); render(); });
    document.querySelector('#candidate-mode').addEventListener('click', () => { state.mode = 'candidate'; closeDrawer(); render(); });
  }
  function loadMap() {
    if (!config.amapKey || !config.serviceHost) { error('地图安全代理尚未配置完成。攻略时间轴仍可用；地图上线前不会写入任何安全密钥。'); return; }
    window._AMapSecurityConfig = { serviceHost: config.serviceHost };
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(config.amapKey)}&plugin=AMap.PlaceSearch,AMap.Driving`;
    script.onload = boot;
    script.onerror = () => error('高德地图加载失败，请检查域名白名单与代理配置。');
    document.head.appendChild(script);
  }
  loadMap();
})();
