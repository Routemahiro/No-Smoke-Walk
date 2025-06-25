'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Filter, AlertCircle, Map, BarChart, MapPin } from 'lucide-react';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ReportCategory } from '@/types';

const OSAKA_CENTER: [number, number] = [135.5023, 34.6937]; // [lng, lat]
const CATEGORY_COLORS = {
  walk_smoke: '#ef4444',    // red-500
  stand_smoke: '#f97316',   // orange-500
  litter: '#eab308',        // yellow-500
};

interface FilterState {
  category?: ReportCategory;
  days: number;
  minReports: number;
}

export function HeatmapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    days: 30,
    minReports: 3,
  });

  const { data: heatmapData, loading, error, updateFilters, refreshData, clearError } = useHeatmap(filters);
  const { location: userLocation, getCurrentLocation } = useGeolocation();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update heatmap data on map
  useEffect(() => {
    if (!map.current || !mapLoaded || !heatmapData) return;

    // Remove existing heatmap layer and source
    if (map.current.getLayer('heatmap-layer')) {
      map.current.removeLayer('heatmap-layer');
    }
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
        // Increase weight as count increases
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          1, 0.1,
          10, 1
        ],
        // Increase intensity as zoom level increases
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        // Color ramp for heatmap - red for hot spots
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(255,255,255,0)',
          0.2, 'rgb(255,255,178)',
          0.4, 'rgb(254,204,92)',
          0.6, 'rgb(253,141,60)',
          0.8, 'rgb(240,59,32)',
          1, 'rgb(189,0,38)'
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
          ['==', ['get', 'category'], 'walk_smoke'], CATEGORY_COLORS.walk_smoke,
          ['==', ['get', 'category'], 'stand_smoke'], CATEGORY_COLORS.stand_smoke,
          ['==', ['get', 'category'], 'litter'], CATEGORY_COLORS.litter,
          '#666666'
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add popup on click
    map.current.on('click', 'heatmap-points', (e) => {
      const coordinates = e.lngLat;
      const properties = e.features?.[0]?.properties;
      
      if (properties) {
        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">報告ホットスポット</h3>
              <p class="text-sm">報告数: ${properties.count}件</p>
              ${properties.category ? `<p class="text-sm">カテゴリ: ${getCategoryLabel(properties.category)}</p>` : ''}
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

  }, [mapLoaded, heatmapData]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) {
      console.log('User location marker skipped:', { mapLoaded, userLocation: !!userLocation });
      return;
    }

    console.log('Adding user location to HeatmapView:', userLocation);

    try {
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
    }
  }, [mapLoaded, userLocation]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'walk_smoke': return '歩きタバコ';
      case 'stand_smoke': return '立ち止まり喫煙';
      case 'litter': return 'ポイ捨て';
      default: return category;
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateFilters(updatedFilters);
  };

  const handleRefresh = () => {
    clearError();
    refreshData();
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
            大阪市内の喫煙・ポイ捨て報告データをヒートマップで可視化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ 
                  category: e.target.value ? e.target.value as ReportCategory : undefined 
                })}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="">全カテゴリ</option>
                <option value="walk_smoke">歩きタバコ</option>
                <option value="stand_smoke">立ち止まり喫煙</option>
                <option value="litter">ポイ捨て</option>
              </select>
            </div>

            {/* Days Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">期間:</span>
              <select
                value={filters.days}
                onChange={(e) => handleFilterChange({ days: parseInt(e.target.value) })}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={7}>1週間</option>
                <option value={30}>1ヶ月</option>
                <option value={90}>3ヶ月</option>
                <option value={365}>1年</option>
              </select>
            </div>

            {/* Min Reports Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">最小報告数:</span>
              <select
                value={filters.minReports}
                onChange={(e) => handleFilterChange({ minReports: parseInt(e.target.value) })}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={1}>1件以上</option>
                <option value={3}>3件以上</option>
                <option value={5}>5件以上</option>
                <option value={10}>10件以上</option>
              </select>
            </div>

            {/* User Location Button */}
            <Button
              onClick={() => {
                getCurrentLocation();
                if (userLocation && map.current) {
                  map.current.flyTo({
                    center: [userLocation.lon, userLocation.lat],
                    zoom: 15,
                    duration: 1000
                  });
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
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              更新
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">歩きタバコ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm">立ち止まり喫煙</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">ポイ捨て</span>
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