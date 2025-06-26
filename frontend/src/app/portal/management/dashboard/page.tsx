'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  Download, 
  LogOut, 
  Shield, 
  TrendingUp,
  MapPin,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/supabase';
import { ExportPanel } from '@/components/ExportPanel';

interface DashboardStats {
  total_reports: number;
  category_breakdown: Record<string, number>;
  top_locations: Array<{
    prefecture: string;
    city: string;
    count: number;
  }>;
  period_days: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, adminUser, isAdmin, loading, initialized, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (initialized && (!user || !isAdmin)) {
      router.push('/portal/management');
    }
  }, [initialized, user, isAdmin, router]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const response = await apiClient.getHeatmapStats();
        
        if (response.success) {
          setStats(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch statistics');
        }
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : 'Failed to fetch statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    if (initialized && user && isAdmin) {
      fetchStats();
    }
  }, [initialized, user, isAdmin]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/portal/management');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'walk_smoke': return '歩きタバコ';
      case 'stand_smoke': return '立ち止まり喫煙';
      case 'litter': return 'ポイ捨て';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'walk_smoke': return 'bg-red-500';
      case 'stand_smoke': return 'bg-orange-500';
      case 'litter': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    管理者ダッシュボード
                  </h1>
                  <p className="text-sm text-gray-600">
                    ようこそ、{adminUser?.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/heatmap">
                <Button variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  ヒートマップ
                </Button>
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          {statsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statsError}</AlertDescription>
            </Alert>
          )}

          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">総報告数</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total_reports}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">最多カテゴリ</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Object.entries(stats.category_breakdown).length > 0 ? 
                            getCategoryLabel(Object.entries(stats.category_breakdown).sort(([,a], [,b]) => b - a)[0][0]) : 
                            'データなし'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">ホットスポット</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.top_locations.length > 0 ? stats.top_locations[0].city : 'データなし'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">期間</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.period_days}日間</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>カテゴリ別報告数</CardTitle>
                    <CardDescription>
                      過去{stats.period_days}日間の報告分類
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.category_breakdown).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}></div>
                            <span className="font-medium">{getCategoryLabel(category)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded-full h-2 w-24">
                              <div 
                                className={`h-2 rounded-full ${getCategoryColor(category)}`}
                                style={{ 
                                  width: `${Math.max((count / stats.total_reports) * 100, 5)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900 w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Locations */}
                <Card>
                  <CardHeader>
                    <CardTitle>報告件数上位地域</CardTitle>
                    <CardDescription>
                      重点的な指導が必要な地域
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.top_locations.map((location, index) => (
                        <div key={`${location.prefecture}-${location.city}`} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                              {index + 1}
                            </div>
                            <span className="font-medium">{location.city}</span>
                          </div>
                          <span className="font-bold text-gray-900">{location.count}件</span>
                        </div>
                      ))}
                      {stats.top_locations.length === 0 && (
                        <p className="text-gray-500 text-center py-4">データがありません</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Panel */}
              <ExportPanel />

              {/* Quick Action Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    クイックアクション
                  </CardTitle>
                  <CardDescription>
                    よく使う機能への素早いアクセス
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link href="/heatmap">
                      <Button className="w-full" variant="outline">
                        <MapPin className="h-4 w-4 mr-2" />
                        ヒートマップを開く
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      統計を更新
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}