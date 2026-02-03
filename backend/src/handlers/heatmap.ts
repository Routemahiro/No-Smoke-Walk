import { HeatmapResponse, ApiResponse, Env, ReportCategory } from '../types';

const OSAKA_CENTER_LAT = 34.6937;
const METERS_PER_DEGREE_LAT = 111_000;

const DEFAULT_RADIUS_METERS = 800;
const DEFAULT_GRID_METERS_NEARBY = 75;
const DEFAULT_GRID_METERS_WIDE = 250;

function isValidJapanCoordinate(lat: number, lon: number): boolean {
  return lat >= 24 && lat <= 46 && lon >= 123 && lon <= 146;
}

// Distance calculation helper (Haversine formula)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function metersToLatDegrees(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT;
}

function metersToLonDegrees(meters: number, atLat: number): number {
  const cos = Math.cos(atLat * Math.PI / 180);
  // Avoid division by zero (shouldn't happen for Japan, but defensive)
  return meters / (METERS_PER_DEGREE_LAT * Math.max(cos, 0.000001));
}

function roundTo(n: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}

export async function handleHeatmapRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const category = searchParams.get('category'); // optional filter
    const daysRaw = searchParams.get('days');
    const minReportsRaw = searchParams.get('min_reports');

    // Nearby mode parameters (frontend sends these as camelCase)
    const userLatRaw = searchParams.get('userLat');
    const userLonRaw = searchParams.get('userLon');
    const radiusRaw = searchParams.get('radius'); // meters
    const gridMetersRaw = searchParams.get('grid_m'); // meters (optional)

    const days = daysRaw ? parseInt(daysRaw, 10) : 30; // default 30 days
    const minReports = minReportsRaw ? parseInt(minReportsRaw, 10) : 3; // default 3 reports to show hotspot
    
    // Validate parameters
    if (!Number.isFinite(days) || Number.isNaN(days) || days < 1 || days > 365) {
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

    if (!Number.isFinite(minReports) || Number.isNaN(minReports) || minReports < 1 || minReports > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid min_reports parameter. Must be between 1 and 100.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate user location params (must be both or neither)
    const hasUserLat = userLatRaw !== null && userLatRaw !== '';
    const hasUserLon = userLonRaw !== null && userLonRaw !== '';
    if (hasUserLat !== hasUserLon) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid user location parameters. Both userLat and userLon are required.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userLat = hasUserLat ? parseFloat(userLatRaw as string) : null;
    const userLon = hasUserLon ? parseFloat(userLonRaw as string) : null;

    if (userLat !== null && userLon !== null) {
      if (!Number.isFinite(userLat) || !Number.isFinite(userLon) || Number.isNaN(userLat) || Number.isNaN(userLon)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid user location parameters. userLat and userLon must be numbers.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!isValidJapanCoordinate(userLat, userLon)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User location is out of Japan bounds.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Nearby-mode radius/grid defaults
    const radiusMeters = userLat !== null && userLon !== null
      ? (radiusRaw ? parseInt(radiusRaw, 10) : DEFAULT_RADIUS_METERS)
      : null;

    if (radiusMeters !== null) {
      if (!Number.isFinite(radiusMeters) || Number.isNaN(radiusMeters) || radiusMeters < 50 || radiusMeters > 10_000) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid radius parameter. Must be between 50 and 10000 meters.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const gridMetersDefault = userLat !== null && userLon !== null
      ? DEFAULT_GRID_METERS_NEARBY
      : DEFAULT_GRID_METERS_WIDE;

    const gridMeters = gridMetersRaw ? parseInt(gridMetersRaw, 10) : gridMetersDefault;
    if (!Number.isFinite(gridMeters) || Number.isNaN(gridMeters) || gridMeters < 25 || gridMeters > 2000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid grid_m parameter. Must be between 25 and 2000 meters.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build query URL
    const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    let queryUrl = `${env.SUPABASE_URL}/rest/v1/reports?select=lat,lon,category&reported_at=gte.${dateFilter}`;
    
    // Apply category filter if specified
    if (category) {
      queryUrl += `&category=eq.${category}`;
    }

    // Apply rough bounding box filter for nearby mode (reduces DB payload)
    if (userLat !== null && userLon !== null && radiusMeters !== null) {
      const latDelta = metersToLatDegrees(radiusMeters);
      const lonDelta = metersToLonDegrees(radiusMeters, userLat);

      const minLat = userLat - latDelta;
      const maxLat = userLat + latDelta;
      const minLon = userLon - lonDelta;
      const maxLon = userLon + lonDelta;

      queryUrl += `&lat=gte.${minLat}&lat=lte.${maxLat}&lon=gte.${minLon}&lon=lte.${maxLon}`;
    }

    // Execute query via HTTP API
    // Use service role key for read if available (production RLS differences can break anon reads)
    const readKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    const dbResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': readKey,
        'Authorization': `Bearer ${readKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbResponse.ok) {
      throw new Error(`Supabase query failed: ${dbResponse.status} ${dbResponse.statusText}`);
    }

    const reports = await dbResponse.json() as Array<{ lat: number; lon: number; category: ReportCategory }>;

    // Apply precise radius filtering (Haversine) for nearby mode
    const filteredReports = (userLat !== null && userLon !== null && radiusMeters !== null)
      ? (reports || []).filter((report) => calculateDistanceMeters(userLat, userLon, report.lat, report.lon) <= radiusMeters)
      : (reports || []);

    const totalReportsInRange = (userLat !== null && userLon !== null && radiusMeters !== null)
      ? filteredReports.length
      : 0;

    // Aggregate reports by grid (meters-based; reduces over-aggregation vs old ~1km grid)
    const referenceLat = userLat ?? OSAKA_CENTER_LAT;
    const latGridDeg = metersToLatDegrees(gridMeters);
    const lonGridDeg = metersToLonDegrees(gridMeters, referenceLat);

    const aggregatedData = new Map<string, {
      lat: number;
      lon: number;
      count: number;
      categories: Record<string, number>;
    }>();

    filteredReports.forEach((report) => {
      const latIndex = Math.round(report.lat / latGridDeg);
      const lonIndex = Math.round(report.lon / lonGridDeg);
      const gridKey = `${latIndex},${lonIndex}`;

      const gridLat = roundTo(latIndex * latGridDeg, 6);
      const gridLon = roundTo(lonIndex * lonGridDeg, 6);

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

    // Convert to GeoJSON features
    const allClusters = Array.from(aggregatedData.values());
    const maxCount = allClusters.reduce((max, p) => Math.max(max, p.count), 0);

    const features = allClusters
      .filter(point => point.count >= minReports)
      .map(point => {
        const primaryCategory = Object.keys(point.categories).reduce((a, b) =>
          (point.categories[a] || 0) >= (point.categories[b] || 0) ? a : b
        , Object.keys(point.categories)[0]) as ReportCategory;

        const densityRatio = (totalReportsInRange > 0)
          ? roundTo((point.count / totalReportsInRange) * 100, 2)
          : 0;

        const intensity = maxCount > 0 ? roundTo(point.count / maxCount, 3) : 0;

        return ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.lon, point.lat] as [number, number]
          },
          properties: {
            count: point.count,
            category: primaryCategory,
            categories: point.categories,
            densityRatio: densityRatio > 0 ? densityRatio : undefined,
            intensity,
          }
        });
      });

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
    // Get statistics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const readKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    const statsResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/reports?select=category,prefecture,city&reported_at=gte.${thirtyDaysAgo.toISOString()}`, {
      method: 'GET',
      headers: {
        'apikey': readKey,
        'Authorization': `Bearer ${readKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      throw new Error(`Supabase query failed: ${statsResponse.status} ${statsResponse.statusText}`);
    }

    const stats = await statsResponse.json() as Array<{ category: ReportCategory; prefecture: string; city: string }>; 

    // Calculate statistics
    const totalReports = (stats || []).length || 0;
    const categoryBreakdown = (stats || []).reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const locationBreakdown = (stats || []).reduce((acc, report) => {
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
