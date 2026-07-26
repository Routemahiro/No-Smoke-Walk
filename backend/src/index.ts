import { handleReportSubmission } from './handlers/reports';
import { handleHeatmapRequest, handleHeatmapStats } from './handlers/heatmap';
import { handleExportCSV, handleExportExcel } from './handlers/export';
import { Env } from './types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([name, value]) => {
    headers.set(name, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Basic routing
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'development'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    // Debug endpoint to check environment variables
    if (url.pathname === '/api/debug/env') {
      return new Response(JSON.stringify({ 
        hasSupabaseUrl: !!env.SUPABASE_URL,
        hasSupabaseKey: !!env.SUPABASE_ANON_KEY,
        supabaseUrlPrefix: env.SUPABASE_URL ? env.SUPABASE_URL.substring(0, 20) + '...' : 'undefined',
        environment: env.ENVIRONMENT || 'undefined',
        abuseGuard: env.ABUSE_GUARD || 'undefined'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    if (url.pathname === '/api/reports' && request.method === 'POST') {
      return withCors(await handleReportSubmission(request, env));
    }

    if (url.pathname === '/api/heatmap' && request.method === 'GET') {
      return withCors(await handleHeatmapRequest(request, env));
    }

    if (url.pathname === '/api/heatmap/stats' && request.method === 'GET') {
      return withCors(await handleHeatmapStats(request, env));
    }

    if (url.pathname === '/api/export/csv' && request.method === 'GET') {
      return withCors(await handleExportCSV(request, env));
    }

    if (url.pathname === '/api/admin/export/csv' && request.method === 'GET') {
      return withCors(await handleExportCSV(request, env));
    }

    if (url.pathname === '/api/admin/export/excel' && request.method === 'GET') {
      return withCors(await handleExportExcel(request, env));
    }

    // 404 for other routes
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  },
};
