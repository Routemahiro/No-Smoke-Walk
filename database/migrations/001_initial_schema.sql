-- Enable PostGIS extension for geographical data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for report categories
CREATE TYPE report_category AS ENUM ('walk_smoke', 'stand_smoke', 'litter');

-- Create reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lon NUMERIC(9,6) NOT NULL,
    prefecture TEXT NOT NULL,
    city TEXT NOT NULL,
    category report_category NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    fp_hash CHAR(64) NOT NULL,
    confidence_score SMALLINT DEFAULT 1 NOT NULL CHECK (confidence_score >= 1 AND confidence_score <= 10),
    
    -- Add geographical point column for PostGIS
    geom GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED
);

-- Create admin_users table
CREATE TABLE admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create abuse_guard table (for rate limiting)
CREATE TABLE abuse_guard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_hash CHAR(64) NOT NULL,
    fp_hash CHAR(64) NOT NULL,
    report_count INTEGER DEFAULT 1 NOT NULL,
    window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_reports_reported_at ON reports(reported_at);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_prefecture_city ON reports(prefecture, city);
CREATE INDEX idx_reports_geom ON reports USING GIST(geom);
CREATE INDEX idx_abuse_guard_ip_hash ON abuse_guard(ip_hash);
CREATE INDEX idx_abuse_guard_fp_hash ON abuse_guard(fp_hash);
CREATE INDEX idx_abuse_guard_window_start ON abuse_guard(window_start);

-- Create view for public heatmap data (aggregated by 1km hexagon)
-- Note: This is a simplified version. In production, we'd use H3 hexagon functions
CREATE OR REPLACE VIEW heatmap_public AS
WITH grid_reports AS (
    SELECT 
        -- Simple grid aggregation (1km = ~0.009 degrees)
        ROUND(lat::numeric, 2) as grid_lat,
        ROUND(lon::numeric, 2) as grid_lon,
        category,
        COUNT(*) as report_count
    FROM reports 
    WHERE reported_at >= NOW() - INTERVAL '30 days'
    GROUP BY ROUND(lat::numeric, 2), ROUND(lon::numeric, 2), category
)
SELECT 
    grid_lat as lat,
    grid_lon as lon,
    category,
    report_count as count,
    ST_SetSRID(ST_MakePoint(grid_lon, grid_lat), 4326) as geom
FROM grid_reports
WHERE report_count >= 3; -- Only show hotspots with 3+ reports

-- Row Level Security (RLS) policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_guard ENABLE ROW LEVEL SECURITY;

-- Allow public to read aggregated heatmap data
CREATE POLICY "Allow public read access to heatmap" ON reports FOR SELECT USING (true);

-- Only authenticated admin users can access full report data
CREATE POLICY "Admin users can read all reports" ON reports FOR SELECT 
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

-- Admin users full access to admin_users table
CREATE POLICY "Admin users can manage admin_users" ON admin_users FOR ALL 
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

-- Only service role can write to reports (via API)
CREATE POLICY "Service role can insert reports" ON reports FOR INSERT 
    WITH CHECK (auth.role() = 'service_role');

-- Only service role can access abuse_guard
CREATE POLICY "Service role can manage abuse_guard" ON abuse_guard FOR ALL 
    USING (auth.role() = 'service_role');