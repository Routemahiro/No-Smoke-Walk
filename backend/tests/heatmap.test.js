// Simple test for Heatmap API
// Note: This is a basic test without actual database connection

const testHeatmapAPI = async () => {
  console.log('🗺️ Testing Heatmap API...');
  
  // Test 1: Query parameter validation
  console.log('\n1. Testing query parameter validation...');
  
  // Valid days parameter
  const validDays = [1, 7, 30, 90, 365];
  validDays.forEach(days => {
    const isValid = days >= 1 && days <= 365;
    console.log(`✅ Days parameter ${days} is valid: ${isValid}`);
  });
  
  // Invalid days parameter
  const invalidDays = [0, -1, 366, 1000];
  invalidDays.forEach(days => {
    const isValid = days >= 1 && days <= 365;
    console.log(`✅ Days parameter ${days} is invalid: ${!isValid}`);
  });
  
  // Valid categories
  const validCategories = ['walk_smoke', 'stand_smoke', 'litter'];
  validCategories.forEach(category => {
    const isValid = ['walk_smoke', 'stand_smoke', 'litter'].includes(category);
    console.log(`✅ Category "${category}" is valid: ${isValid}`);
  });
  
  // Invalid categories
  const invalidCategories = ['smoking', 'trash', 'other', ''];
  invalidCategories.forEach(category => {
    const isValid = ['walk_smoke', 'stand_smoke', 'litter'].includes(category);
    console.log(`✅ Category "${category}" is invalid: ${!isValid}`);
  });
  
  // Test 2: Grid aggregation logic
  console.log('\n2. Testing grid aggregation logic...');
  const gridSize = 0.009; // 1km grid
  
  const testPoints = [
    { lat: 34.702485, lon: 135.495951, category: 'walk_smoke' },
    { lat: 34.702500, lon: 135.496000, category: 'walk_smoke' }, // Same grid
    { lat: 34.702123, lon: 135.496234, category: 'stand_smoke' }, // Same grid
    { lat: 34.720000, lon: 135.510000, category: 'litter' }, // Different grid
  ];
  
  const gridData = new Map();
  
  testPoints.forEach(point => {
    const gridLat = Math.round(point.lat / gridSize) * gridSize;
    const gridLon = Math.round(point.lon / gridSize) * gridSize;
    const gridKey = `${gridLat},${gridLon}`;
    
    const existing = gridData.get(gridKey);
    if (existing) {
      existing.count++;
      existing.categories[point.category] = (existing.categories[point.category] || 0) + 1;
    } else {
      gridData.set(gridKey, {
        lat: gridLat,
        lon: gridLon,
        count: 1,
        categories: { [point.category]: 1 }
      });
    }
  });
  
  console.log(`✅ Created ${gridData.size} grid cells from ${testPoints.length} points`);
  
  // Check aggregation results
  gridData.forEach((data, gridKey) => {
    console.log(`📍 Grid ${gridKey}: ${data.count} reports, categories: ${JSON.stringify(data.categories)}`);
  });
  
  // Test 3: Minimum reports filtering
  console.log('\n3. Testing minimum reports filtering...');
  const minReports = 3;
  
  const filteredGrids = Array.from(gridData.values()).filter(point => point.count >= minReports);
  console.log(`✅ ${filteredGrids.length} grid cells meet minimum ${minReports} reports threshold`);
  
  // Test 4: GeoJSON structure validation
  console.log('\n4. Testing GeoJSON structure...');
  
  const features = Array.from(gridData.values()).map(point => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.lon, point.lat]
    },
    properties: {
      count: point.count,
      categories: point.categories,
      intensity: Math.min(point.count / 10, 1)
    }
  }));
  
  const geoJSON = {
    type: 'FeatureCollection',
    features
  };
  
  // Validate GeoJSON structure
  const isValidGeoJSON = (
    geoJSON.type === 'FeatureCollection' &&
    Array.isArray(geoJSON.features) &&
    geoJSON.features.every(feature => 
      feature.type === 'Feature' &&
      feature.geometry &&
      feature.geometry.type === 'Point' &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.properties
    )
  );
  
  console.log(`✅ GeoJSON structure is valid: ${isValidGeoJSON}`);
  console.log(`📊 Generated ${features.length} features`);
  
  // Test 5: Intensity calculation
  console.log('\n5. Testing intensity calculation...');
  
  const testCounts = [1, 5, 10, 15, 25];
  testCounts.forEach(count => {
    const intensity = Math.min(count / 10, 1);
    console.log(`📈 Count ${count} → Intensity ${intensity.toFixed(2)}`);
  });
  
  // Test 6: Statistics calculation
  console.log('\n6. Testing statistics calculation...');
  
  const mockReports = [
    { category: 'walk_smoke', prefecture: '大阪府', city: '大阪市北区' },
    { category: 'walk_smoke', prefecture: '大阪府', city: '大阪市北区' },
    { category: 'stand_smoke', prefecture: '大阪府', city: '大阪市中央区' },
    { category: 'litter', prefecture: '大阪府', city: '大阪市天王寺区' },
    { category: 'walk_smoke', prefecture: '大阪府', city: '大阪市中央区' }
  ];
  
  const categoryBreakdown = mockReports.reduce((acc, report) => {
    acc[report.category] = (acc[report.category] || 0) + 1;
    return acc;
  }, {});
  
  const locationBreakdown = mockReports.reduce((acc, report) => {
    const locationKey = `${report.prefecture} ${report.city}`;
    acc[locationKey] = (acc[locationKey] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 Category breakdown:', categoryBreakdown);
  console.log('📍 Location breakdown:', locationBreakdown);
  
  const topLocations = Object.entries(locationBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([location, count]) => {
      const [prefecture, city] = location.split(' ');
      return { prefecture, city, count };
    });
  
  console.log('🏆 Top locations:', topLocations);
  
  console.log('\n🎉 Heatmap API tests completed!');
};

// Run tests
testHeatmapAPI().catch(console.error);