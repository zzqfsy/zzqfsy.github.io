(() => {
  const data = window.DALIAN_TRIP;
  const config = window.TRIP_MAP_CONFIG || {};
  const dayColor = Object.fromEntries(Object.entries(data.days).map(([id, value]) => [id, value.color]));
  const typeIcon = { stay: '⌂', food: '食', sight: '景', coffee: '咖', market: '备' };
  const typeName = { stay: '住/夜景', food: '餐饮', sight: '景点', coffee: '咖啡', market: '市场/雨天' };
  const requested = new URLSearchParams(location.search).get('day');
  const state = { day: requested === 'all' || data.days[requested] ? requested : 'd1', mode: 'plan', map: null, placeSearch: null, poi: new Map(), poiPromises: new Map(), markerList: [], routeLines: [], selected: null, preloaded: false };
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const error = message => { $('#map-error').textContent = message; $('#map-error').classList.remove('hidden'); };
  const origin = { ...data.origin, poiKey: 'stay', kind: 'stay' };

  function normalize(stop, day, index, candidate = false) {
    const item = stop.ref === 'stay' ? { ...origin, ...stop } : { ...stop };
    item.poiKey = stop.ref === 'stay' ? 'stay' : `${candidate ? 'c' : 'p'}-${day}-${index}`;
    item.day = day; item.index = index; item.candidate = candidate;
    return item;
  }
  function planFor(day) { return data.days[day].stops.map((item, index) => normalize(item, day, index)); }
  function candidatesFor(day) { return data.days[day].candidates.map((item, index) => normalize(item, day, index, true)); }
  function activeItems() {
    const keys = state.day === 'all' ? Object.keys(data.days) : [state.day];
    return keys.flatMap(day => state.mode === 'plan' ? planFor(day) : candidatesFor(day));
  }
  function allItems() { return Object.keys(data.days).flatMap(day => [...planFor(day), ...candidatesFor(day)]); }
  function visibleDays() { return state.day === 'all' ? Object.keys(data.days) : [state.day]; }
  function pointColor(item) { return state.day === 'all' ? dayColor[item.day] : dayColor[state.day]; }
  function labelFor(item) { return state.day === 'all' ? `${item.day.toUpperCase()}·${item.index + 1}` : String(item.index + 1); }

  function renderControls() {
    const buttons = [...Object.entries(data.days).map(([id, day]) => `<button class="switch ${id === state.day ? 'active' : ''}" data-day="${id}">${day.label}</button>`), `<button class="switch ${state.day === 'all' ? 'active' : ''}" data-day="all">全览</button>`];
    $('#day-switches').innerHTML = buttons.join('');
    $('#day-switches').querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => { state.day = button.dataset.day; state.mode = 'plan'; closeDrawer(); render(); }));
    $('#plan-mode').classList.toggle('active', state.mode === 'plan');
    $('#candidate-mode').classList.toggle('active', state.mode === 'candidate');
  }
  function renderSheet() {
    const items = activeItems();
    const title = state.day === 'all' ? '三天确认行程 · 全览地图' : `${data.days[state.day].label} · ${data.days[state.day].title}`;
    $('#sheet-title').textContent = state.mode === 'plan' ? title : `${state.day === 'all' ? '三天' : data.days[state.day].label} · 候选点`;
    $('#sheet-collapsed-note').textContent = state.mode === 'plan' ? `${items.length} 个确认站 · 点此展开时间轴` : `${items.length} 个备选点 · 点此展开`;
    $('#sheet-note').textContent = state.mode === 'plan' ? '彩色虚线表示行程顺序；所有 POI 已预加载，实际导航请点点位卡片。' : '候选点只在排队、下雨或临时补给时使用，不混入主线。';
    $('#route-steps').innerHTML = items.map(item => `<button class="route-step ${state.selected?.poiKey === item.poiKey ? 'selected' : ''}" data-key="${item.poiKey}"><span class="badge" style="background:${pointColor(item)}">${state.mode === 'plan' ? labelFor(item) : typeIcon[item.kind]}</span><span><b>${esc(item.label || item.name)}</b><small>${item.day.toUpperCase()} · ${esc(item.time || '备选')} · ${typeName[item.kind]}${item.budget ? ` · ${esc(item.budget)}` : ''}</small></span></button>`).join('');
    $('#route-steps').querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => showItem(items.find(item => item.poiKey === button.dataset.key))));
  }
  function markerContent(item) {
    const radius = { food: '50%', sight: '8px', coffee: '4px', market: '50%', stay: '50%' }[item.kind] || '50%';
    const style = item.kind === 'coffee' ? 'transform:rotate(45deg)' : '';
    const textStyle = item.kind === 'coffee' ? 'transform:rotate(-45deg)' : '';
    return `<div title="${esc(typeName[item.kind])}" style="min-width:32px;height:32px;padding:0 5px;border:3px solid #fff;border-radius:${radius};background:${pointColor(item)};box-shadow:0 2px 8px #16333a55;color:#fff;display:grid;place-items:center;font:800 10px -apple-system,BlinkMacSystemFont,'PingFang SC';${style}"><span style="${textStyle}">${state.mode === 'plan' ? labelFor(item) : typeIcon[item.kind]}</span></div>`;
  }
  function clearVisuals() { state.map.remove(state.markerList); state.map.remove(state.routeLines); state.markerList = []; state.routeLines = []; }
  function resolvePoi(item) {
    if (state.poi.has(item.poiKey)) return Promise.resolve(state.poi.get(item.poiKey));
    if (state.poiPromises.has(item.poiKey)) return state.poiPromises.get(item.poiKey);
    const promise = new Promise(resolve => state.placeSearch.search(item.query, (status, result) => {
      const poi = status === 'complete' ? result?.poiList?.pois?.[0] : null;
      if (poi?.location) state.poi.set(item.poiKey, poi);
      resolve(poi || null);
    }));
    state.poiPromises.set(item.poiKey, promise); return promise;
  }
  async function preloadPois() {
    const unique = [...new Map(allItems().map(item => [item.poiKey, item])).values()];
    await Promise.all(unique.map(resolvePoi));
    state.preloaded = true; $('#map-status').textContent = 'POI 已就绪';
  }
  function routePath(day) { return planFor(day).map(item => state.poi.get(item.poiKey)?.location).filter(Boolean); }
  function drawRoutes() {
    visibleDays().forEach(day => {
      const path = routePath(day);
      if (path.length < 2) return;
      const line = new AMap.Polyline({ path, isOutline: true, outlineColor: '#fff', borderWeight: 2, strokeColor: dayColor[day], strokeOpacity: .86, strokeWeight: 6, strokeStyle: 'dashed', strokeDasharray: [10, 7], lineJoin: 'round', zIndex: 20 });
      state.routeLines.push(line); state.map.add(line);
    });
  }
  async function renderMap() {
    clearVisuals();
    const items = activeItems();
    await Promise.all(items.map(resolvePoi));
    const seen = new Set();
    items.forEach(item => {
      if (seen.has(item.poiKey)) return;
      seen.add(item.poiKey);
      const poi = state.poi.get(item.poiKey); if (!poi?.location) return;
      const marker = new AMap.Marker({ position: poi.location, content: markerContent(item), offset: new AMap.Pixel(-16, -16), anchor: 'center', zIndex: 120 });
      marker.on('click', () => showItem(item)); state.markerList.push(marker); state.map.add(marker);
    });
    if (state.mode === 'plan') drawRoutes();
    if (state.markerList.length) state.map.setFitView([...state.markerList, ...state.routeLines], false, [78, 70, 110, 70]);
  }
  function highdeUrl(item, poi) {
    return poi?.location ? `https://uri.amap.com/marker?position=${poi.location.lng},${poi.location.lat}&name=${encodeURIComponent(item.name)}&coordinate=gaode&callnative=1` : `https://uri.amap.com/search?keyword=${encodeURIComponent(item.query)}&city=大连`;
  }
  function showItem(item) {
    if (!item) return;
    state.selected = item; renderSheet();
    const poi = state.poi.get(item.poiKey); if (poi?.location) state.map.setZoomAndCenter(16, poi.location);
    const address = poi?.address ? `${poi.district || ''}${poi.address}` : '高德未返回精确地址，请打开导航复核';
    $('#drawer').innerHTML = `<button class="drawer-close" aria-label="收起">×</button><span class="drawer-tag">${typeName[item.kind]} · ${item.day.toUpperCase()}</span><h2>${esc(item.label || item.name)}</h2><div class="fact"><div><b>时间 / 预算</b><span>${esc(item.time || '候选')}${item.budget ? ` · ${esc(item.budget)}` : ''}</span></div><div><b>高德位置</b><span>${esc(address)}</span></div></div><p>${esc(item.info || item.reason || '按当天实际情况选择。')}</p>${item.fallback ? `<p><b>替换：</b>${esc(item.fallback)}</p>` : ''}<a class="navigate" target="_blank" rel="noopener" href="${highdeUrl(item, poi)}">在高德中核对 / 导航 ↗</a>`;
    $('#drawer').classList.add('open'); $('#drawer .drawer-close').addEventListener('click', closeDrawer);
  }
  function closeDrawer() { $('#drawer').classList.remove('open'); state.selected = null; }
  async function render() { renderControls(); renderSheet(); await renderMap(); }
  function toggleSheet(force) { const sheet = $('#route-sheet'); const collapsed = force ?? !sheet.classList.contains('collapsed'); sheet.classList.toggle('collapsed', collapsed); $('#sheet-toggle').setAttribute('aria-expanded', String(!collapsed)); }
  function boot() {
    state.map = new AMap.Map('amap', { viewMode: '2D', zoom: 12, center: [121.62, 38.91], mapStyle: 'amap://styles/normal', resizeEnable: true });
    AMap.plugin('AMap.PlaceSearch', async () => {
      state.placeSearch = new AMap.PlaceSearch({ city: data.city, citylimit: true, pageSize: 1, extensions: 'base' });
      await preloadPois(); await render();
    });
    state.map.on('click', closeDrawer);
    $('#plan-mode').addEventListener('click', () => { state.mode = 'plan'; closeDrawer(); render(); });
    $('#candidate-mode').addEventListener('click', () => { state.mode = 'candidate'; closeDrawer(); render(); });
    $('#sheet-toggle').addEventListener('click', () => toggleSheet());
  }
  function loadMap() {
    if (!config.amapKey || !config.serviceHost) { error('地图安全代理尚未配置完成。'); return; }
    window._AMapSecurityConfig = { serviceHost: config.serviceHost };
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(config.amapKey)}&plugin=AMap.PlaceSearch`;
    script.onload = boot; script.onerror = () => error('高德地图加载失败，请检查域名白名单与代理配置。'); document.head.append(script);
  }
  loadMap();
})();
