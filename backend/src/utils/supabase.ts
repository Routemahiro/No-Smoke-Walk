import { lookupOsakaWard } from './wardLookup';
import { Env } from '../types';

export function createSupabaseHeaders(apiKey: string, extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: apiKey,
    ...extraHeaders,
  };

  // New Supabase sb_* API keys are opaque, not JWTs, so they must not be used
  // as Authorization bearer tokens. Legacy anon/service_role JWTs still need it.
  if (!apiKey.startsWith('sb_')) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

// Helper function to get location name from coordinates
export async function getLocationName(lat: number, lon: number): Promise<{ prefecture: string; city: string }> {
  // Point-in-polygon against the 24 Osaka city ward boundaries (国土数値情報 N03).
  // Points outside the city are stored as "大阪市外" (not rejected).
  return { prefecture: '大阪府', city: lookupOsakaWard(lat, lon) };
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
