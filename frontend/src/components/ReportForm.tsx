'use client';

import { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader2, Cigarette, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeolocation } from '@/hooks/useGeolocation';
import { apiClient } from '@/lib/supabase';
import { ReportCategory } from '@/types';

const CATEGORY_CONFIG = {
  walk_smoke: {
    label: '歩きタバコ',
    description: '歩きながら喫煙している人を発見',
    icon: Users,
    color: 'bg-red-500 hover:bg-red-600',
  },
  stand_smoke: {
    label: '立ち止まり喫煙',
    description: '禁煙エリアで立ち止まって喫煙している人を発見',
    icon: Cigarette,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  litter: {
    label: 'ポイ捨て',
    description: 'タバコの吸い殻などのポイ捨てを発見',
    icon: Trash2,
    color: 'bg-yellow-500 hover:bg-yellow-600',
  },
} as const;

const COOLDOWN_SECONDS = 10;

export function ReportForm() {
  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const handleSubmit = async () => {
    if (!location || !selectedCategory) return;

    if (cooldownRemaining > 0) {
      setSubmitError(`連続投稿防止のため、あと${cooldownRemaining}秒お待ちください`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiClient.submitReport({
        lat: location.lat,
        lon: location.lon,
        category: selectedCategory,
      });

      setSubmitSuccess(true);
      setSelectedCategory(null);
      
      // Start cooldown
      setCooldownRemaining(COOLDOWN_SECONDS);
      const cooldownInterval = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '報告の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryLocation = () => {
    setSubmitError(null);
    getCurrentLocation();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          喫煙・ポイ捨て報告
        </CardTitle>
        <CardDescription>
          歩きタバコや禁煙エリアでの喫煙、ポイ捨てを発見した場合はご報告ください
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">📍 位置情報</h4>
          
          {locationLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>位置情報を取得中...</AlertDescription>
            </Alert>
          )}
          
          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}
          
          {location && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                位置情報を取得しました
                {location.accuracy && ` (精度: 約${Math.round(location.accuracy)}m)`}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetryLocation}
            disabled={locationLoading}
            className="w-full"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            位置情報を再取得
          </Button>
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">🚭 報告内容</h4>
          
          <div className="grid gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = selectedCategory === key;
              
              return (
                <Button
                  key={key}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto p-3 justify-start ${isSelected ? config.color : ''}`}
                  onClick={() => setSelectedCategory(key as ReportCategory)}
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

        {/* Submit Button */}
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
            disabled={!location || !selectedCategory || submitting || cooldownRemaining > 0}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : cooldownRemaining > 0 ? (
              `報告送信 (${cooldownRemaining}s)`
            ) : (
              '報告を送信'
            )}
          </Button>
          
          {!location && (
            <p className="text-xs text-muted-foreground text-center">
              位置情報の取得が必要です
            </p>
          )}
          
          {location && !selectedCategory && (
            <p className="text-xs text-muted-foreground text-center">
              報告内容を選択してください
            </p>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h5 className="text-xs font-medium mb-1">ご利用について</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 正確な情報の報告にご協力ください</li>
            <li>• 連続投稿防止のため、{COOLDOWN_SECONDS}秒間隔を設けています</li>
            <li>• 報告された情報は行政指導の資料として活用されます</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}