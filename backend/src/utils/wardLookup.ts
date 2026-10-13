import wardsData from '../data/osaka_wards.json';

// Ward boundaries: 国土数値情報（行政区域データ）（国土交通省）を加工して作成 (CC BY 4.0). See src/data/README.md.

export const OUTSIDE_OSAKA_CITY = '大阪市外';

type Ring = number[][]; // [lon, lat][]
interface Ward { name: string; code: string; rings: Ring[]; bbox: [number, number, number, number] }

const wards: Ward[] = (wardsData as { wards: { name: string; code: string; rings: Ring[] }[] }).wards.map(w => {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const ring of w.rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { ...w, bbox: [minLon, minLat, maxLon, maxLat] };
});

function ringContains(ring: Ring, lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Returns e.g. "大阪市北区", or "大阪市外" when the point is in none of the 24 wards. */
export function lookupOsakaWard(lat: number, lon: number): string {
  for (const w of wards) {
    const [minLon, minLat, maxLon, maxLat] = w.bbox;
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue;
    // Even-odd over all rings of the ward handles both islands and holes.
    let inside = false;
    for (const ring of w.rings) {
      if (ringContains(ring, lon, lat)) inside = !inside;
    }
    if (inside) return `大阪市${w.name}`;
  }
  return OUTSIDE_OSAKA_CITY;
}
