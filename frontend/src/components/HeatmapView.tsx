'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Map, BarChart, MapPin, ChevronDown } from 'lucide-react';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useGeolocation } from '@/hooks/useGeolocation';
import { trackMapInteraction } from '@/components/GoogleAnalytics';

const OSAKA_CENTER: [number, number] = [135.5023, 34.6937]; // [lng, lat]
const CATEGORY_COLORS = {
  walk_smoke: '#ef4444',    // red-500
  stand_smoke: '#f97316',   // orange-500
};

interface FilterState {
  days: number;
  category?: 'walk_smoke' | 'stand_smoke';
}

export function HeatmapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hasUserInteractedRef = useRef(false);
  const suppressNextMoveEndRef = useRef(false);
  const hasAutoCenteredRef = useRef(false);
  const [maplibregl, setMaplibregl] = useState<typeof import('maplibre-gl') | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    days: 180, // 6ヶ月
    category: undefined, // 全カテゴリ
  });

  const { location: userLocation, getCurrentLocation } = useGeolocation();
  
  // Include user location in heatmap filters (memoized to prevent infinite re-renders)
  const heatmapFilters = useMemo(() => ({
    days: filters.days,
    category: filters.category,
    minReports: 1, // Fixed to show all reports
    userLocation: userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : undefined
  }), [filters.days, filters.category, userLocation]);
  
  const { data: heatmapData, loading, error, updateFilters, refreshData, clearError } = useHeatmap(heatmapFilters);

  // Load MapLibre GL dynamically
  useEffect(() => {
    const loadMapLibre = async () => {
      try {
        console.log('🗺️ Loading MapLibre GL for HeatmapView...');
        const maplib = await import('maplibre-gl');
        console.log('🗺️ MapLibre GL loaded successfully for HeatmapView');
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

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: OSAKA_CENTER,
      zoom: 12,
      attributionControl: false
    });

    // Add attribution
    map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');
    
    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded event fired');
      setMapLoaded(true);
      trackMapInteraction('heatmap_loaded');
    });

    // Also listen for when the map is completely ready
    map.current.on('idle', () => {
      console.log('Map idle event fired - fully ready');
      setMapLoaded(true);
    });

    // Track map interactions
    map.current.on('zoomend', () => {
      if (suppressNextMoveEndRef.current) {
        return;
      }
      hasUserInteractedRef.current = true;
      trackMapInteraction('zoom');
    });

    map.current.on('moveend', () => {
      if (suppressNextMoveEndRef.current) {
        suppressNextMoveEndRef.current = false;
        return;
      }
      hasUserInteractedRef.current = true;
      trackMapInteraction('pan');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [maplibregl]);

  // Move map to user location when it becomes available
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    if (!hasUserInteractedRef.current && !hasAutoCenteredRef.current) {
      console.log('Moving map to user location:', userLocation);
      suppressNextMoveEndRef.current = true;
      hasAutoCenteredRef.current = true;
      map.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: 15,
        duration: 1500
      });
    }
  }, [mapLoaded, userLocation]);

  // Update heatmap data on map
  useEffect(() => {
    if (!map.current || !mapLoaded || !heatmapData) return;

    let retryCount = 0;
    const maxRetries = 10; // 最大10回まで（2秒間）

    // Function to add heatmap data safely
    const addHeatmapData = () => {
      try {
        // Check if style is ready and map is loaded
        if (!map.current?.isStyleLoaded() || !map.current.loaded()) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Style loading retry ${retryCount}/${maxRetries} for heatmap data...`);
            setTimeout(() => addHeatmapData(), 200);
            return;
          } else {
            console.error('Failed to load heatmap data after maximum retries');
            return;
          }
        }

        // Remove existing layers that use the heatmap-data source
        if (map.current.getLayer('heatmap-layer')) {
          map.current.removeLayer('heatmap-layer');
        }
        if (map.current.getLayer('heatmap-points')) {
          map.current.removeLayer('heatmap-points');
        }
        // Remove source only after all layers using it are removed
        if (map.current.getSource('heatmap-data')) {
          map.current.removeSource('heatmap-data');
        }

        // Add new heatmap data
        map.current.addSource('heatmap-data', {
          type: 'geojson',
          data: heatmapData
        });

        // Add heatmap layer
        map.current.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-data',
          maxzoom: 15,
          paint: {
            // Use density ratio for weight if available, otherwise use count
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
            // Increase intensity as zoom level increases
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              15, 3
            ],
            // Enhanced color ramp for better density visualization
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
            // Adjust radius based on zoom level
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              15, 20
            ],
            // Opacity based on zoom level
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 1,
              15, 0.3
            ]
          }
        });

        // Add circle layer for high zoom levels
        map.current.addLayer({
          id: 'heatmap-points',
          type: 'circle',
          source: 'heatmap-data',
          minzoom: 13,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'count'],
              1, 4,
              10, 12,
              20, 20
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
              // Fallback to category colors
              [
                'case',
                ['==', ['get', 'category'], 'walk_smoke'], CATEGORY_COLORS.walk_smoke,
                ['==', ['get', 'category'], 'stand_smoke'], CATEGORY_COLORS.stand_smoke,
                '#666666'
              ]
            ],
            'circle-opacity': 0.7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Add popup on click
        map.current.on('click', 'heatmap-points', (e: maplibregl.MapMouseEvent & { features?: maplibregl.GeoJSONFeature[] }) => {
          const coordinates = e.lngLat;
          const properties = e.features?.[0]?.properties;
          
          // Track popup interaction
          trackMapInteraction('heatmap_popup_click');
          
          if (properties && maplibregl) {
            new maplibregl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold">報告ホットスポット</h3>
                  <p class="text-sm">報告数: ${properties.count}件</p>
                  ${properties.category ? `<p class="text-sm">カテゴリ: ${getCategoryLabel(properties.category)}</p>` : ''}
                  ${properties.densityRatio > 0 ? `<p class="text-sm">密度: 周辺の${properties.densityRatio}%</p>` : ''}
                </div>
              `)
              .addTo(map.current!);
          }
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'heatmap-points', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'heatmap-points', () => {
          map.current!.getCanvas().style.cursor = '';
        });

        console.log('Heatmap data and layers added successfully');

      } catch (error) {
        console.error('Error adding heatmap data:', error);
        // If it's a style loading error, retry after a delay (with limit)
        if (error instanceof Error && error.message.includes('Style is not done loading') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Style loading error retry ${retryCount}/${maxRetries}...`);
          setTimeout(() => addHeatmapData(), 500);
        } else {
          console.error('Failed to add heatmap data:', error);
        }
      }
    };

    // Only try once initially - no additional event listeners to prevent loops
    const timeoutId = setTimeout(() => {
      addHeatmapData();
    }, 300); // Slightly longer delay for more reliable style loading

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapLoaded, heatmapData, maplibregl]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) {
      console.log('User location marker skipped:', { mapLoaded, userLocation: !!userLocation });
      return;
    }

    console.log('Adding user location to HeatmapView:', userLocation);

    let retryCount = 0;
    const maxRetries = 10; // 最大10回まで（2秒間）

    // Function to add user location safely
    const addUserLocation = () => {
      try {
        // Check if style is ready and map is loaded
        if (!map.current?.isStyleLoaded() || !map.current.loaded()) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Style loading retry ${retryCount}/${maxRetries} for user location...`);
            setTimeout(() => addUserLocation(), 200);
            return;
          } else {
            console.error('Failed to add user location after maximum retries');
            return;
          }
        }

        // Remove existing user location if it exists
        if (map.current.getLayer('user-location')) {
          map.current.removeLayer('user-location');
        }
        if (map.current.getSource('user-location')) {
          map.current.removeSource('user-location');
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

        // Add user location layer
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

        console.log('User location marker added to HeatmapView');

      } catch (error) {
        console.error('Error adding user location to HeatmapView:', error);
        // If it's a style loading error, retry after a delay (with limit)
        if (error instanceof Error && error.message.includes('Style is not done loading') && retryCount < maxRetries) {
          retryCount++;
          console.log(`User location style loading error retry ${retryCount}/${maxRetries}...`);
          setTimeout(() => addUserLocation(), 500);
        } else {
          console.error('Failed to add user location:', error);
        }
      }
    };

    // Only try once initially - no additional event listeners to prevent loops
    const timeoutId = setTimeout(() => {
      addUserLocation();
    }, 300); // Slightly longer delay for more reliable style loading

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapLoaded, userLocation]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'walk_smoke': return '歩きタバコ';
      case 'stand_smoke': return '立ち止まり喫煙';
      default: return category;
    }
  };


  const handleRefresh = () => {
    clearError();
    
    // マップの現在表示位置（中心座標）を取得して、その周辺データを取得
    if (map.current) {
      const center = map.current.getCenter();
      const currentViewLocation = {
        lat: center.lat,
        lon: center.lng
      };
      
      console.log('🗺️ Refreshing heatmap data for current view position:', currentViewLocation);
      
      // 現在の表示位置を基準にデータを再取得
      const refreshFilters = {
        days: filters.days,
        userLocation: currentViewLocation
      };
      
      updateFilters(refreshFilters);
    } else {
      // マップが利用できない場合は通常の更新
      refreshData();
    }
  };

  const handleShowCurrentLocation = async () => {
    trackMapInteraction('get_location_button_click');
    const freshLocation = await getCurrentLocation({ forceFresh: true });
    if (freshLocation && map.current) {
      suppressNextMoveEndRef.current = true;
      hasAutoCenteredRef.current = true;
      map.current.flyTo({
        center: [freshLocation.lon, freshLocation.lat],
        zoom: 15,
        duration: 1200,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-6 text-left [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 space-y-1">
              <span className="flex items-center gap-2 leading-none font-semibold">
                <Map className="h-5 w-5" />
                ヒートマップ表示
              </span>
              <span className="block text-sm text-muted-foreground">
                大阪市内の迷惑タバコ報告データをヒートマップで可視化
              </span>
            </span>
            <ChevronDown
              className="mt-1 h-5 w-5 flex-shrink-0 text-gray-500 transition-transform group-open:rotate-180"
            />
          </summary>
          <CardContent className="space-y-4">
            {/* Filter Section */}
            <div className="space-y-3">
              {/* Days Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  📅 表示期間
                </label>
                <div className="flex flex-wrap gap-2">
                  {[7, 30, 90, 180].map((days) => (
                    <Button
                      key={days}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, days }));
                        trackMapInteraction('filter_days_change', { days });
                      }}
                      size="sm"
                      variant={filters.days === days ? 'default' : 'outline'}
                      className={filters.days === days ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      {days}日間
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  🏷️ カテゴリ
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, category: undefined }));
                      trackMapInteraction('filter_category_change', { category: 'all' });
                    }}
                    size="sm"
                    variant={!filters.category ? 'default' : 'outline'}
                    className={!filters.category ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    すべて
                  </Button>
                  <Button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, category: 'walk_smoke' }));
                      trackMapInteraction('filter_category_change', { category: 'walk_smoke' });
                    }}
                    size="sm"
                    variant={filters.category === 'walk_smoke' ? 'default' : 'outline'}
                    className={filters.category === 'walk_smoke' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    🚶 歩きタバコ
                  </Button>
                  <Button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, category: 'stand_smoke' }));
                      trackMapInteraction('filter_category_change', { category: 'stand_smoke' });
                    }}
                    size="sm"
                    variant={filters.category === 'stand_smoke' ? 'default' : 'outline'}
                    className={filters.category === 'stand_smoke' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    🧍 立ち止まり喫煙
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </details>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Legend - Moved above map for better visibility */}
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-left [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 leading-none font-semibold">
              <BarChart className="h-5 w-5" />
              凡例・使い方
            </span>
            <ChevronDown
              className="h-5 w-5 flex-shrink-0 text-gray-500 transition-transform group-open:rotate-180"
            />
          </summary>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">歩きタバコ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium">立ち止まり喫煙</span>
                </div>
              </div>
              <div className="pt-2 border-t text-xs text-gray-600 space-y-1">
                <p>💡 <strong>ヒートマップの見方:</strong> 濃い赤色ほど報告が集中</p>
                <p>🔍 <strong>詳細表示:</strong> ズームインでポイント表示、クリックで詳細</p>
                <p>📍 <strong>青い円:</strong> あなたの現在位置</p>
              </div>
            </div>
          </CardContent>
        </details>
      </Card>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainer}
          className="w-full h-[600px] bg-gray-100 rounded-lg border shadow-md"
          style={{ minHeight: '600px' }}
        />
        
        {/* Enhanced Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-lg border-2 border-blue-200">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">データを読み込み中...</p>
                <p className="text-xs text-gray-500 mt-1">しばらくお待ちください</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {!loading && (
          <div className="absolute top-4 left-4 z-10 max-w-[calc(100%-2rem)] rounded-lg bg-white/95 px-3 py-2 text-xs text-gray-700 shadow-md backdrop-blur-sm sm:max-w-[calc(100%-5rem)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">📊 表示中:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {filters.days}日間
              </span>
              {filters.category && (
                <span className={`px-2 py-0.5 rounded ${
                  filters.category === 'walk_smoke' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {filters.category === 'walk_smoke' ? '🚶 歩きタバコ' : '🧍 立ち止まり'}
                </span>
              )}
              {!filters.category && (
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                  すべて
                </span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                onClick={handleShowCurrentLocation}
                size="sm"
                className="h-8 whitespace-nowrap bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
              >
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                現在位置を表示
              </Button>

              <Button
                onClick={handleRefresh}
                disabled={loading}
                size="sm"
                variant="outline"
                className="h-8 whitespace-nowrap px-2 text-xs"
                title="現在の表示位置周辺のデータを更新"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                表示位置で更新
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
