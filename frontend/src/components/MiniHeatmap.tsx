'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Map, MapPin, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHeatmap } from '@/hooks/useHeatmap';

interface MiniHeatmapProps {
  userLocation?: {
    lat: number;
    lon: number;
  };
}

export function MiniHeatmap({ userLocation }: MiniHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [maplibregl, setMaplibregl] = useState<any>(null);
  const [isMapFullyReady, setIsMapFullyReady] = useState(false);
  
  const { data: heatmapData, loading, error } = useHeatmap({
    category: undefined,
    minReports: 1,
    days: 30
  });

  // Load MapLibre GL dynamically
  useEffect(() => {
    const loadMapLibre = async () => {
      try {
        const maplib = await import('maplibre-gl');
        setMaplibregl(maplib.default);
      } catch (error) {
        console.error('Failed to load MapLibre GL:', error);
      }
    };
    loadMapLibre();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !maplibregl) return;

    const initialCenter = userLocation 
      ? [userLocation.lon, userLocation.lat] as [number, number]
      : [135.5023, 34.6937] as [number, number];

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              source: 'osm',
              type: 'raster'
            }
          ]
        },
        center: initialCenter,
        zoom: userLocation ? 15 : 11,
        interactive: true,
        attributionControl: false
      });

      // Multiple event listeners to ensure readiness
      let loadComplete = false;
      let styleComplete = false;

      const checkFullyReady = () => {
        if (loadComplete && styleComplete && map.current?.isStyleLoaded()) {
          // Extra delay for safety
          setTimeout(() => {
            if (map.current?.isStyleLoaded()) {
              setIsMapFullyReady(true);
            }
          }, 1000);
        }
      };

      map.current.on('load', () => {
        loadComplete = true;
        checkFullyReady();
      });

      map.current.on('styledata', () => {
        if (map.current?.isStyleLoaded()) {
          styleComplete = true;
          checkFullyReady();
        }
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        setIsMapFullyReady(false);
        map.current.remove();
        map.current = null;
      }
    };
  }, [maplibregl]);

  // Only attempt to add sources/layers when map is FULLY ready
  useEffect(() => {
    if (!isMapFullyReady || !map.current || !userLocation) return;

    // Use requestAnimationFrame to ensure rendering is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (!map.current?.isStyleLoaded()) {
            console.warn('Style not loaded, skipping user location');
            return;
          }

          // Remove existing
          if (map.current.getLayer('user-location')) {
            map.current.removeLayer('user-location');
          }
          if (map.current.getSource('user-location')) {
            map.current.removeSource('user-location');
          }

          // Add new
          map.current.addSource('user-location', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [userLocation.lon, userLocation.lat]
              },
              properties: {}
            }
          });

          map.current.addLayer({
            id: 'user-location',
            type: 'circle',
            source: 'user-location',
            paint: {
              'circle-radius': 8,
              'circle-color': '#3b82f6',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2
            }
          });

          map.current.flyTo({
            center: [userLocation.lon, userLocation.lat],
            zoom: 15,
            duration: 1000
          });

        } catch (error) {
          console.error('Error adding user location:', error);
        }
      });
    });

  }, [isMapFullyReady, userLocation]);

  // Add heatmap data
  useEffect(() => {
    if (!isMapFullyReady || !map.current || !heatmapData?.features) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (!map.current?.isStyleLoaded()) {
            console.warn('Style not loaded, skipping heatmap');
            return;
          }

          // Remove existing
          ['heatmap-layer', 'heatmap-points'].forEach(layerId => {
            if (map.current.getLayer(layerId)) {
              map.current.removeLayer(layerId);
            }
          });

          if (map.current.getSource('reports')) {
            map.current.removeSource('reports');
          }

          // Add new
          map.current.addSource('reports', {
            type: 'geojson',
            data: heatmapData
          });

          map.current.addLayer({
            id: 'heatmap-layer',
            type: 'heatmap',
            source: 'reports',
            paint: {
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'count'],
                1, 0.5,
                10, 1
              ],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                15, 3
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 255, 0)',
                0.2, 'rgb(65, 105, 225)',
                0.4, 'rgb(0, 255, 255)',
                0.6, 'rgb(0, 255, 0)',
                0.8, 'rgb(255, 255, 0)',
                1, 'rgb(255, 0, 0)'
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 10,
                15, 30
              ]
            }
          });

          map.current.addLayer({
            id: 'heatmap-points',
            type: 'circle',
            source: 'reports',
            minzoom: 14,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'count'],
                1, 4,
                10, 12
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'count'],
                1, '#fbbf24',
                5, '#f59e0b',
                10, '#dc2626'
              ],
              'circle-stroke-color': 'white',
              'circle-stroke-width': 1,
              'circle-opacity': 0.8
            }
          });

        } catch (error) {
          console.error('Error adding heatmap data:', error);
        }
      });
    });

  }, [isMapFullyReady, heatmapData]);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium">🗺️ 周辺の報告状況</h4>
          </div>
          <Link href="/heatmap">
            <Button variant="outline" size="sm" className="text-xs h-7">
              <ExternalLink className="h-3 w-3 mr-1" />
              詳細マップ
            </Button>
          </Link>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="w-full h-32 bg-gray-100 rounded-lg border overflow-hidden"
          />
          
          {/* Loading/Error States */}
          {(!isMapFullyReady || loading) && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                マップを読み込み中...
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <Alert variant="destructive" className="m-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  マップの読み込みに失敗しました
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!userLocation && !loading && isMapFullyReady && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="text-center text-xs text-gray-600 px-2">
                <MapPin className="h-4 w-4 mx-auto mb-1" />
                位置情報を取得すると<br />周辺の詳細を表示します
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>🔴 赤いエリアは報告が多い要注意地域です</p>
          <p>📍 青い点があなたの現在位置です</p>
          <p>👆 タップして詳細マップで確認できます</p>
        </div>
      </CardContent>
    </Card>
  );
}