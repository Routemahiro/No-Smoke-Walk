'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  const map = useRef<maplibregl.Map | null>(null);
  const [maplibregl, setMaplibregl] = useState<typeof import('maplibre-gl') | null>(null);
  const [isMapFullyReady, setIsMapFullyReady] = useState(false);
  
  // Memoize filters to prevent infinite re-renders
  const heatmapFilters = useMemo(() => ({
    category: undefined,
    minReports: 1,
    days: 30,
    userLocation: userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : undefined
  }), [userLocation?.lat, userLocation?.lon]);

  const { data: heatmapData, loading, error, isUsingFallbackData } = useHeatmap(heatmapFilters);

  // Debug logging
  useEffect(() => {
    console.log('🗺️ MiniHeatmap state:', { 
      isMapFullyReady, 
      loading, 
      hasHeatmapData: !!heatmapData, 
      error,
      userLocation: !!userLocation,
      maplibregl: !!maplibregl,
      mapContainer: !!mapContainer.current
    });
  }, [isMapFullyReady, loading, heatmapData, error, userLocation, maplibregl]);

  // Load MapLibre GL dynamically
  useEffect(() => {
    const loadMapLibre = async () => {
      try {
        console.log('🗺️ Loading MapLibre GL...');
        const maplib = await import('maplibre-gl');
        console.log('🗺️ MapLibre GL loaded successfully:', !!maplib.default);
        setMaplibregl(maplib.default);
      } catch (error) {
        console.error('Failed to load MapLibre GL:', error);
        // Retry after a delay
        setTimeout(() => {
          console.log('🗺️ Retrying MapLibre GL load...');
          loadMapLibre();
        }, 2000);
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

    // Multiple event listeners to ensure readiness
    let loadComplete = false;
    let styleComplete = false;
    let readyTimeout: NodeJS.Timeout | null = null;

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
        zoom: userLocation ? 12 : 10,
        interactive: true,
        attributionControl: false
      });

      const checkFullyReady = () => {
        console.log('🗺️ Checking map readiness:', { loadComplete, styleComplete, isStyleLoaded: map.current?.isStyleLoaded() });
        if (loadComplete && styleComplete && map.current?.isStyleLoaded()) {
          // Clear timeout since we're ready normally
          if (readyTimeout) {
            clearTimeout(readyTimeout);
            readyTimeout = null;
          }
          // Extra delay for safety
          setTimeout(() => {
            if (map.current?.isStyleLoaded()) {
              console.log('🗺️ Map is fully ready!');
              setIsMapFullyReady(true);
            }
          }, 500);
        }
      };

      // Fallback timeout to ensure map becomes ready even if events don't fire
      readyTimeout = setTimeout(() => {
        console.log('🗺️ Map ready timeout triggered, forcing ready state');
        setIsMapFullyReady(true);
        readyTimeout = null;
      }, 10000); // 10 second timeout

      map.current.on('load', () => {
        console.log('🗺️ Map load event fired');
        loadComplete = true;
        checkFullyReady();
      });

      map.current.on('styledata', () => {
        if (map.current?.isStyleLoaded()) {
          console.log('🗺️ Map style data loaded');
          styleComplete = true;
          checkFullyReady();
        }
      });

      // Additional failsafe
      map.current.on('idle', () => {
        if (!loadComplete || !styleComplete) {
          console.log('🗺️ Map idle event, setting ready state');
          loadComplete = true;
          styleComplete = true;
          checkFullyReady();
        }
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (readyTimeout) {
        clearTimeout(readyTimeout);
      }
      if (map.current) {
        setIsMapFullyReady(false);
        map.current.remove();
        map.current = null;
      }
    };
  }, [maplibregl]);

  // Add user location marker when ready
  useEffect(() => {
    if (!isMapFullyReady || !map.current || !userLocation) {
      console.log('User location effect skipped:', { isMapFullyReady, mapExists: !!map.current, userLocation });
      return;
    }

    console.log('Adding user location marker:', userLocation);

    const addUserLocationMarker = () => {
      try {
        if (!map.current?.isStyleLoaded()) {
          console.warn('Style not loaded, skipping user location');
          return;
        }

        // Remove existing user location if it exists
        if (map.current.getLayer('user-location')) {
          map.current.removeLayer('user-location');
          console.log('Removed existing user location layer');
        }
        if (map.current.getSource('user-location')) {
          map.current.removeSource('user-location');
          console.log('Removed existing user location source');
        }

        // Add user location source
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
        console.log('Added user location source');

        // Add user location layer with prominent styling
        map.current.addLayer({
          id: 'user-location',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 12,
            'circle-color': '#3b82f6',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3,
            'circle-opacity': 1
          }
        });
        console.log('Added user location layer');

        // Center map on user location
        map.current.flyTo({
          center: [userLocation.lon, userLocation.lat],
          zoom: 12,
          duration: 1000
        });
        console.log('Centered map on user location');

      } catch (error) {
        console.error('Error adding user location marker:', error);
      }
    };

    // Use timeout instead of requestAnimationFrame for more reliable execution
    setTimeout(addUserLocationMarker, 200);

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
            if (map.current && map.current.getLayer(layerId)) {
              map.current.removeLayer(layerId);
            }
          });

          if (map.current && map.current.getSource('reports')) {
            map.current.removeSource('reports');
          }

          // Add new
          if (map.current) {
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
                'case',
                ['>', ['get', 'densityRatio'], 0],
                // Use density ratio (0-100%) for weight
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'densityRatio'],
                  0, 0.1,
                  5, 0.3,   // Low density (1-5%)
                  15, 0.7,  // Medium density (5-15%)
                  100, 1    // High density (15%+)
                ],
                // Fallback to count-based weight
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'count'],
                  1, 0.3,
                  5, 0.7,
                  10, 1
                ]
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
                0, 'rgba(255,255,255,0)',     // Transparent
                0.1, 'rgba(255,255,178,0.2)', // Very light yellow (low density)
                0.3, 'rgba(254,204,92,0.4)',  // Light orange (low-medium density)
                0.5, 'rgba(253,141,60,0.6)',  // Orange (medium density)
                0.7, 'rgba(240,59,32,0.8)',   // Red (high density)
                0.9, 'rgba(189,0,38,0.9)',    // Dark red (very high density)
                1, 'rgba(139,0,0,1)'          // Deep red (maximum density)
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
                'case',
                ['>', ['get', 'densityRatio'], 0],
                // Color based on density ratio
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'densityRatio'],
                  0, '#FEF3C7',    // Light yellow (0-1%)
                  5, '#F59E0B',    // Orange (1-5% - low density)
                  15, '#DC2626',   // Red (5-15% - medium density)
                  100, '#7F1D1D'   // Dark red (15%+ - high density)
                ],
                // Fallback to count-based colors
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'count'],
                  1, '#fbbf24',
                  5, '#f59e0b',
                  10, '#dc2626'
                ]
              ],
              'circle-stroke-color': 'white',
              'circle-stroke-width': 1,
              'circle-opacity': 0.8
            }
          });
          }

          // Re-add user location on top of heatmap if it exists
          if (userLocation) {
            setTimeout(() => {
              if (map.current && map.current.getSource('user-location')) {
                // Move user location layer to top
                if (map.current.getLayer('user-location')) {
                  map.current.removeLayer('user-location');
                }
                map.current.addLayer({
                  id: 'user-location',
                  type: 'circle',
                  source: 'user-location',
                  paint: {
                    'circle-radius': 12,
                    'circle-color': '#3b82f6',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 3,
                    'circle-opacity': 1
                  }
                });
                console.log('Re-added user location layer on top');
              }
            }, 100);
          }

        } catch (error) {
          console.error('Error adding heatmap data:', error);
        }
      });
    });

  }, [isMapFullyReady, heatmapData, userLocation]);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium">🗺️ 周辺状況</h4>
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
          {(loading || !isMapFullyReady) && !error && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {!isMapFullyReady ? 'マップを初期化中...' : 'データを読み込み中...'}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="text-center p-3 space-y-2">
                <Alert variant="destructive" className="text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error.includes('接続できませんでした') ? 
                      'サーバーに接続できません' : 
                      'データの読み込みに失敗しました'
                    }
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => window.location.reload()}
                >
                  再試行
                </Button>
              </div>
            </div>
          )}

          {!userLocation && !loading && isMapFullyReady && !error && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="text-center text-xs text-gray-600 px-2">
                <MapPin className="h-4 w-4 mx-auto mb-1" />
                位置情報を取得すると<br />周辺の詳細を表示します
              </div>
            </div>
          )}

          {userLocation && isMapFullyReady && !loading && (
            <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
              📍 現在位置表示中
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>🔴 赤いエリアは報告が多い要注意地域です</p>
          <p>📍 青い点があなたの現在位置です</p>
          <p>👆 タップして詳細マップで確認できます</p>
          {isUsingFallbackData && (
            <p className="text-blue-600">📡 デモデータを表示中</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}