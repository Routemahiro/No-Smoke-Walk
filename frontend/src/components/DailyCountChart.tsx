'use client';

import { useEffect, useState } from 'react';
import { ds } from '@/components/ds';
import { apiClient } from '@/lib/apiClient';
import type { DailyStats } from '@/types';

export type DailyCountChartProps = {
  refreshKey?: number;
  /** Absolute count for today from the POST response. Raises a stale cached GET. */
  todayFloor?: number | null;
};

export function formatMonthDay(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function applyTodayFloor(stats: DailyStats, todayFloor: number | null | undefined): DailyStats {
  if (todayFloor == null || !Number.isFinite(todayFloor) || stats.days.length === 0) return stats;
  const days = stats.days.map((day) => ({ ...day }));
  const last = days[days.length - 1];
  const nextToday = Math.max(last.count, stats.today, todayFloor);
  const delta = nextToday - last.count;
  last.count = nextToday;
  return {
    ...stats,
    days,
    today: nextToday,
    total: stats.total + delta,
  };
}

export function sevenDayTotalLine(total: number): string {
  if (total <= 0) {
    return 'この7日は、まだ報告が届いていません。見かけたら、ぜひ教えてください。';
  }
  return `この7日で、${total}件届いています。`;
}

export function DailyCountChart({ refreshKey = 0, todayFloor = null }: DailyCountChartProps) {
  const [stats, setStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.getDailyStats(7, { fresh: refreshKey > 0 })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((error: unknown) => {
        console.error('Daily count chart hidden:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!stats) return null;

  const view = applyTodayFloor(stats, todayFloor);
  const shown = view.days.slice(-7);
  const max = shown.reduce((highest, day) => Math.max(highest, day.count), 0);
  const total = shown.reduce((sum, day) => sum + day.count, 0);

  return (
    <section className={`${ds.panel} mx-auto w-full max-w-md p-4`} aria-labelledby="daily-count-heading">
      <h2 id="daily-count-heading" className={ds.h2}>ここ数日の報告</h2>
      <p className="mt-1 text-xs leading-5 text-gray-600">
        みなさまから届いた報告の回数です。日本時間の1日ごと。参考の数字で、実際の発生件数を表すものではありません。
      </p>
      <div className="mt-4 flex items-end gap-0.5">
        {shown.map((day, index) => {
          const isToday = index === shown.length - 1;
          const isZero = day.count === 0;
          const height = isZero ? 4 : Math.max(8, Math.round((day.count / Math.max(max, 1)) * 72));
          return (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex h-4 items-end justify-center">
                {isToday ? (
                  <span className="text-[10px] font-medium leading-none text-blue-700">きょう</span>
                ) : null}
              </div>
              <div
                className="mt-1 w-full max-w-6 rounded-sm"
                style={{
                  height,
                  backgroundColor: isZero ? '#d1d5db' : isToday ? '#2563eb' : '#93c5fd',
                }}
                data-today={isToday ? 'true' : 'false'}
                data-zero={isZero ? 'true' : 'false'}
              />
              <div className="mt-1 w-full text-center text-[10px] leading-tight text-gray-600">
                {formatMonthDay(day.date)}
              </div>
              <div className={`w-full text-center text-[10px] leading-tight ${isZero ? 'text-gray-500' : 'text-gray-700'}`}>
                {isZero ? '報告なし' : `${day.count}件`}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">{sevenDayTotalLine(total)}</p>
    </section>
  );
}
