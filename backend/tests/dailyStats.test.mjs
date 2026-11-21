// City-wide JST daily counts.
// Run from backend/: node tests/dailyStats.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const NOW = new Date('2026-03-01T03:00:00.000Z'); // 2026-03-01 12:00 JST
const ENV = {
  SUPABASE_URL: 'https://example.invalid',
  SUPABASE_ANON_KEY: 'test-anon-key',
};

const FORBIDDEN_KEYS = new Set([
  'lat', 'lon', 'latitude', 'longitude', 'id', 'ip_hash', 'fp_hash',
  'reported_at', 'category', 'prefecture', 'city', 'timestamp', 'coordinates',
]);

async function bundle(entry) {
  const dir = await mkdtemp(path.join(tmpdir(), 'nsw-daily-'));
  const outfile = path.join(dir, 'mod.mjs');
  await esbuild.build({
    entryPoints: [path.resolve(entry)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    outfile,
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(outfile).href);
  return { mod, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

function assertPublicShape(value, label = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPublicShape(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      assert.equal(FORBIDDEN_KEYS.has(key), false, `${label}.${key} must not be exposed`);
      assertPublicShape(value[key], `${label}.${key}`);
    }
  }
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

const { mod: stats, cleanup: cleanupStats } = await bundle('src/handlers/stats.ts');

try {
  const {
    addJstDays,
    buildDailyStats,
    handleDailyStats,
    jstDateKey,
    countReportsOnJstDay,
  } = stats;

  assert.equal(jstDateKey(new Date('2026-02-28T14:30:00.000Z')), '2026-02-28'); // 23:30 JST
  assert.equal(jstDateKey(new Date('2026-02-28T15:30:00.000Z')), '2026-03-01'); // 00:30 JST next day
  assert.equal(jstDateKey(new Date('2026-02-28T00:00:00.000Z')), '2026-02-28'); // UTC midnight, 09:00 JST
  assert.equal(jstDateKey(new Date('2026-03-01T00:00:00.000Z')), '2026-03-01'); // UTC midnight, 09:00 JST
  assert.equal(jstDateKey(new Date('2026-02-28T14:59:59.000Z')), '2026-02-28'); // 23:59 JST
  assert.equal(jstDateKey(new Date('2026-02-28T15:00:00.000Z')), '2026-03-01'); // 00:00 JST
  console.log('jst boundary: 23:30/00:30 and UTC midnight land on the expected dates');

  const outside = addJstDays('2026-03-01', -400);
  const withinYear = addJstDays('2026-03-01', -100);
  const seeded = [
    '2026-02-28T14:30:00.000Z',
    '2026-02-28T15:30:00.000Z',
    '2026-02-28T00:00:00.000Z',
    '2026-03-01T00:00:00.000Z',
    `${withinYear}T03:00:00.000Z`,
    `${outside}T03:00:00.000Z`,
    'not-a-date',
  ];

  const three = buildDailyStats(seeded, NOW, 3);
  assert.deepEqual(three.days.map((day) => day.date), ['2026-02-27', '2026-02-28', '2026-03-01']);
  assert.deepEqual(three.days.map((day) => day.count), [0, 2, 2]);
  assert.equal(three.days[0].count, 0);
  assert.equal(three.today, 2);
  assert.equal(three.total, 4);
  assert.equal(three.total_365d, 5);
  assert.equal(three.timezone, 'Asia/Tokyo');
  assertPublicShape(three);
  console.log('zero-fill + today + totals:', JSON.stringify(three));

  const empty = buildDailyStats([], NOW, 7);
  assert.equal(empty.days.length, 7);
  assert.equal(empty.days.every((day) => day.count === 0), true);
  assert.equal(empty.days[6].date, '2026-03-01');
  assert.equal(empty.today, 0);
  assert.equal(empty.total, 0);
  assert.equal(empty.total_365d, 0);
  console.log('empty window is 7 zero days ending today');

  const year = buildDailyStats(seeded, NOW, 365);
  assert.equal(year.days.length, 365);
  assert.equal(year.days[0].date, addJstDays('2026-03-01', -364));
  assert.equal(year.days[364].date, '2026-03-01');
  assert.equal(year.total, year.total_365d);
  assert.equal(year.total, 5);
  console.log('365-day window: total === total_365d === 5 (400-day-old row excluded)');

  let requestedUrl = '';
  let ranges = [];
  const fetchPages = async (url, init) => {
    requestedUrl = String(url);
    const range = init.headers.Range || init.headers.range;
    ranges.push(range);
    if (range === '0-999') {
      return jsonResponse(Array.from({ length: 1000 }, () => ({ reported_at: '2026-03-01T01:00:00.000Z', lat: 1, id: 'hidden' })));
    }
    if (range === '1000-1999') {
      return jsonResponse([{ reported_at: '2026-03-01T02:00:00.000Z', lon: 2 }]);
    }
    return jsonResponse([]);
  };

  const paged = await handleDailyStats(
    new Request('https://worker.test/api/stats/daily?days=1'),
    ENV,
    { fetch: fetchPages, now: () => NOW },
  );
  const pagedBody = await paged.json();
  assert.equal(paged.status, 200);
  assert.equal(paged.headers.get('Cache-Control'), 'public, max-age=300');
  assert.equal(pagedBody.today, 1001);
  assert.equal(pagedBody.total, 1001);
  assert.equal(pagedBody.days.length, 1);
  assert.match(requestedUrl, /select=reported_at/);
  assert.equal(requestedUrl.includes('select=lat'), false);
  assert.equal(requestedUrl.includes('ip_hash'), false);
  assert.deepEqual(ranges, ['0-999', '1000-1999']);
  assertPublicShape(pagedBody);
  console.log('handler pages reported_at only; today=1001; cache 300s');

  const boundaryFetch = async () => jsonResponse(seeded.map((reported_at) => ({ reported_at })));
  const boundary = await handleDailyStats(
    new Request('https://worker.test/api/stats/daily?days=3'),
    ENV,
    { fetch: boundaryFetch, now: () => NOW },
  );
  const boundaryBody = await boundary.json();
  assert.equal(boundary.status, 200);
  assert.deepEqual(boundaryBody.days.map((day) => day.count), [0, 2, 2]);
  assert.equal(boundaryBody.today, 2);
  assert.equal(boundaryBody.total, 4);
  assert.equal(boundaryBody.total_365d, 5);
  console.log('handler JST buckets match buildDailyStats');

  const defaults = await handleDailyStats(
    new Request('https://worker.test/api/stats/daily'),
    ENV,
    { fetch: async () => jsonResponse([]), now: () => NOW },
  );
  const defaultBody = await defaults.json();
  assert.equal(defaultBody.days.length, 30);
  console.log('days default is 30');

  for (const bad of ['0', '366', '-1', 'abc', '1.5', '7d']) {
    const response = await handleDailyStats(
      new Request(`https://worker.test/api/stats/daily?days=${encodeURIComponent(bad)}`),
      ENV,
      { fetch: async () => jsonResponse([]), now: () => NOW },
    );
    assert.equal(response.status, 400, `expected 400 for days=${bad}`);
  }
  const one = await handleDailyStats(
    new Request('https://worker.test/api/stats/daily?days=1'),
    ENV,
    { fetch: async () => jsonResponse([]), now: () => NOW },
  );
  assert.equal((await one.json()).days.length, 1);
  const max = await handleDailyStats(
    new Request('https://worker.test/api/stats/daily?days=365'),
    ENV,
    { fetch: async () => jsonResponse([]), now: () => NOW },
  );
  assert.equal((await max.json()).days.length, 365);
  console.log('days validation: 0/366/non-integers are 400; 1 and 365 are accepted');

  const failed = await handleDailyStats(
    new Request('https://worker.test/api/stats/daily?days=7'),
    ENV,
    { fetch: async () => new Response('nope', { status: 500 }), now: () => NOW },
  );
  assert.equal(failed.status, 502);
  console.log('upstream failure is 502');

  const counted = await countReportsOnJstDay(ENV, NOW, async () => jsonResponse([
    { reported_at: '2026-03-01T00:00:00.000Z' },
    { reported_at: '2026-02-28T14:30:00.000Z' },
  ]));
  assert.equal(counted, 1);
  console.log('countReportsOnJstDay keeps only the JST today row');
} finally {
  await cleanupStats();
}

const { mod: workerMod, cleanup: cleanupWorker } = await bundle('src/index.ts');

try {
  const worker = workerMod.default;
  const original = globalThis.fetch;
  const rows = [{ reported_at: new Date().toISOString() }];
  globalThis.fetch = async (url, init) => {
    const method = (init && init.method) || 'GET';
    if (method === 'POST') {
      rows.push({ reported_at: new Date().toISOString() });
      return new Response('', { status: 201 });
    }
    const target = String(url);
    assert.equal(target.includes('select=lat'), false);
    return jsonResponse(rows);
  };

  try {
    const statsResponse = await worker.fetch(new Request('https://worker.test/api/stats/daily?days=7'), ENV, {});
    const statsBody = await statsResponse.json();
    assert.equal(statsResponse.status, 200);
    assert.equal(statsResponse.headers.get('Access-Control-Allow-Origin'), '*');
    assert.equal(statsBody.timezone, 'Asia/Tokyo');
    assert.equal(statsBody.days.length, 7);
    assert.equal(statsBody.today >= 1, true);
    assertPublicShape(statsBody);
    console.log('route GET /api/stats/daily is wired and CORS-wrapped');

    const postResponse = await worker.fetch(new Request('https://worker.test/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 34.6937, lon: 135.5023, category: 'walk_smoke' }),
    }), ENV, {});
    const postBody = await postResponse.json();
    assert.equal(postResponse.status, 201);
    assert.equal(postResponse.headers.get('Cache-Control'), 'no-store');
    assert.equal(postBody.success, true);
    assert.equal(postBody.data.today_count, 2);
    console.log('POST /api/reports returns today_count including the new report:', postBody.data.today_count);

    globalThis.fetch = async (url, init) => {
      const method = (init && init.method) || 'GET';
      if (method === 'POST') return new Response('', { status: 201 });
      return new Response('upstream down', { status: 500 });
    };
    const postWithoutCount = await worker.fetch(new Request('https://worker.test/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 34.6937, lon: 135.5023, category: 'walk_smoke' }),
    }), ENV, {});
    const withoutBody = await postWithoutCount.json();
    assert.equal(postWithoutCount.status, 201);
    assert.equal(withoutBody.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(withoutBody.data, 'today_count'), false);
    console.log('POST still succeeds without today_count when the count read fails');
  } finally {
    globalThis.fetch = original;
  }
} finally {
  await cleanupWorker();
}

console.log('daily stats checks passed');
