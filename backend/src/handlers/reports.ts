import { getLocationName, createIpHash, createFingerprintHash } from '../utils/supabase';
import { ReportSubmissionRequest, ApiResponse, Env } from '../types';

export async function handleReportSubmission(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body: ReportSubmissionRequest = await request.json();
    
    // Support both lat/lon and latitude/longitude parameter formats
    const lat = body.lat || body.latitude;
    const lon = body.lon || body.longitude;
    
    // Validate required fields
    if (!lat || !lon || !body.category) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: latitude/lat, longitude/lon, category'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate coordinate ranges (Japan bounds)
    if (lat < 24 || lat > 46 || lon < 123 || lon > 146) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Coordinates out of Japan bounds'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate category
    const validCategories = ['walk_smoke', 'stand_smoke', 'litter'];
    if (!validCategories.includes(body.category)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category. Must be one of: walk_smoke, stand_smoke, litter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    '127.0.0.1';

    // Create hashes for privacy
    const ipHash = await createIpHash(clientIP);
    const fingerprintHash = await createFingerprintHash(clientIP + request.headers.get('User-Agent') || '');

    // Check abuse guard if enabled
    if (env.ABUSE_GUARD === 'true') {
      const abuseCheck = await checkAbuseGuard(env, ipHash, fingerprintHash);
      if (!abuseCheck.allowed) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get location name from coordinates
    const location = await getLocationName(lat, lon);

    // Insert report using HTTP API
    const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        lat: lat,
        lon: lon,
        category: body.category,
        prefecture: location.prefecture,
        city: location.city,
        ip_hash: ipHash,
        fp_hash: fingerprintHash,
        confidence_score: 1
      })
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Database error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save report'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For minimal return, we don't get data back
    // const data = await supabaseResponse.json();

    // Update abuse guard if enabled
    if (env.ABUSE_GUARD === 'true') {
      await updateAbuseGuard(env, ipHash, fingerprintHash);
    }

    // Return success response
    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Report submitted successfully',
        timestamp: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Report submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Abuse guard functions
async function checkAbuseGuard(env: Env, ipHash: string, fpHash: string): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/abuse_guard?select=report_count&or=(ip_hash.eq.${ipHash},fp_hash.eq.${fpHash})&window_start=gte.${windowStart.toISOString()}`, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Abuse guard check error:', response.status, response.statusText);
      return { allowed: true }; // Fail open for availability
    }

    const data = await response.json();
    const reportCount = data?.[0]?.report_count || 0;
    return { allowed: reportCount < 5 }; // Max 5 reports per 10 minutes
  } catch (error) {
    console.error('Abuse guard check error:', error);
    return { allowed: true }; // Fail open for availability
  }
}

async function updateAbuseGuard(env: Env, ipHash: string, fpHash: string): Promise<void> {
  const windowStart = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

  try {
    // Try to get existing record
    const getResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/abuse_guard?select=id,report_count&or=(ip_hash.eq.${ipHash},fp_hash.eq.${fpHash})&window_start=gte.${windowStart.toISOString()}`, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (getResponse.ok) {
      const existingData = await getResponse.json() as Array<{ id: string; report_count: number }>;
      const existing = existingData[0];
      
      if (existing) {
        // Update existing record
        await fetch(`${env.SUPABASE_URL}/rest/v1/abuse_guard?id=eq.${existing.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            report_count: existing.report_count + 1,
            updated_at: new Date().toISOString()
          })
        });
      } else {
        // Create new record
        await fetch(`${env.SUPABASE_URL}/rest/v1/abuse_guard`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ip_hash: ipHash,
            fp_hash: fpHash,
            report_count: 1,
            window_start: new Date().toISOString()
          })
        });
      }
    }
  } catch (error) {
    console.error('Abuse guard update error:', error);
    // Fail silently to not block report submission
  }
}
