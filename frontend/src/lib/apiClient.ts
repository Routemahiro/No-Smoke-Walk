type ApiErrorBody = {
  error?: unknown;
};

async function readApiError(response: Response): Promise<string | null> {
  try {
    const body = await response.json() as ApiErrorBody;
    return typeof body.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}

// API client for backend communication
export const apiClient = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787',

  async submitReport(data: {
    lat: number;
    lon: number;
    category: 'walk_smoke' | 'stand_smoke';
  }) {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Report submission connection failed:', error);
      throw new Error('報告サーバーに接続できません。時間をおいてからもう一度お試しください。');
    }

    if (!response.ok) {
      const apiError = await readApiError(response);
      console.error('Report submission failed:', {
        status: response.status,
        error: apiError,
      });

      if (response.status === 429) {
        throw new Error('短時間に投稿が集中しています。少し時間をおいてから再度お試しください。');
      }

      if (response.status >= 500) {
        throw new Error('現在、報告を保存できません。時間をおいてからもう一度お試しください。');
      }

      throw new Error(apiError || '報告の送信に失敗しました。入力内容を確認して再度お試しください。');
    }

    return response.json();
  },

  async getHeatmapData(params?: {
    category?: string;
    days?: number;
    min_reports?: number;
    userLat?: number;
    userLon?: number;
    radius?: number;
    grid_m?: number;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.set('category', params.category);
    if (params?.days) searchParams.set('days', params.days.toString());
    if (params?.min_reports) searchParams.set('min_reports', params.min_reports.toString());
    if (params?.userLat) searchParams.set('userLat', params.userLat.toString());
    if (params?.userLon) searchParams.set('userLon', params.userLon.toString());
    if (params?.radius) searchParams.set('radius', params.radius.toString());
    if (params?.grid_m) searchParams.set('grid_m', params.grid_m.toString());

    const query = searchParams.toString();
    const url = `${this.baseUrl}/api/heatmap${query ? `?${query}` : ''}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch heatmap data');
      }

      return response.json();
    } catch (fetchError) {
      // Specifically handle connection refused and network errors
      console.error('API fetch failed:', fetchError);
      throw new Error('CONNECTION_REFUSED');
    }
  },
};
