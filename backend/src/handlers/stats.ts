import { Env } from '../types';
import { createSupabaseHeaders } from '../utils/supabase';

export const DAILY_STATS_TIMEZONE = 'Asia/Tokyo' as const;
export const DAILY_STATS_DEFAULT_DAYS = 30;
export const DAILY_STATS_MAX_DAYS = 365;
export const DAILY_STATS_YEAR_DAYS = 365;

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

export interface DailyCount {
  date: string;
  count: number;
}

export interface DailyStatsResponse {
  timezone: typeof DAILY_STATS_TIMEZONE;
  days: DailyCount[];
  today: number;
  total: number;
  total_365d: number;
}

export interface DailyStatsDeps {
  fetch?: typeof fetch;
  now?: () => Date;
}

export function jstDateKey(instant: Date): string {
  const shifted = new Date(instant.getTime() + JST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addJstDays(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 00:00 Asia/Tokyo on dateKey, as a UTC instant. */
export function startOfJstDayUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day) - JST_OFFSET_MS);
}

export function parseDaysParam(raw: string | null): number | 'invalid' {
  if (raw === null || raw === '') return DAILY_STATS_DEFAULT_DAYS;
  if (!/^[0-9]+$/.test(raw)) return 'invalid';
  const days = Number(raw);
  if (days < 1 || days > DAILY_STATS_MAX_DAYS) return 'invalid';
  return days;
}

export function buildDailyStats(reportedAt: readonly string[], now: Date, days: number): DailyStatsResponse {
  const todayKey = jstDateKey(now);
  const yearStartKey = addJstDays(todayKey, -(DAILY_STATS_YEAR_DAYS - 1));
  const rangeStartKey = addJstDays(todayKey, -(days - 1));
  const counts = new Map<string, number>();

  for (const iso of reportedAt) {
    const instant = new Date(iso);
    if (Number.isNaN(instant.getTime())) continue;
    const key = jstDateKey(instant);
    if (key < yearStartKey || key > todayKey) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const series: DailyCount[] = [];
  for (let i = 0; i < days; i++) {
    const date = addJstDays(rangeStartKey, i);
    series.push({ date, count: counts.get(date) || 0 });
  }

  let total365 = 0;
  for (let i = 0; i < DAILY_STATS_YEAR_DAYS; i++) {
    total365 += counts.get(addJstDays(yearStartKey, i)) || 0;
  }

  const total = series.reduce((sum, day) => sum + day.count, 0);
  return {
    timezone: DAILY_STATS_TIMEZONE,
    days: series,
    today: counts.get(todayKey) || 0,
    total,
    total_365d: total365,
  };
}

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

export async function fetchReportedAt(env: Env, sinceIso: string, fetchImpl: typeof fetch): Promise<string[]> {
  const readKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !readKey) {
    throw new Error('Supabase is not configured');
  }

  const timestamps: string[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const url = `${env.SUPABASE_URL}/rest/v1/reports?select=reported_at&reported_at=gte.${sinceIso}&order=reported_at.asc`;
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: createSupabaseHeaders(readKey, {
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Supabase query failed: ${response.status}`);
    }

    const rows = await response.json() as unknown;
    if (!Array.isArray(rows)) {
      throw new Error('Supabase response parse failed');
    }

    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const reportedAt = (row as { reported_at?: unknown }).reported_at;
      if (typeof reportedAt === 'string') timestamps.push(reportedAt);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return timestamps;
}

export async function countReportsOnJstDay(env: Env, now: Date, fetchImpl: typeof fetch = fetch): Promise<number> {
  const todayKey = jstDateKey(now);
  const since = startOfJstDayUtc(todayKey).toISOString();
  const stamps = await fetchReportedAt(env, since, fetchImpl);
  let count = 0;
  for (const iso of stamps) {
    const instant = new Date(iso);
    if (!Number.isNaN(instant.getTime()) && jstDateKey(instant) === todayKey) count++;
  }
  return count;
}

export async function handleDailyStats(request: Request, env: Env, deps: DailyStatsDeps = {}): Promise<Response> {
  const fetchImpl = deps.fetch ?? fetch;
  const now = (deps.now ?? (() => new Date()))();

  try {
    const days = parseDaysParam(new URL(request.url).searchParams.get('days'));
    if (days === 'invalid') {
      return json(
        { success: false, error: 'Invalid days parameter. Must be between 1 and 365.' },
        400,
      );
    }

    const since = startOfJstDayUtc(addJstDays(jstDateKey(now), -(DAILY_STATS_YEAR_DAYS - 1))).toISOString();
    const reportedAt = await fetchReportedAt(env, since, fetchImpl);
    const body = buildDailyStats(reportedAt, now, days);
    return json(body, 200, { 'Cache-Control': 'public, max-age=300' });
  } catch (error) {
    console.error('Daily stats error:', error);
    return json({ success: false, error: 'Failed to fetch daily statistics' }, 502);
  }
}
