// Cloudflare Workers API for No-Smoke Walk Osaka
// Converted from simple-server.js to Workers format

// Simple cache for heatmap data (5-minute TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCacheKey(userLat, userLon) {
  // Round coordinates to reduce cache keys
  const roundedLat = userLat ? Math.round(parseFloat(userLat) * 1000) / 1000 : 'null';
  const roundedLon = userLon ? Math.round(parseFloat(userLon) * 1000) / 1000 : 'null';
  return `heatmap_${roundedLat}_${roundedLon}`;
}

function getCachedData(cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(cacheKey); // Remove expired entry
  return null;
}

function setCachedData(cacheKey, data) {
  cache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries periodically
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        cache.delete(key);
      }
    }
  }
}

// Helper function for Supabase HTTP requests
async function supabaseRequest(endpoint, method = 'GET', body = null, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  if (method === 'POST') {
    headers['Prefer'] = 'return=representation';
  }
  
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  if (!response.ok) {
    throw new Error(`Supabase ${method} failed: ${response.status} ${await response.text()}`);
  }
  
  return response.json();
}

// Distance calculation helper (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Grid aggregation and relative density calculation
async function processHeatmapData(reports, userLat, userLon) {
  if (!reports || reports.length === 0) {
    return [];
  }

  // Convert user coordinates to numbers if provided
  const centerLat = userLat ? parseFloat(userLat) : null;
  const centerLon = userLon ? parseFloat(userLon) : null;

  // Step 1: Grid aggregation (50-100m clustering)
  const gridSize = 75; // 75m as middle point between 50-100m
  const clusters = new Map();

  reports.forEach(report => {
    const lat = parseFloat(report.lat);
    const lon = parseFloat(report.lon);
    
    // Create grid key based on rounded coordinates
    const gridLat = Math.round(lat * 10000) / 10000; // ~11m precision
    const gridLon = Math.round(lon * 10000) / 10000; // ~11m precision
    const gridKey = `${gridLat},${gridLon}`;
    
    if (!clusters.has(gridKey)) {
      clusters.set(gridKey, {
        lat: gridLat,
        lon: gridLon,
        count: 0,
        categories: {}
      });
    }
    
    const cluster = clusters.get(gridKey);
    cluster.count++;
    cluster.categories[report.category] = (cluster.categories[report.category] || 0) + 1;
  });

  // Step 2: Calculate relative density if user location is provided
  let totalReportsInRange = 0;
  const referenceRadius = 800; // 800m reference range

  if (centerLat && centerLon) {
    // Count reports within 800m of user location
    reports.forEach(report => {
      const distance = calculateDistance(
        centerLat, centerLon,
        parseFloat(report.lat), parseFloat(report.lon)
      );
      if (distance <= referenceRadius) {
        totalReportsInRange++;
      }
    });
  }

  // Step 3: Convert clusters to GeoJSON features with density ratios
  const features = Array.from(clusters.values()).map(cluster => {
    let densityRatio = 0;
    
    if (totalReportsInRange > 0 && centerLat && centerLon) {
      // Calculate if this cluster is within reference range
      const clusterDistance = calculateDistance(
        centerLat, centerLon,
        cluster.lat, cluster.lon
      );
      
      if (clusterDistance <= referenceRadius) {
        densityRatio = (cluster.count / totalReportsInRange) * 100;
      }
    }

    // Determine primary category
    const primaryCategory = Object.keys(cluster.categories).reduce((a, b) => 
      cluster.categories[a] > cluster.categories[b] ? a : b
    );

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [cluster.lon, cluster.lat]
      },
      properties: {
        count: cluster.count,
        category: primaryCategory,
        densityRatio: Math.round(densityRatio * 100) / 100, // Round to 2 decimal places
        categories: cluster.categories
      }
    };
  });

  console.log(`Grid aggregation: ${reports.length} reports → ${features.length} clusters`);
  if (centerLat && centerLon) {
    console.log(`Reference area: ${totalReportsInRange} reports within ${referenceRadius}m`);
  }

  return features;
}

// Sample fallback heatmap data
const sampleHeatmapData = {
  success: true,
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [135.5023, 34.6937] // Osaka center
        },
        properties: {
          count: 8,
          category: 'walk_smoke'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [135.5100, 34.6900] // Namba area
        },
        properties: {
          count: 5,
          category: 'stand_smoke'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [135.5200, 34.6850] // Tennoji area
        },
        properties: {
          count: 6,
          category: 'walk_smoke'
        }
      }
    ]
  }
};

// Health check handler
async function handleHealth(request, env) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'production'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Heatmap data handler
async function handleHeatmap(request, env) {
  try {
    const url = new URL(request.url);
    const userLat = url.searchParams.get('userLat');
    const userLon = url.searchParams.get('userLon');
    
    console.log('Serving heatmap data with params:', { userLat, userLon });
    
    const cacheKey = getCacheKey(userLat, userLon);
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`Serving cached heatmap data for key: ${cacheKey}`);
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get real data from Supabase HTTP API with 6-month time filter
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    const timeFilter = sixMonthsAgo.toISOString();
    
    let reports = await supabaseRequest(
      `reports?select=lat,lon,category&reported_at=gte.${timeFilter}&order=reported_at.desc&limit=1000`,
      'GET',
      null,
      env
    );
    
    console.log(`Retrieved ${reports.length} reports from last 180 days`);
    
    // Apply distance filtering if user location is provided
    if (userLat && userLon) {
      const centerLat = parseFloat(userLat);
      const centerLon = parseFloat(userLon);
      const maxDistance = 800; // 800m radius
      
      const originalCount = reports.length;
      reports = reports.filter(report => {
        const distance = calculateDistance(centerLat, centerLon, report.lat, report.lon);
        return distance <= maxDistance;
      });
      
      console.log(`Filtered to ${reports.length} reports within ${maxDistance}m of (${centerLat}, ${centerLon}), removed ${originalCount - reports.length} reports`);
    }
    
    // Grid aggregation and density calculation
    const aggregatedFeatures = await processHeatmapData(reports, userLat, userLon);
    
    const realHeatmapData = {
      success: true,
      data: {
        type: 'FeatureCollection',
        features: aggregatedFeatures
      }
    };
    
    // Cache the result
    setCachedData(cacheKey, realHeatmapData);
    
    console.log(`Serving ${aggregatedFeatures.length} aggregated heatmap features (last 180 days, cached)`);
    return new Response(JSON.stringify(realHeatmapData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Heatmap error:', err);
    // Fall back to sample data
    return new Response(JSON.stringify(sampleHeatmapData), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// CSV Export handler
async function handleCSVExport(request, env) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const days = url.searchParams.get('days');
    const category = url.searchParams.get('category');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const prefecture = url.searchParams.get('prefecture');
    const city = url.searchParams.get('city');
    
    // Check secret key from environment variable
    const expectedSecret = env.EXPORT_SECRET_KEY;
    if (!secret || secret !== expectedSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized: Invalid secret key'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('CSV export requested with filters:', { days, category, start_date, end_date, prefecture, city });
    
    // Build query with filters
    let queryParams = 'select=id,reported_at,lat,lon,prefecture,city,category,confidence_score&order=reported_at.desc&limit=10000';
    
    // Apply time filter
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      queryParams += `&reported_at=gte.${daysAgo.toISOString()}`;
    } else if (start_date) {
      queryParams += `&reported_at=gte.${start_date}T00:00:00.000Z`;
    }
    
    if (end_date) {
      queryParams += `&reported_at=lte.${end_date}T23:59:59.999Z`;
    }
    
    if (category) {
      queryParams += `&category=eq.${category}`;
    }
    
    if (prefecture) {
      queryParams += `&prefecture=eq.${prefecture}`;
    }
    
    if (city) {
      queryParams += `&city=eq.${city}`;
    }
    
    // Fetch data from Supabase
    const reports = await supabaseRequest(`reports?${queryParams}`, 'GET', null, env);
    
    console.log(`Retrieved ${reports.length} reports for CSV export`);
    
    // Helper function to get category label in Japanese
    const getCategoryLabel = (category) => {
      switch (category) {
        case 'walk_smoke': return '歩きタバコ';
        case 'stand_smoke': return '立ち止まり喫煙';
        case 'litter': return 'ポイ捨て';
        default: return category;
      }
    };
    
    // Generate CSV content
    const csvHeaders = [
      'ID',
      '報告日時',
      '緯度',
      '経度', 
      '都道府県',
      '市区町村',
      'カテゴリ',
      '信頼度スコア'
    ];
    
    const csvRows = reports.map(report => [
      report.id,
      new Date(report.reported_at).toLocaleString('ja-JP'),
      report.lat.toString(),
      report.lon.toString(),
      report.prefecture,
      report.city,
      getCategoryLabel(report.category),
      report.confidence_score.toString()
    ]);
    
    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `no-smoke-walk-reports-${timestamp}.csv`;
    
    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition',
      }
    });
    
  } catch (err) {
    console.error('CSV export error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Reports submission handler
async function handleReports(request, env) {
  try {
    const reportData = await request.json();
    console.log('Report submitted:', reportData);
    
    // Validate category (only allow walk_smoke and stand_smoke)
    const validCategories = ['walk_smoke', 'stand_smoke'];
    if (!validCategories.includes(reportData.category)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category. Only walk_smoke and stand_smoke are allowed.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create hashes for IP and fingerprint (ensure exactly 64 characters)
    const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '127.0.0.1';
    
    // Create crypto hash using Web Crypto API
    const encoder = new TextEncoder();
    const ipHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(ipAddress));
    const fpHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(reportData) + Date.now().toString()));
    
    const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const fpHash = Array.from(new Uint8Array(fpHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Generated hashes:', { ipHash: ipHash.length, fpHash: fpHash.length });
    
    // Parse address information from frontend
    let prefecture = '大阪府'; // default
    let city = '大阪市中央区'; // default
    
    if (reportData.address) {
      console.log('Processing address:', reportData.address);
      
      // Parse address components
      const addressParts = reportData.address.split(',').map(part => part.trim());
      
      // Extract prefecture (都道府県)
      const prefectureMatch = addressParts.find(part => 
        part.includes('府') || part.includes('県') || part.includes('都') || part.includes('道')
      );
      if (prefectureMatch) {
        prefecture = prefectureMatch;
      }
      
      // Extract city (市区町村)
      const cityMatch = addressParts.find(part => 
        part.includes('市') || part.includes('区') || part.includes('町') || part.includes('村')
      );
      if (cityMatch) {
        city = cityMatch;
      }
      
      console.log('Parsed address:', { prefecture, city });
    } else {
      console.log('No address provided, using coordinate-based fallback');
      // Fallback to coordinate-based logic for backward compatibility
      if (reportData.lat >= 34.76 && reportData.lat <= 34.78) {
        city = '吹田市';
      } else if (reportData.lat >= 34.69 && reportData.lat <= 34.71) {
        city = '大阪市北区';
      } else if (reportData.lat >= 34.66 && reportData.lat <= 34.68) {
        city = '大阪市中央区';
      }
    }
    
    // Insert into Supabase using HTTP API
    const data = await supabaseRequest('reports', 'POST', {
      lat: reportData.lat,
      lon: reportData.lon,
      prefecture: prefecture,
      city: city,
      category: reportData.category,
      ip_hash: ipHash,
      fp_hash: fpHash,
      confidence_score: 8
    }, env);
    
    console.log('Report saved to database:', data);
    return new Response(JSON.stringify({
      success: true,
      id: data[0].id,
      message: 'Report submitted successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Error processing report:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main Workers export
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS settings
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Apply CORS headers to all responses
    const addCorsHeaders = (response) => {
      const newResponse = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });
      return newResponse;
    };
    
    try {
      let response;
      
      // Route handling
      if (path === '/api/health' || path === '/health') {
        response = await handleHealth(request, env);
      } else if (path === '/api/heatmap' && request.method === 'GET') {
        response = await handleHeatmap(request, env);
      } else if (path === '/api/export/csv' && request.method === 'GET') {
        response = await handleCSVExport(request, env);
      } else if (path === '/api/reports' && request.method === 'POST') {
        response = await handleReports(request, env);
      } else {
        response = new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return addCorsHeaders(response);
      
    } catch (error) {
      console.error('Workers error:', error);
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
      return addCorsHeaders(errorResponse);
    }
  }
};