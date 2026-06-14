'use client';

import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader2, Cigarette, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GEOLOCATION_AUTO_FETCH_CHANGED_EVENT, useGeolocation } from '@/hooks/useGeolocation';
import { useRateLimit } from '@/hooks/useRateLimit';
import { apiClient } from '@/lib/supabase';
import { ReportCategory } from '@/types';
import { MiniHeatmap } from '@/components/MiniHeatmap';
import { trackReportSubmission } from '@/components/GoogleAnalytics';

const CATEGORY_CONFIG = {
  walk_smoke: {
    label: '歩きタバコ',
    description: '歩きながら喫煙している人を見かけた',
    icon: Users,
    color: 'bg-rose-500 hover:bg-rose-600',
  },
  stand_smoke: {
    label: '立ち止まり喫煙',
    description: '路上や公共エリアで立ち止まって喫煙している人を見かけた',
    icon: Cigarette,
    color: 'bg-amber-500 hover:bg-amber-600',
  },
} as const;

export function ReportForm() {
  const {
    location,
    error: locationError,
    loading: locationLoading,
    isWatching,
    permissionState,
    needsPermission,
    lastKnownLocation,
    getCurrentLocation,
  } = useGeolocation();
  const { isBlocked, remainingTime, submissionCount, maxSubmissions, recordSubmission } = useRateLimit();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geolocation-auto-fetch');
      setAutoFetchEnabled(saved === 'true');
    }
  }, []);

  const toggleAutoFetch = (enabled: boolean) => {
    setAutoFetchEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('geolocation-auto-fetch', enabled.toString());
      window.dispatchEvent(new CustomEvent(GEOLOCATION_AUTO_FETCH_CHANGED_EVENT, { detail: { enabled } }));
    }
    if (enabled) {
      void getCurrentLocation({ forceFresh: true });
    }
  };

  const handleSubmit = async () => {
    if (!location || !selectedCategory) return;

    if (isBlocked) {
      setSubmitError(`連続投稿を防ぐため、あと${remainingTime}秒お待ちください`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const canSubmit = recordSubmission();
      if (!canSubmit) {
        setSubmitError('短時間に投稿が集中しています。少し時間をおいてから再度お試しください。');
        return;
      }

      await apiClient.submitReport({
        lat: location.lat,
        lon: location.lon,
        category: selectedCategory,
      });

      trackReportSubmission(selectedCategory, { lat: location.lat, lon: location.lon });

      setSubmitSuccess(true);
      setSelectedCategory(null);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '報告の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          迷惑タバコ報告
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <MiniHeatmap userLocation={location ? { lat: location.lat, lon: location.lon } : undefined} />

        <div className="space-y-2">
          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  自動的に現在位置を取得
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleAutoFetch(!autoFetchEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoFetchEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoFetchEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-blue-700 mt-1">
              {autoFetchEnabled
                ? (isWatching
                    ? '15〜30秒ごとに現在地を自動更新しています'
                    : needsPermission
                      ? '位置情報の自動取得にはブラウザの許可が必要です'
                      : '許可済みの場合は15〜30秒ごとに自動更新します')
                : '手動で「現在位置を表示」ボタンを押す必要があります'}
            </p>
          </div>

          {!location && lastKnownLocation && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                前回の位置情報は保存されていますが、現在位置としては使用していません。投稿するには現在位置を取得してください。
              </AlertDescription>
            </Alert>
          )}

          {!location && autoFetchEnabled && permissionState === 'prompt' && !locationLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                自動取得を有効にするには位置情報の許可が必要です。許可ダイアログで許可するか、現在位置ボタンを押してください。
              </AlertDescription>
            </Alert>
          )}

          {!location && autoFetchEnabled && permissionState === 'denied' && !locationLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                位置情報が拒否されています。ブラウザ設定でこのサイトの位置情報を許可してください。
              </AlertDescription>
            </Alert>
          )}

          {locationLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>位置情報を取得中...</AlertDescription>
            </Alert>
          )}

          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {locationError}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getCurrentLocation({ forceFresh: true })}
                  className="mt-2"
                >
                  再試行
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!locationLoading && !locationError && (
            <Button
              onClick={() => getCurrentLocation({ forceFresh: true })}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {location ? '現在位置を更新' : '現在位置を表示'}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">報告内容を選択</h4>

          <div className="grid gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = selectedCategory === key;

              return (
                <Button
                  key={key}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`h-auto w-full items-start justify-start whitespace-normal p-3 text-left ${isSelected ? config.color : ''}`}
                  onClick={() => setSelectedCategory(key as ReportCategory)}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="min-w-0 text-left">
                    <div className="font-medium">{config.label}</div>
                    <div className="break-words text-xs opacity-90">{config.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>報告を送信しました。ご協力ありがとうございます。</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!location || !selectedCategory || submitting || isBlocked}
            className={`w-full transition-all duration-200 ${
              location && selectedCategory && !submitting && !isBlocked
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg transform hover:scale-105 border-2 border-emerald-300'
                : ''
            }`}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                送信中...
              </>
            ) : isBlocked ? (
              `投稿制限中 (${remainingTime}s)`
            ) : location && selectedCategory ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                報告を送信
              </>
            ) : (
              '報告を送信'
            )}
          </Button>
        </div>

        {submissionCount > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="text-xs font-medium mb-1">投稿状況</h5>
            <div className="text-xs text-blue-600">
              10分間の投稿数: {submissionCount}/{maxSubmissions}
              {isBlocked && (
                <span className="block mt-1 text-orange-600">
                  連続投稿を防ぐため、あと{remainingTime}秒でリセットされます
                </span>
              )}
            </div>
          </div>
        )}

        <div className="bg-muted/50 p-3 rounded-lg">
          <h5 className="text-xs font-medium mb-1">ご利用について</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>・情報精度向上のため、10分間に{maxSubmissions}件まで投稿できます</li>
            <li>・報告された情報は統計データとして活用されます</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
