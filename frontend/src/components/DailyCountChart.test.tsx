import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { DailyCountChart } from './DailyCountChart';
import type { DailyStats } from '@/types';

const week: DailyStats = {
  timezone: 'Asia/Tokyo',
  days: [
    { date: '2026-11-15', count: 2 },
    { date: '2026-11-16', count: 0 },
    { date: '2026-11-17', count: 1 },
    { date: '2026-11-18', count: 0 },
    { date: '2026-11-19', count: 0 },
    { date: '2026-11-20', count: 1 },
    { date: '2026-11-21', count: 3 },
  ],
  today: 3,
  total: 7,
  total_365d: 20,
};

function mockStats(body: DailyStats | null, ok = true) {
  const fetchMock = jest.fn<typeof global.fetch>();
  fetchMock.mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  } as unknown as Response);
  global.fetch = fetchMock;
  return fetchMock;
}

describe('DailyCountChart', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('renders seven bars, highlights today, and labels a zero day', async () => {
    mockStats(week);
    render(<DailyCountChart />);

    expect((await screen.findByRole('heading', { name: 'ここ数日の報告' })).textContent).toBe('ここ数日の報告');
    expect(screen.getByText('みなさまから届いた報告の回数です。日本時間の1日ごと。参考の数字で、実際の発生件数を表すものではありません。').textContent).toContain('日本時間の1日ごと');
    expect(screen.getByText('11/15').textContent).toBe('11/15');
    expect(screen.getByText('2件').textContent).toBe('2件');
    expect(screen.getByText('きょう').textContent).toBe('きょう');
    expect(screen.getAllByText('報告なし')).toHaveLength(3);
    expect(screen.getByText('この7日で、7件届いています。').textContent).toContain('7件');

    const todayBar = document.querySelector('[data-today="true"]') as HTMLElement;
    const zeroBar = document.querySelector('[data-zero="true"]') as HTMLElement;
    expect(todayBar.style.backgroundColor.replace(/\s/g, '')).toMatch(/#2563eb|rgb\(37,99,235\)/);
    expect(zeroBar.style.backgroundColor.replace(/\s/g, '')).toMatch(/#d1d5db|rgb\(209,213,219\)/);
    expect(screen.queryByText('0件')).toBeNull();
  });

  it('hides the card when the API fails', async () => {
    const fetchMock = mockStats(null, false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<DailyCountChart />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(screen.queryByRole('heading', { name: 'ここ数日の報告' })).toBeNull();
  });

  it('raises today when the post-submit count is ahead of a stale response', async () => {
    mockStats({ ...week, days: week.days.map((day) => ({ ...day })), today: 3, total: 7 });
    render(<DailyCountChart refreshKey={1} todayFloor={4} />);

    expect((await screen.findByText('この7日で、8件届いています。')).textContent).toContain('8件');
    expect(screen.getByText('4件').textContent).toBe('4件');
  });

  it('uses the empty-week sentence when every bar is zero', async () => {
    mockStats({
      ...week,
      days: week.days.map((day) => ({ date: day.date, count: 0 })),
      today: 0,
      total: 0,
      total_365d: 0,
    });
    render(<DailyCountChart />);

    expect((await screen.findByText('この7日は、まだ報告が届いていません。見かけたら、ぜひ教えてください。')).textContent).toContain('まだ報告が届いていません');
  });
});
