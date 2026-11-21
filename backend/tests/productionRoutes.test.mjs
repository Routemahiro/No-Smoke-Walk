// Locks the three production API behaviors:
// - omitted min_reports defaults to 1 (days stays 30)
// - /api/debug/env is always 404 and never returns env values
// - /api/health reports production under the production Worker config,
//   and when ENVIRONMENT is unset
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const { unstable_dev } = require('wrangler');

const FAKE_URL = 'https://example.invalid';
const FAKE_KEY = 'test-anon-key';
const ONE_REPORT = [{ lat: 34.6937, lon: 135.5023, category: 'walk_smoke' }];

function daysAgoFromQuery(urlString) {
  const gte = new URL(urlString).searchParams.get('reported_at');
  assert.ok(gte && gte.startsWith('gte.'), `expected reported_at filter, got ${gte}`);
  const then = Date.parse(gte.slice(4));
  assert.equal(Number.isNaN(then), false);
  return (Date.now() - then) / (24 * 60 * 60 * 1000);
}

async function loadWorkerModule() {
  const dir = await mkdtemp(path.join(tmpdir(), 'nsw-worker-'));
  const outfile = path.join(dir, 'worker.mjs');
  await esbuild.build({
    entryPoints: [path.resolve('src/index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    outfile,
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(outfile).href);
  return { worker: mod.default, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

async function withMockedReports(reports, fn) {
  const original = globalThis.fetch;
  let lastUrl = '';
  globalThis.fetch = async (url) => {
    lastUrl = String(url);
    return new Response(JSON.stringify(reports), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    return await fn(() => lastUrl);
  } finally {
    globalThis.fetch = original;
  }
}

function baseEnv(extra = {}) {
  return {
    SUPABASE_URL: FAKE_URL,
    SUPABASE_ANON_KEY: FAKE_KEY,
    ...extra,
  };
}

async function call(worker, pathname, env, search = '') {
  return worker.fetch(new Request(`https://worker.test${pathname}${search}`), env, {});
}

async function assertDebugClosed(worker, env) {
  const response = await call(worker, '/api/debug/env', env);
  const text = await response.text();
  assert.equal(response.status, 404);
  assert.equal(text, 'Not Found');
  assert.equal(text.includes(FAKE_KEY), false);
  assert.equal(text.includes(FAKE_URL), false);
  assert.equal(/supabase|hasSupabase|abuseGuard|ENVIRONMENT/i.test(text), false);
}

async function testBundledWorker() {
  const { worker, cleanup } = await loadWorkerModule();
  try {
    const omitted = await withMockedReports(ONE_REPORT, async (lastUrl) => {
      const response = await call(worker, '/api/heatmap', baseEnv());
      const body = await response.json();
      return { status: response.status, body, url: lastUrl() };
    });
    assert.equal(omitted.status, 200);
    assert.equal(omitted.body.success, true);
    const counts = omitted.body.data.features.map((feature) => feature.properties.count);
    assert.ok(counts.length >= 1, 'expected at least one heatmap point when min_reports is omitted');
    assert.ok(counts.every((count) => count >= 1), `counts below 1: ${counts.join(',')}`);
    const defaultDays = daysAgoFromQuery(omitted.url);
    assert.ok(Math.abs(defaultDays - 30) < 0.05, `days default drifted: ${defaultDays}`);
    console.log(`heatmap omitted params: status=${omitted.status} points=${counts.length} counts=${counts.join(',')} days≈${defaultDays.toFixed(2)}`);

    const explicitThree = await withMockedReports(ONE_REPORT, async () => {
      const response = await call(worker, '/api/heatmap', baseEnv(), '?min_reports=3');
      return response.json();
    });
    assert.equal(explicitThree.data.features.length, 0);
    console.log('heatmap min_reports=3 with a single report: points=0');

    const week = await withMockedReports(ONE_REPORT, async (lastUrl) => {
      await call(worker, '/api/heatmap', baseEnv(), '?days=7');
      return daysAgoFromQuery(lastUrl());
    });
    assert.ok(Math.abs(week - 7) < 0.05, `days=7 drifted: ${week}`);
    console.log(`heatmap days=7 still honored: days≈${week.toFixed(2)}`);

    await assertDebugClosed(worker, baseEnv({ ENVIRONMENT: 'development' }));
    await assertDebugClosed(worker, baseEnv({ ENVIRONMENT: 'production' }));
    await assertDebugClosed(worker, baseEnv());
    console.log('debug/env: 404 for development, production, and unset; body="Not Found"');

    const production = await (await call(worker, '/api/health', baseEnv({ ENVIRONMENT: 'production' }))).json();
    const unset = await (await call(worker, '/api/health', baseEnv())).json();
    const staging = await (await call(worker, '/api/health', baseEnv({ ENVIRONMENT: 'staging' }))).json();
    assert.equal(production.status, 'ok');
    assert.equal(production.environment, 'production');
    assert.equal(unset.environment, 'production');
    assert.equal(staging.environment, 'staging');
    console.log(`health: production=${production.environment} unset=${unset.environment} staging=${staging.environment}`);
  } finally {
    await cleanup();
  }
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
  });
}

async function testWranglerProductionConfig() {
  const upstream = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(ONE_REPORT));
  });
  const address = await listen(upstream);

  const worker = await unstable_dev('src/index.ts', {
    config: 'wrangler.toml',
    local: true,
    inspect: false,
    logLevel: 'error',
    vars: {
      // Production ENVIRONMENT comes from wrangler.toml [vars], not from this override.
      SUPABASE_URL: `http://127.0.0.1:${address.port}`,
      SUPABASE_ANON_KEY: FAKE_KEY,
    },
    experimental: {
      disableExperimentalWarning: true,
      disableDevRegistry: true,
      testMode: true,
    },
  });

  try {
    const healthResponse = await worker.fetch('/api/health');
    const health = await healthResponse.json();
    assert.equal(healthResponse.status, 200);
    assert.equal(health.environment, 'production');
    console.log(`wrangler production config /api/health: status=${healthResponse.status} environment=${health.environment}`);

    const debugResponse = await worker.fetch('/api/debug/env');
    const debugText = await debugResponse.text();
    assert.equal(debugResponse.status, 404);
    assert.equal(debugText, 'Not Found');
    assert.equal(/supabase|hasSupabase|abuseGuard/i.test(debugText), false);
    console.log(`wrangler production config /api/debug/env: status=${debugResponse.status} body=${JSON.stringify(debugText)}`);

    const heatmapResponse = await worker.fetch('/api/heatmap');
    const heatmapText = await heatmapResponse.text();
    const heatmap = JSON.parse(heatmapText);
    assert.equal(heatmapResponse.status, 200, heatmapText.slice(0, 300));
    const counts = heatmap.data.features.map((feature) => feature.properties.count);
    assert.ok(counts.length >= 1, heatmapText.slice(0, 300));
    assert.ok(counts.every((count) => count >= 1));
    console.log(`wrangler production config /api/heatmap: status=${heatmapResponse.status} points=${counts.length} counts=${counts.join(',')}`);
  } finally {
    await worker.stop();
    await new Promise((resolve) => upstream.close(resolve));
  }

  const stagingWorker = await unstable_dev('src/index.ts', {
    config: 'wrangler.toml',
    env: 'staging',
    local: true,
    inspect: false,
    logLevel: 'error',
    experimental: {
      disableExperimentalWarning: true,
      disableDevRegistry: true,
      testMode: true,
    },
  });
  try {
    const stagingHealth = await (await stagingWorker.fetch('/api/health')).json();
    assert.equal(stagingHealth.environment, 'staging');
    console.log(`wrangler staging config /api/health: environment=${stagingHealth.environment}`);
  } finally {
    await stagingWorker.stop();
  }
}

await testBundledWorker();
await testWranglerProductionConfig();
console.log('production route checks passed');
