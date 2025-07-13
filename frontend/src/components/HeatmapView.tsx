'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Map, BarChart, MapPin } from 'lucide-react';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useGeolocation } from '@/hooks/useGeolocation';

const OSAKA_CENTER: [number, number] = [135.5023, 34.6937]; // [lng, lat]
const CATEGORY_COLORS = {
  walk_smoke: '#ef4444',    // red-500
  stand_smoke: '#f97316',   // orange-500
};

interface FilterState {
  days: number;
}

export function HeatmapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [maplibregl, setMaplibregl] = useState<typeof import('maplibre-gl') | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filters] = useState<FilterState>({
    days: 180, // 6ヶ月
  });

  const { location: userLocation, getCurrentLocation } = useGeolocation();
  
  // Include user location in heatmap filters
  const heatmapFilters = {
    days: filters.days,
    minReports: 1, // Fixed to show all reports
    userLocation: userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : undefined
  };
  
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

    // Use user location as center if available, otherwise fallback to Osaka center
    const initialCenter: [number, number] = userLocation 
      ? [userLocation.lon, userLocation.lat] 
      : OSAKA_CENTER;

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
      center: initialCenter,
      zoom: userLocation ? 15 : 12, // Higher zoom if we have user location
      attributionControl: false
    });

    // Add attribution
    map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');
    
    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded event fired');
      setMapLoaded(true);
    });

    // Also listen for when the map is completely ready
    map.current.on('idle', () => {
      console.log('Map idle event fired - fully ready');
      setMapLoaded(true);
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

    // Only move if we're still at the default Osaka center
    const currentCenter = map.current.getCenter();
    const isAtOsakaCenter = Math.abs(currentCenter.lng - OSAKA_CENTER[0]) < 0.01 && 
                           Math.abs(currentCenter.lat - OSAKA_CENTER[1]) < 0.01;

    if (isAtOsakaCenter) {
      console.log('Moving map to user location:', userLocation);
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            ヒートマップ表示
          </CardTitle>
          <CardDescription>
            大阪府内の迷惑タバコ報告データをヒートマップで可視化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* User Location Button */}
            <Button
              onClick={async () => {
                try {
                  await getCurrentLocation();
                  // getCurrentLocation is async, so we need to wait for the location state to update
                  // The map will automatically move via the useEffect above
                } catch (error) {
                  console.error('Failed to get current location:', error);
                }
              }}
              size="sm"
              variant="outline"
            >
              <MapPin className="h-4 w-4" />
              現在位置
            </Button>

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
              title="現在の表示位置周辺のデータを更新"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              表示位置で更新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainer}
          className="w-full h-[500px] bg-gray-100 rounded-lg border"
          style={{ minHeight: '500px' }}
        />
        
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">データを読み込み中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            凡例
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">歩きタバコ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm">立ち止まり喫煙</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600">
            <p>• ヒートマップの濃い部分ほど報告が集中しています</p>
            <p>• ズームインすると個別の報告ポイントが表示されます</p>
            <p>• ポイントをクリックすると詳細情報が表示されます</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}