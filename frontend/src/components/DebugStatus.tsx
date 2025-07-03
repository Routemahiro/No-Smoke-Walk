'use client';

import { useHeatmap } from '@/hooks/useHeatmap';
import { useGeolocation } from '@/hooks/useGeolocation';

export function DebugStatus() {
  const { data: heatmapData, loading, error, isUsingFallbackData } = useHeatmap({
    category: undefined,
    minReports: 1,
    days: 30
  });
  
  const { location, address, addressLoading } = useGeolocation();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Debug Status</h3>
      
      <div className="space-y-1">
        <div>Heatmap: {loading ? '🔄' : heatmapData ? '✅' : error ? '❌' : '⏳'}</div>
        <div>Location: {location ? '📍' : '❌'}</div>
        <div>Address: {addressLoading ? '🔄' : address ? '✅' : '❌'}</div>
        
        {error && <div className="text-red-300">Error: {error}</div>}
        {heatmapData && (
          <div>Features: {heatmapData.features?.length || 0}</div>
        )}
        {location && (
          <div>Coords: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}</div>
        )}
        {address && (
          <div>Addr: {address.substring(0, 30)}...</div>
        )}
        <div>Fallback: {isUsingFallbackData ? '📡' : '🔗'}</div>
      </div>
    </div>
  );
}