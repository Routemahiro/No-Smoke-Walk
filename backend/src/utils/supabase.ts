import { createClient } from '@supabase/supabase-js';
import { Env } from '../types';

export function createSupabaseClient(env: Env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper function to get location name from coordinates
export async function getLocationName(lat: number, lon: number): Promise<{ prefecture: string; city: string }> {
  // For now, return default Osaka values
  // In production, this would use a reverse geocoding service
  const defaultLocation = {
    prefecture: '大阪府',
    city: '大阪市中央区'
  };

  // Simple coordinate-based city detection for Osaka area
  if (lat >= 34.6 && lat <= 34.8 && lon >= 135.4 && lon <= 135.6) {
    if (lat >= 34.69 && lat <= 34.71) {
      return { prefecture: '大阪府', city: '大阪市北区' }; // Umeda/Osaka Station area
    } else if (lat >= 34.66 && lat <= 34.68) {
      return { prefecture: '大阪府', city: '大阪市中央区' }; // Namba area
    } else if (lat >= 34.64 && lat <= 34.66) {
      return { prefecture: '大阪府', city: '大阪市天王寺区' }; // Tennoji area
    }
  }

  return defaultLocation;
}

// Helper function to create IP hash (SHA-256)
export async function createIpHash(ipAddress: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ipAddress);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to create browser fingerprint hash
export async function createFingerprintHash(fingerprint: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}