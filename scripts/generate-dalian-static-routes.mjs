#!/usr/bin/env node
/**
 * Fetch the confirmed Dalian itinerary's driving paths through the project's
 * AMap Worker and bake them into the public H5.  The browser then never needs
 * a first-visit routing request merely to draw the itinerary.
 *
 * Usage: node scripts/generate-dalian-static-routes.mjs
 */
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'html/dalian-2026-09/v2/assets/js');
const proxyEndpoint = 'https://dalian-amap-proxy.zzqfsy.workers.dev/_AMapService/v3/direction/driving';

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ['poi-static.js', 'itinerary-data.js']) {
  vm.runInContext(await readFile(path.join(dataDir, file), 'utf8'), sandbox, { filename: file });
}

const trip = sandbox.window.DALIAN_TRIP;
const pois = sandbox.window.DALIAN_STATIC_POIS;
const queryFor = stop => stop.ref === 'stay' ? trip.origin.query : stop.query;
const coordinateFor = stop => {
  const poi = pois[queryFor(stop)];
  if (!poi?.location) throw new Error(`Missing static POI: ${queryFor(stop)}`);
  return poi.location.join(',');
};

async function fetchRoute(origin, destination) {
  const url = new URL(proxyEndpoint);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('strategy', '0');
  url.searchParams.set('extensions', 'base');
  const { stdout } = await execFileAsync('curl', [
    '--fail', '--silent', '--show-error', '--max-time', '25', '--retry', '2', '--retry-all-errors',
    '-H', 'Origin: https://zzqfsy.github.io', url.toString()
  ], { maxBuffer: 8 * 1024 * 1024 });
  const result = JSON.parse(stdout);
  const steps = result.route?.paths?.[0]?.steps;
  const points = steps?.flatMap(step => String(step.polyline || '').split(';').map(pair => pair.split(',').map(Number)));
  if (!Array.isArray(points) || points.length < 2 || points.some(point => !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
    throw new Error(`AMap route unavailable (${result.info || result.infocode || 'unknown'})`);
  }
  return points;
}

const jobs = Object.entries(trip.days).flatMap(([day, plan]) => plan.stops.slice(1).map((stop, index) => ({
  key: `${day}-${index + 1}`,
  origin: coordinateFor(plan.stops[index]),
  destination: coordinateFor(stop)
})));

const routes = {};
let cursor = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    routes[job.key] = await fetchRoute(job.origin, job.destination);
    console.log(`${job.key}: ${routes[job.key].length} points`);
  }
}));

const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const content = `/* AMap driving paths generated ${generatedAt}.\n * GCJ-02 coordinates; one route per confirmed itinerary segment. */\nwindow.DALIAN_STATIC_ROUTES = ${JSON.stringify(routes)};\n`;
await writeFile(path.join(dataDir, 'routes-static.js'), content, 'utf8');
console.log(`Wrote ${Object.keys(routes).length} static routes.`);
