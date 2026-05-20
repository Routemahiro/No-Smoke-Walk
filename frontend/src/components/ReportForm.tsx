'use client';

import { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader2, Cigarette, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeolocation } from '@/hooks/useGeolocation';
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
    permissionState,
    lastKnownLocation,
    getCurrentLocation,
  } = useGeolocation();
  const { isBlocked, remainingTime, submissionCount, maxSubmissions, recordSubmission } = useRateLimit();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCategorySelect = (category: ReportCategory) => {
    setSelectedCategory(category);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    if (isBlocked) {
      setSubmitError(`連続投稿を防ぐため、あと${remainingTime}秒お待ちください`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const reportLocation = location ?? await getCurrentLocation({ forceFresh: true });
      if (!reportLocation) {
        return;
      }

      const canSubmit = recordSubmission();
      if (!canSubmit) {
        setSubmitError('短時間に投稿が集中しています。少し時間をおいてから再度お試しください。');
        return;
      }

      await apiClient.submitReport({
        lat: reportLocation.lat,
        lon: reportLocation.lon,
        category: selectedCategory,
      });

      trackReportSubmission(selectedCategory, { lat: reportLocation.lat, lon: reportLocation.lon });

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
          {!location && !locationLoading && !locationError && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                報告内容を選んで送信ボタンを押すと、現在地の取得許可を確認します。取得できた現在地だけを報告に使います。
              </AlertDescription>
            </Alert>
          )}

          {!location && lastKnownLocation && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                前回の位置情報は保存されていますが、報告には使いません。送信時に現在地を取得します。
              </AlertDescription>
            </Alert>
          )}

          {!location && permissionState === 'denied' && !locationLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                位置情報が拒否されています。報告するにはブラウザ設定でこのサイトの位置情報を許可してください。
              </AlertDescription>
            </Alert>
          )}

          {locationLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>現在地を取得しています...</AlertDescription>
            </Alert>
          )}

          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
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
                  className={`h-auto p-3 justify-start ${isSelected ? config.color : ''}`}
                  onClick={() => handleCategorySelect(key as ReportCategory)}
                  disabled={locationLoading || submitting}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs opacity-90">{config.description}</div>
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
            disabled={!selectedCategory || submitting || isBlocked || locationLoading}
            className={`w-full transition-all duration-200 ${
              selectedCategory && !submitting && !isBlocked && !locationLoading
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg transform hover:scale-105 border-2 border-emerald-300'
                : ''
            }`}
            size="lg"
          >
            {submitting || locationLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {location ? '送信中...' : '現在地を取得中...'}
              </>
            ) : isBlocked ? (
              `投稿制限中 (${remainingTime}s)`
            ) : selectedCategory ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                報告を送信
              </>
            ) : (
              '報告内容を選択してください'
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
