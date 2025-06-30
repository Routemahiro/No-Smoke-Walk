'use client';

import { useState } from 'react';
import { Download, Calendar, Filter, FileText, Table, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/supabase';

interface ExportFilters {
  category?: string;
  start_date?: string;
  end_date?: string;
  prefecture?: string;
  city?: string;
}

export function ExportPanel() {
  const [filters, setFilters] = useState<ExportFilters>({});
  const [csvLoading, setCsvLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Set default date range to last 30 days
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  };

  const handleFilterChange = (key: keyof ExportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    
    // Clear messages when filters change
    if (exportError) setExportError(null);
    if (exportSuccess) setExportSuccess(null);
  };

  const handleExportCSV = async () => {
    setCsvLoading(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const exportFilters = Object.keys(filters).length > 0 ? filters : getDefaultDates();
      await apiClient.exportCSV(exportFilters);
      setExportSuccess('CSVファイルのダウンロードが開始されました');
      
      // Clear success message after 3 seconds
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'CSVエクスポートに失敗しました');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExcelLoading(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const exportFilters = Object.keys(filters).length > 0 ? filters : getDefaultDates();
      await apiClient.exportExcel(exportFilters);
      setExportSuccess('Excelファイルのダウンロードが開始されました');
      
      // Clear success message after 3 seconds
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Excelエクスポートに失敗しました');
    } finally {
      setExcelLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setExportError(null);
    setExportSuccess(null);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'walk_smoke': return '歩きタバコ';
      case 'stand_smoke': return '立ち止まり喫煙';
      default: return 'すべて';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          データエクスポート
        </CardTitle>
        <CardDescription>
          報告データをCSVまたはExcelファイルでダウンロードします。
          フィルターを指定しない場合は過去30日間のデータが対象となります。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            フィルター設定
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <select
                id="category"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">すべてのカテゴリ</option>
                <option value="walk_smoke">歩きタバコ</option>
                <option value="stand_smoke">立ち止まり喫煙</option>
              </select>
            </div>

            {/* Prefecture Filter */}
            <div className="space-y-2">
              <Label htmlFor="prefecture">都道府県</Label>
              <Input
                id="prefecture"
                type="text"
                placeholder="例: 大阪府"
                value={filters.prefecture || ''}
                onChange={(e) => handleFilterChange('prefecture', e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">開始日</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">終了日</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            {/* City Filter */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="city">市区町村</Label>
              <Input
                id="city"
                type="text"
                placeholder="例: 大阪市北区"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {Object.keys(filters).length > 0 && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              フィルターをクリア
            </Button>
          )}
        </div>

        {/* Current Filter Summary */}
        {Object.keys(filters).length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="text-sm font-medium mb-2">現在のフィルター設定:</h5>
            <div className="text-xs space-y-1">
              {filters.category && (
                <div>カテゴリ: {getCategoryLabel(filters.category)}</div>
              )}
              {filters.start_date && (
                <div>開始日: {new Date(filters.start_date).toLocaleDateString('ja-JP')}</div>
              )}
              {filters.end_date && (
                <div>終了日: {new Date(filters.end_date).toLocaleDateString('ja-JP')}</div>
              )}
              {filters.prefecture && (
                <div>都道府県: {filters.prefecture}</div>
              )}
              {filters.city && (
                <div>市区町村: {filters.city}</div>
              )}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {exportError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}

        {exportSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{exportSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Export Buttons */}
        <div className="space-y-3">
          <h4 className="font-medium">ダウンロード形式を選択</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CSV Export */}
            <Button
              onClick={handleExportCSV}
              disabled={csvLoading || excelLoading}
              className="h-auto p-4 justify-start"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="bg-green-100 p-2 rounded-lg">
                  {csvLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium">CSV形式</div>
                  <div className="text-xs text-gray-600">
                    Excelやスプレッドシートで開けます
                  </div>
                </div>
              </div>
            </Button>

            {/* Excel Export */}
            <Button
              onClick={handleExportExcel}
              disabled={csvLoading || excelLoading}
              className="h-auto p-4 justify-start"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="bg-blue-100 p-2 rounded-lg">
                  {excelLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <Table className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium">Excel形式</div>
                  <div className="text-xs text-gray-600">
                    Microsoft Excelで直接開けます
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Usage Notes */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h5 className="text-xs font-medium mb-1">ご利用について</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• エクスポートされるデータには個人情報は含まれません</li>
            <li>• IPアドレスは匿名化処理されています</li>
            <li>• データは大阪府指導員の巡回資料としてご活用ください</li>
            <li>• 大量データの場合、ダウンロードに時間がかかる場合があります</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}