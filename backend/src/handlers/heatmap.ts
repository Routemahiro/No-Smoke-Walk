import { createSupabaseClient } from '../utils/supabase';
import { HeatmapResponse, ApiResponse, Env, ReportCategory } from '../types';

export async function handleHeatmapRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const category = searchParams.get('category'); // optional filter
    const days = parseInt(searchParams.get('days') || '30'); // default 30 days
    const minReports = parseInt(searchParams.get('min_reports') || '3'); // minimum reports to show hotspot
    
    // Validate parameters
    if (days < 1 || days > 365) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 365.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (category && !['walk_smoke', 'stand_smoke', 'litter'].includes(category)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category. Must be one of: walk_smoke, stand_smoke, litter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client
    const supabase = createSupabaseClient(env);

    // Build query
    let query = supabase
      .from('reports')
      .select('lat, lon, category')
      .gte('reported_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    // Apply category filter if specified
    if (category) {
      query = query.eq('category', category);
    }

    // Execute query
    const { data: reports, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch heatmap data'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Aggregate reports by grid (simplified 1km grid)
    const gridSize = 0.009; // Approximately 1km at Osaka latitude
    const aggregatedData = new Map<string, {
      lat: number;
      lon: number;
      count: number;
      categories: Record<string, number>;
    }>();

    reports?.forEach(report => {
      const gridLat = Math.round(report.lat / gridSize) * gridSize;
      const gridLon = Math.round(report.lon / gridSize) * gridSize;
      const gridKey = `${gridLat},${gridLon}`;

      const existing = aggregatedData.get(gridKey);
      if (existing) {
        existing.count++;
        existing.categories[report.category] = (existing.categories[report.category] || 0) + 1;
      } else {
        aggregatedData.set(gridKey, {
          lat: gridLat,
          lon: gridLon,
          count: 1,
          categories: { [report.category]: 1 }
        });
      }
    });

    // Filter by minimum reports and convert to GeoJSON
    const features = Array.from(aggregatedData.values())
      .filter(point => point.count >= minReports)
      .map(point => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lon, point.lat] as [number, number]
        },
        properties: {
          count: point.count,
          category: category as ReportCategory || null,
          categories: point.categories,
          intensity: Math.min(point.count / 10, 1), // Normalized intensity 0-1
        }
      }));

    const heatmapData: HeatmapResponse = {
      type: 'FeatureCollection',
      features
    };

    // Cache response for 5 minutes
    const response: ApiResponse<HeatmapResponse> = {
      success: true,
      data: heatmapData
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // 5 minutes cache
      }
    });

  } catch (error) {
    console.error('Heatmap request error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to get heatmap statistics
export async function handleHeatmapStats(request: Request, env: Env): Promise<Response> {
  try {
    const supabase = createSupabaseClient(env);
    
    // Get statistics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: stats, error } = await supabase
      .from('reports')
      .select('category, prefecture, city')
      .gte('reported_at', thirtyDaysAgo.toISOString());

    if (error) {
      throw error;
    }

    // Calculate statistics
    const totalReports = stats?.length || 0;
    const categoryBreakdown = stats?.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const locationBreakdown = stats?.reduce((acc, report) => {
      const locationKey = `${report.prefecture} ${report.city}`;
      acc[locationKey] = (acc[locationKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get top 5 locations
    const topLocations = Object.entries(locationBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => {
        const [prefecture, city] = location.split(' ');
        return { prefecture, city, count };
      });

    const response: ApiResponse = {
      success: true,
      data: {
        total_reports: totalReports,
        category_breakdown: categoryBreakdown,
        top_locations: topLocations,
        period_days: 30
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Heatmap stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch statistics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}