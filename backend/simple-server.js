const http = require('http');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const port = 8787;

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
          coordinates: [135.4950, 34.6980] // Umeda area
        },
        properties: {
          count: 3,
          category: 'litter'
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
      // Get real data from Supabase HTTP API
      const reports = await supabaseRequest('reports?select=lat,lon,category&order=reported_at.desc&limit=1000');
      
      // Convert to GeoJSON format
      const features = reports.map(report => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(report.lon), parseFloat(report.lat)]
        },
        properties: {
          count: 1,
          category: report.category
        }
      }));
      
      const realHeatmapData = {
        success: true,
        data: {
          type: 'FeatureCollection',
          features: features
        }
      };
      
      console.log(`Serving ${features.length} real heatmap features`);
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