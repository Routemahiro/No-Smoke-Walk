import { createSupabaseClient, getLocationName, createIpHash, createFingerprintHash } from '../utils/supabase';
import { ReportSubmissionRequest, ApiResponse, Env } from '../types';

export async function handleReportSubmission(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body: ReportSubmissionRequest = await request.json();
    
    // Validate required fields
    if (!body.lat || !body.lon || !body.category) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: lat, lon, category'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate coordinate ranges (Japan bounds)
    if (body.lat < 24 || body.lat > 46 || body.lon < 123 || body.lon > 146) {
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
    const location = await getLocationName(body.lat, body.lon);

    // Insert report using HTTP API
    const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        lat: body.lat,
        lon: body.lon,
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

    const data = await supabaseResponse.json();

    // Update abuse guard if enabled
    if (env.ABUSE_GUARD === 'true') {
      await updateAbuseGuard(env, ipHash, fingerprintHash);
    }

    // Return success response
    const response: ApiResponse = {
      success: true,
      data: {
        id: data[0].id,
        reported_at: data[0].reported_at,
        message: 'Report submitted successfully'
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
  const supabase = createSupabaseClient(env);
  const windowStart = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

  const { data, error } = await supabase
    .from('abuse_guard')
    .select('report_count')
    .or(`ip_hash.eq.${ipHash},fp_hash.eq.${fpHash}`)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Abuse guard check error:', error);
    return { allowed: true }; // Fail open for availability
  }

  const reportCount = data?.report_count || 0;
  return { allowed: reportCount < 5 }; // Max 5 reports per 10 minutes
}

async function updateAbuseGuard(env: Env, ipHash: string, fpHash: string): Promise<void> {
  const supabase = createSupabaseClient(env);
  const windowStart = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

  // Try to update existing record
  const { data: existing } = await supabase
    .from('abuse_guard')
    .select('id, report_count')
    .or(`ip_hash.eq.${ipHash},fp_hash.eq.${fpHash}`)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from('abuse_guard')
      .update({ 
        report_count: existing.report_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new record
    await supabase
      .from('abuse_guard')
      .insert({
        ip_hash: ipHash,
        fp_hash: fpHash,
        report_count: 1,
        window_start: new Date().toISOString()
      });
  }
}