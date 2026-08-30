(() => {
  const data = window.DALIAN_TRIP;
  const config = window.TRIP_MAP_CONFIG || {};
  const cacheKey = 'dalian-trip-map-v5';
  const cacheLifetime = 1000 * 60 * 60 * 24 * 14;
  const dayIds = Object.keys(data.days);
  const dayColor = Object.fromEntries(Object.entries(data.days).map(([id, value]) => [id, value.color]));
  const typeIcon = { stay: '⌂', food: '食', sight: '景', coffee: '咖', market: '备' };
  const typeName = { stay: '住/夜景', food: '餐饮', sight: '景点', coffee: '咖啡', market: '市场/雨天' };
  const requested = new URLSearchParams(location.search).get('day');
  const cached = readCache();
  const state = {
    day: requested === 'all' || data.days[requested] ? requested : 'd1', mode: 'plan', map: null, placeSearch: null,
    poi: new Map(Object.entries(cached.pois || {})), routes: new Map(Object.entries(cached.routes || {})), poiPromises: new Map(), routePromises: new Map(),
    markerList: [], routeLines: [], selected: null, poiDone: 0, poiFound: 0, poiTotal: 0, routeDone: 0, routeFound: 0, routeTotal: 0, poiErrors: []
  };
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const error = message => { $('#map-error').textContent = message; $('#map-error').classList.remove('hidden'); };
  const origin = { ...data.origin, poiKey: 'stay', kind: 'stay' };

  function readCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      return cache.updatedAt && Date.now() - cache.updatedAt < cacheLifetime ? cache : { pois: {}, routes: {} };
    } catch (_) { return { pois: {}, routes: {} }; }
  }
  function persistCache() {
    try { localStorage.setItem(cacheKey, JSON.stringify({ updatedAt: Date.now(), pois: Object.fromEntries(state.poi), routes: Object.fromEntries(state.routes) })); } catch (_) { /* cache is optional */ }
  }
  function normalize(stop, day, index, candidate = false) {
    const item = stop.ref === 'stay' ? { ...origin, ...stop } : { ...stop };
    item.poiKey = stop.ref === 'stay' ? 'stay' : `${candidate ? 'c' : 'p'}-${day}-${index}`;
    item.day = day; item.index = index; item.candidate = candidate;
    return item;
  }
  function planFor(day) { return data.days[day].stops.map((item, index) => normalize(item, day, index)); }
  function candidatesFor(day) { return data.days[day].candidates.map((item, index) => normalize(item, day, index, true)); }
  function activeItems() { const ids = state.day === 'all' ? dayIds : [state.day]; return ids.flatMap(day => state.mode === 'plan' ? planFor(day) : candidatesFor(day)); }
  function allItems() { return dayIds.flatMap(day => [...planFor(day), ...candidatesFor(day)]); }
  function visibleDays() { return state.day === 'all' ? dayIds : [state.day]; }
  function pointColor(item) { return state.day === 'all' ? dayColor[item.day] : dayColor[state.day]; }
  function labelFor(item) { return state.day === 'all' ? `${item.day.toUpperCase()}·${item.index + 1}` : String(item.index + 1); }
  function coords(poi) {
    const value = poi?.location;
    if (Array.isArray(value)) return value;
    if (value && Number.isFinite(Number(value.lng)) && Number.isFinite(Number(value.lat))) return [Number(value.lng), Number(value.lat)];
    return null;
  }
  function lngLat(value) { const pair = Array.isArray(value) ? value : coords(value); return pair ? new AMap.LngLat(pair[0], pair[1]) : null; }
  function placeToCache(poi) { const point = coords(poi); return point ? { name: poi.name || '', location: point, address: poi.address || '', district: poi.district || '' } : null; }
  function statusText() {
    if (!state.poiTotal) return '初始化地图';
    if (state.poiDone < state.poiTotal) return `定位 ${state.poiFound}/${state.poiTotal}`;
    if (state.poiFound < state.poiTotal) return `POI ${state.poiFound}/${state.poiTotal}`;
    if (state.routeDone < state.routeTotal) return `路线 ${state.routeFound}/${state.routeTotal}`;
    return state.routeFound < state.routeTotal ? `路线 ${state.routeFound}/${state.routeTotal}` : 'POI / 路线已就绪';
  }
  function updateStatus() { $('#map-status').textContent = statusText(); }

  function renderControls() {
    $('#day-switches').innerHTML = [...dayIds.map(id => `<button class="switch ${id === state.day ? 'active' : ''}" data-day="${id}">${data.days[id].label}</button>`), `<button class="switch ${state.day === 'all' ? 'active' : ''}" data-day="all">全览</button>`].join('');
    $('#day-switches').querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => { state.day = button.dataset.day; state.mode = 'plan'; closeDrawer(); render(); }));
    $('#plan-mode').classList.toggle('active', state.mode === 'plan'); $('#candidate-mode').classList.toggle('active', state.mode === 'candidate');
  }
  function renderSheet() {
    const items = activeItems(); const title = state.day === 'all' ? '三天确认行程 · 全览地图' : `${data.days[state.day].label} · ${data.days[state.day].title}`;
    $('#sheet-title').textContent = state.mode === 'plan' ? title : `${state.day === 'all' ? '三天' : data.days[state.day].label} · 候选点`;
    $('#sheet-collapsed-note').textContent = state.mode === 'plan' ? `${items.length} 个确认站 · ${statusText()}` : `${items.length} 个备选点 · 点此展开`;
    $('#sheet-note').textContent = state.mode === 'plan' ? '圆=餐饮、方=景点、菱=咖啡；彩色道路线来自高德驾车路径，尚未完成时暂以虚线表示顺序。' : '候选点只在排队、下雨或临时补给时使用，不混入主线。';
    $('#route-steps').innerHTML = items.map(item => `<button class="route-step ${state.selected?.poiKey === item.poiKey ? 'selected' : ''}" data-key="${item.poiKey}"><span class="badge" style="background:${pointColor(item)}">${state.mode === 'plan' ? labelFor(item) : typeIcon[item.kind]}</span><span><b>${esc(item.label || item.name)}</b><small>${item.day.toUpperCase()} · ${esc(item.time || '备选')} · ${typeName[item.kind]}${item.budget ? ` · ${esc(item.budget)}` : ''}</small></span></button>`).join('');
    $('#route-steps').querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => showItem(items.find(item => item.poiKey === button.dataset.key))));
  }
  function markerContent(item) {
    const radius = { food: '50%', sight: '8px', coffee: '4px', market: '50%', stay: '50%' }[item.kind] || '50%';
    const outer = item.kind === 'coffee' ? 'transform:rotate(45deg)' : ''; const inner = item.kind === 'coffee' ? 'transform:rotate(-45deg)' : '';
    return `<div title="${esc(typeName[item.kind])}" style="min-width:34px;height:34px;padding:0 5px;border:3px solid #fff;border-radius:${radius};background:${pointColor(item)};box-shadow:0 2px 9px #16333a77;color:#fff;display:grid;place-items:center;font:800 10px -apple-system,BlinkMacSystemFont,'PingFang SC';${outer}"><span style="${inner}">${state.mode === 'plan' ? labelFor(item) : typeIcon[item.kind]}</span></div>`;
  }
  function clearVisuals() { if (state.markerList.length) state.map.remove(state.markerList); if (state.routeLines.length) state.map.remove(state.routeLines); state.markerList = []; state.routeLines = []; }
  function resolvePoi(item) {
    if (state.poi.has(item.poiKey)) return Promise.resolve(state.poi.get(item.poiKey));
    if (state.poiPromises.has(item.poiKey)) return state.poiPromises.get(item.poiKey);
    const promise = new Promise(resolve => {
      let settled = false; const done = value => { if (!settled) { settled = true; resolve(value); } };
      const timeout = setTimeout(() => done(null), 12000);
      state.placeSearch.search(item.query, (resultStatus, result) => {
        clearTimeout(timeout); const poi = placeToCache(result?.poiList?.pois?.[0]);
        if (poi) { state.poi.set(item.poiKey, poi); persistCache(); }
        else if (state.poiErrors.length < 3) state.poiErrors.push(`${resultStatus || 'unknown'}${result?.info ? ` / ${result.info}` : ''}${result?.message ? ` / ${result.message}` : ''}`);
        done(poi);
      });
    });
    state.poiPromises.set(item.poiKey, promise); return promise;
  }
  async function runPool(items, limit, task) {
    let cursor = 0; const workers = Array.from({ length: Math.min(limit, items.length) }, async () => { while (cursor < items.length) { const item = items[cursor++]; await task(item); } }); await Promise.all(workers);
  }
  async function preloadPois() {
    const unique = [...new Map(allItems().map(item => [item.poiKey, item])).values()]; state.poiTotal = unique.length; state.poiDone = unique.filter(item => state.poi.has(item.poiKey)).length; state.poiFound = state.poiDone; updateStatus();
    await runPool(unique.filter(item => !state.poi.has(item.poiKey)), 3, async item => { const poi = await resolvePoi(item); state.poiDone += 1; if (poi) state.poiFound += 1; updateStatus(); renderSheet(); renderMap(); });
    if (!state.poiFound) error(`没有取得任何高德 POI。接口返回：${state.poiErrors.join('；') || '请求超时'}。`);
  }
  function routeKey(day, index) { return `${day}-${index}`; }
  function segmentList(day) {
    const stops = planFor(day); const segments = [];
    stops.forEach((item, index) => { if (index) { const from = coords(state.poi.get(stops[index - 1].poiKey)); const to = coords(state.poi.get(item.poiKey)); if (from && to && (from[0] !== to[0] || from[1] !== to[1])) segments.push({ day, index, from, to, key: routeKey(day, index) }); } });
    return segments;
  }
  function routePath(route) { return Array.isArray(route) ? route.map(lngLat).filter(Boolean) : []; }
  function resolveRoute(segment) {
    if (state.routes.has(segment.key)) return Promise.resolve(state.routes.get(segment.key));
    if (state.routePromises.has(segment.key)) return state.routePromises.get(segment.key);
    const promise = new Promise(resolve => {
      let settled = false; const done = path => { if (!settled) { settled = true; resolve(path); } };
      const driving = new AMap.Driving({ policy: AMap.DrivingPolicy.LEAST_TIME, hideMarkers: true }); const timeout = setTimeout(() => done(null), 18000);
      driving.search(lngLat(segment.from), lngLat(segment.to), (_resultStatus, result) => {
        clearTimeout(timeout); const path = result?.routes?.[0]?.steps?.flatMap(step => (step.path || []).map(point => [point.lng, point.lat]));
        if (path?.length > 1) { state.routes.set(segment.key, path); persistCache(); } done(path);
      });
    });
    state.routePromises.set(segment.key, promise); return promise;
  }
  async function preloadRoutes() {
    const segments = dayIds.flatMap(segmentList); state.routeTotal = segments.length; state.routeDone = segments.filter(segment => state.routes.has(segment.key)).length; state.routeFound = state.routeDone; updateStatus();
    await runPool(segments.filter(segment => !state.routes.has(segment.key)), 2, async segment => { const route = await resolveRoute(segment); state.routeDone += 1; if (route?.length > 1) state.routeFound += 1; updateStatus(); renderSheet(); drawRoutes(); });
  }
  function drawRoutes() {
    if (!state.map || state.mode !== 'plan') return;
    if (state.routeLines.length) state.map.remove(state.routeLines); state.routeLines = [];
    visibleDays().forEach(day => segmentList(day).forEach(segment => {
      const actual = routePath(state.routes.get(segment.key)); const path = actual.length > 1 ? actual : [lngLat(segment.from), lngLat(segment.to)];
      const line = new AMap.Polyline({ path, isOutline: true, outlineColor: '#fff', borderWeight: 2, strokeColor: dayColor[day], strokeOpacity: actual.length > 1 ? .9 : .58, strokeWeight: actual.length > 1 ? 6 : 4, strokeStyle: actual.length > 1 ? 'solid' : 'dashed', strokeDasharray: [10, 7], lineJoin: 'round', zIndex: 20 }); state.routeLines.push(line); state.map.add(line);
    }));
  }
  function renderMap() {
    clearVisuals(); const items = activeItems(); const seen = new Set();
    items.forEach(item => {
      if (seen.has(item.poiKey)) return; seen.add(item.poiKey); const position = lngLat(state.poi.get(item.poiKey)); if (!position) return;
      const marker = new AMap.Marker({ position, content: markerContent(item), offset: new AMap.Pixel(-17, -17), anchor: 'center', zIndex: 120 }); marker.on('click', () => showItem(item)); state.markerList.push(marker); state.map.add(marker);
    });
    drawRoutes(); const overlays = [...state.markerList, ...state.routeLines]; if (overlays.length) state.map.setFitView(overlays, false, [84, 70, 104, 70]);
  }
  function highdeUrl(item, poi) { const point = coords(poi); return point ? `https://uri.amap.com/marker?position=${point[0]},${point[1]}&name=${encodeURIComponent(item.name)}&coordinate=gaode&callnative=1` : `https://uri.amap.com/search?keyword=${encodeURIComponent(item.query)}&city=大连`; }
  function showItem(item) {
    if (!item) return; state.selected = item; renderSheet(); const poi = state.poi.get(item.poiKey); const position = lngLat(poi); if (position) state.map.setZoomAndCenter(16, position);
    const address = poi?.address ? `${poi.district || ''}${poi.address}` : '高德暂未返回精确地址，请打开导航复核';
    $('#drawer').innerHTML = `<button class="drawer-close" aria-label="收起">×</button><span class="drawer-tag">${typeName[item.kind]} · ${item.day.toUpperCase()}</span><h2>${esc(item.label || item.name)}</h2><div class="fact"><div><b>时间 / 预算</b><span>${esc(item.time || '候选')}${item.budget ? ` · ${esc(item.budget)}` : ''}</span></div><div><b>高德位置</b><span>${esc(address)}</span></div></div><p>${esc(item.info || item.reason || '按当天实际情况选择。')}</p>${item.fallback ? `<p><b>替换：</b>${esc(item.fallback)}</p>` : ''}<a class="navigate" target="_blank" rel="noopener" href="${highdeUrl(item, poi)}">在高德中核对 / 导航 ↗</a>`;
    $('#drawer').classList.add('open'); $('#drawer .drawer-close').addEventListener('click', closeDrawer);
  }
  function closeDrawer() { $('#drawer').classList.remove('open'); state.selected = null; }
  function render() { renderControls(); renderSheet(); renderMap(); updateStatus(); }
  function toggleSheet(force) { const sheet = $('#route-sheet'); const collapsed = force ?? !sheet.classList.contains('collapsed'); sheet.classList.toggle('collapsed', collapsed); $('#sheet-toggle').setAttribute('aria-expanded', String(!collapsed)); }
  async function warmUp() { render(); await preloadPois(); render(); await preloadRoutes(); render(); }
  function boot() {
    state.map = new AMap.Map('amap', { viewMode: '2D', zoom: 12, center: [121.62, 38.91], mapStyle: 'amap://styles/normal', resizeEnable: true });
    AMap.plugin(['AMap.PlaceSearch', 'AMap.Driving'], () => { state.placeSearch = new AMap.PlaceSearch({ city: data.city, citylimit: true, pageSize: 1, extensions: 'base' }); warmUp(); });
    state.map.on('click', closeDrawer); $('#plan-mode').addEventListener('click', () => { state.mode = 'plan'; closeDrawer(); render(); }); $('#candidate-mode').addEventListener('click', () => { state.mode = 'candidate'; closeDrawer(); render(); }); $('#sheet-toggle').addEventListener('click', () => toggleSheet());
  }
  function loadMap() {
    if (!config.amapKey || !config.serviceHost) { error('地图安全代理尚未配置完成。'); return; }
    window._AMapSecurityConfig = { serviceHost: config.serviceHost }; const script = document.createElement('script'); script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(config.amapKey)}&plugin=AMap.PlaceSearch,AMap.Driving`; script.onload = boot; script.onerror = () => error('高德地图加载失败，请检查域名白名单与代理配置。'); document.head.append(script);
  }
  loadMap();
})();
