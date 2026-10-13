// Run: npm run test:ward  (bundles src/utils/wardLookup.ts with esbuild, then checks known points)
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = join(mkdtempSync(join(tmpdir(), 'ward-')), 'wardLookup.mjs');
await build({ entryPoints: ['src/utils/wardLookup.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const { lookupOsakaWard, OUTSIDE_OSAKA_CITY } = await import(out);

const cases = [
  ['梅田（大阪駅）', 34.7025, 135.4959, '大阪市北区'],
  ['新大阪駅', 34.7334, 135.5001, '大阪市淀川区'],
  ['本町', 34.6827, 135.4999, '大阪市中央区'],
  ['難波', 34.6666, 135.5011, '大阪市中央区'],
  ['大阪城', 34.6873, 135.5262, '大阪市中央区'],
  ['天王寺駅', 34.6466, 135.5136, '大阪市天王寺区'],
  ['USJ', 34.6654, 135.4323, '大阪市此花区'],
  ['江坂（吹田市）', 34.758, 135.497, OUTSIDE_OSAKA_CITY],
  ['大阪湾の海上', 34.6, 135.3, OUTSIDE_OSAKA_CITY],
  ['東京駅', 35.6812, 139.7671, OUTSIDE_OSAKA_CITY],
];
for (const [label, lat, lon, expected] of cases) {
  assert.equal(lookupOsakaWard(lat, lon), expected, label);
  console.log(`ok  ${label} -> ${expected}`);
}
console.log(`${cases.length} ward lookup checks passed`);
