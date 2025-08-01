'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NinjaAd } from '@/components/NinjaAd';

// Dynamically import HeatmapView to avoid SSR issues
const HeatmapView = dynamic(() => import('@/components/HeatmapView').then(mod => ({ default: mod.HeatmapView })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">ヒートマップを読み込み中...</p>
      </div>
    </div>
  )
});

export default function HeatmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                ホームに戻る
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🗺️ ヒートマップ表示
                </h1>
                <p className="text-sm text-gray-600">
                  大阪府内の迷惑タバコ報告データの可視化
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <HeatmapView />
        
        {/* Ad placement at bottom of heatmap */}
        <div className="flex justify-center">
          <NinjaAd adId="ninja-ad-heatmap" className="max-w-lg" />
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 space-y-2">
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/terms" className="hover:text-gray-700 underline">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-gray-700 underline">
                プライバシーポリシー
              </Link>
            </div>
            <p>© 2025 NO-SMOKE ALERT Osaka</p>
            <p>地図データ: © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline">OpenStreetMap</a> contributors</p>
          </div>
        </div>
      </footer>
    </div>
  );
}