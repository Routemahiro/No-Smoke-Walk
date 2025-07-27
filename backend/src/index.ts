import { handleReportSubmission } from './handlers/reports';
import { handleHeatmapRequest, handleHeatmapStats } from './handlers/heatmap';
import { handleExportCSV, handleExportExcel } from './handlers/export';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

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
      return handleReportSubmission(request, env);
    }

    if (url.pathname === '/api/heatmap' && request.method === 'GET') {
      return handleHeatmapRequest(request, env);
    }

    if (url.pathname === '/api/heatmap/stats' && request.method === 'GET') {
      return handleHeatmapStats(request, env);
    }

    if (url.pathname === '/api/export/csv' && request.method === 'GET') {
      return handleExportCSV(request, env);
    }

    if (url.pathname === '/api/admin/export/csv' && request.method === 'GET') {
      return handleExportCSV(request, env);
    }

    if (url.pathname === '/api/admin/export/excel' && request.method === 'GET') {
      return handleExportExcel(request, env);
    }

    // 404 for other routes
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  },
};