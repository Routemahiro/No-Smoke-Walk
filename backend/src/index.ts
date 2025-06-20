export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CACHE?: KVNamespace;
  ABUSE_GUARD?: string;
}

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
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    if (url.pathname === '/api/reports' && request.method === 'POST') {
      // TODO: Implement report submission
      return new Response(JSON.stringify({ message: 'Reports API - Coming Soon' }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    if (url.pathname === '/api/heatmap' && request.method === 'GET') {
      // TODO: Implement heatmap data
      return new Response(JSON.stringify({ message: 'Heatmap API - Coming Soon' }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    // 404 for other routes
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  },
};