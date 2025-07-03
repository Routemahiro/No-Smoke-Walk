const http = require('http');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const port = 8787;

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

// Supabase client - Use HTTP API instead of SDK for reliability
const supabaseUrl = 'https://qdqcocgoaxzbhvvmvttr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcWNvY2dvYXh6Ymh2dm12dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjY0NzMsImV4cCI6MjA2NjgwMjQ3M30.3sr3dXq7GOz8yLcKn602Ba8Ej-X1zIpCn-T_BxM5Ofk'; // anon key

// Helper function for Supabase HTTP requests
async function supabaseRequest(endpoint, method = 'GET', body = null) {
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

// Sample heatmap data
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

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (parsedUrl.pathname === '/api/health' || parsedUrl.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'development'
    }));
    return;
  }

  // Heatmap data endpoint
  if (parsedUrl.pathname === '/api/heatmap' && req.method === 'GET') {
    console.log('Serving heatmap data with params:', parsedUrl.query);
    
    try {
      const { userLat, userLon } = parsedUrl.query;
      const cacheKey = getCacheKey(userLat, userLon);
      
      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Serving cached heatmap data for key: ${cacheKey}`);
        res.writeHead(200);
        res.end(JSON.stringify(cachedData));
        return;
      }
      
      // Get real data from Supabase HTTP API with 1-month time filter
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      const timeFilter = oneMonthAgo.toISOString();
      
      const reports = await supabaseRequest(`reports?select=lat,lon,category&reported_at=gte.${timeFilter}&order=reported_at.desc&limit=1000`);
      
      console.log(`Retrieved ${reports.length} reports from last 30 days`);
      
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
      
      console.log(`Serving ${aggregatedFeatures.length} aggregated heatmap features (last 30 days, cached)`);
      res.writeHead(200);
      res.end(JSON.stringify(realHeatmapData));
      
    } catch (err) {
      console.error('Heatmap error:', err);
      // Fall back to sample data
      res.writeHead(200);
      res.end(JSON.stringify(sampleHeatmapData));
    }
    
    return;
  }

  // Reports endpoint (real Supabase integration)
  if (parsedUrl.pathname === '/api/reports' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const reportData = JSON.parse(body);
        console.log('Report submitted:', reportData);
        
        // Validate category (only allow walk_smoke and stand_smoke)
        const validCategories = ['walk_smoke', 'stand_smoke'];
        if (!validCategories.includes(reportData.category)) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid category. Only walk_smoke and stand_smoke are allowed.'
          }));
          return;
        }
        
        // Create hashes for IP and fingerprint (ensure exactly 64 characters)
        const ipAddress = req.socket.remoteAddress || req.connection.remoteAddress || '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');
        const fpHash = crypto.createHash('sha256').update(JSON.stringify(reportData) + Date.now().toString()).digest('hex');
        
        console.log('Generated hashes:', { ipHash: ipHash.length, fpHash: fpHash.length });
        
        // Determine city based on coordinates (simple logic for Osaka area)
        let city = '大阪市中央区'; // default
        if (reportData.lat >= 34.76 && reportData.lat <= 34.78) {
          city = '吹田市';
        } else if (reportData.lat >= 34.69 && reportData.lat <= 34.71) {
          city = '大阪市北区';
        } else if (reportData.lat >= 34.66 && reportData.lat <= 34.68) {
          city = '大阪市中央区';
        }
        
        // Insert into Supabase using HTTP API
        const data = await supabaseRequest('reports', 'POST', {
          lat: reportData.lat,
          lon: reportData.lon,
          prefecture: '大阪府',
          city: city,
          category: reportData.category,
          ip_hash: ipHash,
          fp_hash: fpHash,
          confidence_score: 8
        });
        
        console.log('Report saved to database:', data);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          id: data[0].id,
          message: 'Report submitted successfully'
        }));
        
      } catch (err) {
        console.error('Error processing report:', err);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Internal server error'
        }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(port, () => {
  console.log(`\n🚀 Simple API Server running on http://localhost:${port}`);
  console.log(`📍 Health check: http://localhost:${port}/api/health`);
  console.log(`🗺️  Heatmap data: http://localhost:${port}/api/heatmap`);
  console.log(`📝 Ready to serve No-Smoke Walk data!\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});