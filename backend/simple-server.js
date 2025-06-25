const http = require('http');
const url = require('url');

const port = 8787;

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

const server = http.createServer((req, res) => {
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
    res.writeHead(200);
    res.end(JSON.stringify(sampleHeatmapData));
    return;
  }

  // Reports endpoint (dummy)
  if (parsedUrl.pathname === '/api/reports' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Report submitted:', body);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        id: Date.now().toString(),
        message: 'Report submitted successfully'
      }));
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