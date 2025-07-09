const http = require('http');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#') && key.trim() && value.trim()) {
      process.env[key.trim()] = value.trim();
    }
  });
  console.log('✅ Loaded .env.local configuration');
}

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
      
      // Get real data from Supabase HTTP API with 6-month time filter
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      const timeFilter = sixMonthsAgo.toISOString();
      
      let reports = await supabaseRequest(`reports?select=lat,lon,category&reported_at=gte.${timeFilter}&order=reported_at.desc&limit=1000`);
      
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

  // CSV Export endpoint
  if (parsedUrl.pathname === '/api/export/csv' && req.method === 'GET') {
    try {
      const { secret, days, category, start_date, end_date, prefecture, city } = parsedUrl.query;
      
      // Check secret key from environment variable
      const expectedSecret = process.env.EXPORT_SECRET_KEY;
      if (!secret || secret !== expectedSecret) {
        res.writeHead(403);
        res.end(JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid secret key'
        }));
        return;
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
      const reports = await supabaseRequest(`reports?${queryParams}`);
      
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
      
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      });
      res.end(csvWithBom);
      
    } catch (err) {
      console.error('CSV export error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }));
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
  console.log(`📊 CSV export: http://localhost:${port}/api/export/csv?secret=YOUR_SECRET`);
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