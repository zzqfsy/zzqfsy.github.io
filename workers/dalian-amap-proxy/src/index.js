const ALLOWED_ORIGIN = 'https://zzqfsy.github.io';
const PREFIX = '/_AMapService/';

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  return origin === ALLOWED_ORIGIN
    ? { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Vary': 'Origin' }
    : {};
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
    }
    if (request.method !== 'GET' || !requestUrl.pathname.startsWith(PREFIX)) {
      return new Response('Not found', { status: 404, headers: cors });
    }
    if (!env.AMAP_SECURITY_JS_CODE) {
      return new Response('Proxy is not configured', { status: 503, headers: cors });
    }
    const suffix = requestUrl.pathname.slice(PREFIX.length);
    const upstream = suffix === 'v4/map/styles'
      ? new URL('https://webapi.amap.com/v4/map/styles')
      : new URL(`https://restapi.amap.com/${suffix}`);
    for (const [key, value] of requestUrl.searchParams) upstream.searchParams.append(key, value);
    upstream.searchParams.set('jscode', env.AMAP_SECURITY_JS_CODE);
    const response = await fetch(upstream, { headers: { 'User-Agent': 'dalian-trip-map-proxy/1.0' } });
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    headers.set('Cache-Control', 'public, max-age=300');
    return new Response(response.body, { status: response.status, headers });
  }
};
