import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { apiClient } from './apiClient';

describe('apiClient.submitReport', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('replaces browser-specific network errors with an actionable Japanese message', async () => {
    const fetchMock = jest.fn<typeof global.fetch>();
    fetchMock.mockRejectedValue(new TypeError('Load failed'));
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(apiClient.submitReport({
      lat: 34.6937,
      lon: 135.5023,
      category: 'walk_smoke',
    })).rejects.toThrow('報告サーバーに接続できません。時間をおいてからもう一度お試しください。');
  });

  it('shows a stable service error when the API cannot save the report', async () => {
    const fetchMock = jest.fn<typeof global.fetch>();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(() => Promise.resolve({
        success: false,
        error: 'Failed to save report',
      })),
    } as unknown as Response);
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(apiClient.submitReport({
      lat: 34.6937,
      lon: 135.5023,
      category: 'stand_smoke',
    })).rejects.toThrow('現在、報告を保存できません。時間をおいてからもう一度お試しください。');
  });
});
