'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Props {
  center: { lat: number; lon: number };
  radiusM: number;
}

type Feature = { geometry: { coordinates: [number, number] }; properties: { count: number } };

// Area map: same public heatmap API and OSM tiles as the existing maps, centered on the area.
export function AreaReportMap({ center, radiusM }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let map: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const [maplib, res] = await Promise.all([
          import('maplibre-gl'),
          apiClient.getHeatmapData({ days: 365, min_reports: 1, userLat: center.lat, userLon: center.lon, radius: radiusM }),
        ]);
        if (cancelled) return;
        const fc = (res as { data?: { features?: Feature[] } }).data ?? { features: [] };
        const features = fc.features ?? [];
        setCount(features.reduce((s, f) => s + (f.properties?.count ?? 0), 0));
        if (!container.current) return;
        const m = new maplib.default.Map({
          container: container.current,
          style: {
            version: 8,
            sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } },
            layers: [{ id: 'osm', source: 'osm', type: 'raster' }],
          },
          center: [center.lon, center.lat],
          zoom: 14,
          cooperativeGestures: true,
        });
        map = m;
        m.on('load', () => {
          m.addSource('reports', { type: 'geojson', data: { type: 'FeatureCollection', features: features as never } });
          m.addLayer({
            id: 'reports',
            type: 'circle',
            source: 'reports',
            paint: {
              'circle-color': '#ef4444',
              'circle-opacity': 0.6,
              'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 6, 10, 16],
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 1,
            },
          });
        });
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [center.lat, center.lon, radiusM]);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        過去1年・半径{radiusM / 1000}km以内の報告：
        <span className="font-bold">{error ? '取得できませんでした' : count === null ? '読み込み中…' : `${count}件`}</span>
      </p>
      <div ref={container} className="h-72 w-full overflow-hidden rounded-lg border bg-gray-100" />
      <p className="text-xs text-gray-500">赤い丸は報告が集まった場所（約250m四方ごと）。地図：© OpenStreetMap contributors</p>
    </div>
  );
}
