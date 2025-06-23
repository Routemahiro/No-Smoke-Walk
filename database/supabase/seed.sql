-- Insert test admin user
INSERT INTO admin_users (email, role) VALUES 
('admin@no-smoke-walk.osaka', 'admin');

-- Insert test report data for Osaka area
-- Osaka Station area (busy smoking hotspot)
INSERT INTO reports (lat, lon, prefecture, city, category, ip_hash, fp_hash, confidence_score, reported_at) VALUES 
(34.702485, 135.495951, '大阪府', '大阪市北区', 'walk_smoke', 'test_hash_001', 'fp_hash_001', 8, NOW() - INTERVAL '1 hour'),
(34.702123, 135.496234, '大阪府', '大阪市北区', 'stand_smoke', 'test_hash_002', 'fp_hash_002', 7, NOW() - INTERVAL '2 hours'),
(34.701890, 135.495678, '大阪府', '大阪市北区', 'litter', 'test_hash_003', 'fp_hash_003', 9, NOW() - INTERVAL '3 hours'),

-- Umeda area
(34.705374, 135.500399, '大阪府', '大阪市北区', 'walk_smoke', 'test_hash_004', 'fp_hash_004', 6, NOW() - INTERVAL '4 hours'),
(34.704892, 135.501123, '大阪府', '大阪市北区', 'walk_smoke', 'test_hash_005', 'fp_hash_005', 8, NOW() - INTERVAL '5 hours'),

-- Namba area
(34.668736, 135.501017, '大阪府', '大阪市中央区', 'stand_smoke', 'test_hash_006', 'fp_hash_006', 7, NOW() - INTERVAL '6 hours'),
(34.669234, 135.500456, '大阪府', '大阪市中央区', 'walk_smoke', 'test_hash_007', 'fp_hash_007', 9, NOW() - INTERVAL '7 hours'),
(34.668912, 135.501345, '大阪府', '大阪市中央区', 'litter', 'test_hash_008', 'fp_hash_008', 5, NOW() - INTERVAL '8 hours'),

-- Tennoji area
(34.645042, 135.506073, '大阪府', '大阪市天王寺区', 'walk_smoke', 'test_hash_009', 'fp_hash_009', 7, NOW() - INTERVAL '9 hours'),
(34.644789, 135.505678, '大阪府', '大阪市天王寺区', 'stand_smoke', 'test_hash_010', 'fp_hash_010', 8, NOW() - INTERVAL '10 hours'),

-- Add some older data for time-series testing
(34.702485, 135.495951, '大阪府', '大阪市北区', 'walk_smoke', 'test_hash_011', 'fp_hash_011', 6, NOW() - INTERVAL '1 day'),
(34.702485, 135.495951, '大阪府', '大阪市北区', 'walk_smoke', 'test_hash_012', 'fp_hash_012', 7, NOW() - INTERVAL '2 days'),
(34.668736, 135.501017, '大阪府', '大阪市中央区', 'stand_smoke', 'test_hash_013', 'fp_hash_013', 8, NOW() - INTERVAL '3 days'),
(34.668736, 135.501017, '大阪府', '大阪市中央区', 'litter', 'test_hash_014', 'fp_hash_014', 5, NOW() - INTERVAL '7 days'),
(34.645042, 135.506073, '大阪府', '大阪市天王寺区', 'walk_smoke', 'test_hash_015', 'fp_hash_015', 9, NOW() - INTERVAL '14 days');

-- Verify data insertion
SELECT 
    'Reports inserted' as status,
    COUNT(*) as count 
FROM reports;

SELECT 
    'Admin users inserted' as status,
    COUNT(*) as count 
FROM admin_users;

-- Test heatmap view
SELECT 
    'Heatmap data points' as status,
    COUNT(*) as count 
FROM heatmap_public;