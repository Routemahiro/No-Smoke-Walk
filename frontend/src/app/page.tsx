'use client';

import dynamic from 'next/dynamic';
// import { DebugStatus } from '@/components/DebugStatus';
import Link from 'next/link';
import { Map } from 'lucide-react';
import { NinjaAd } from '@/components/NinjaAd';

// Dynamically import ReportForm to avoid SSR issues
const ReportForm = dynamic(() => import('@/components/ReportForm').then(mod => ({ default: mod.ReportForm })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">フォームを読み込み中...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" height="80" viewBox="0 0 500 100" className="h-16">
                <rect x="2" y="2" width="496" height="96" fill="none" stroke="#0F2346" strokeWidth="4" rx="8" />
                <text
                  x="250"
                  y="55"
                  fill="#0F2346"
                  fontFamily="Inter, Noto Sans JP, sans-serif"
                  fontSize="40"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  textLength="460"
                  lengthAdjust="spacingAndGlyphs"
                >
                  NO-SMOKE ALERT Osaka
                </text>
              </svg>
              <div>
                <p className="text-sm text-gray-600">
                  大阪府の迷惑タバコ報告システム
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Report Form */}
          <div className="space-y-4">
            <ReportForm />
            
            {/* Heatmap Link */}
            <Link 
              href="/heatmap"
              className="block w-full max-w-md mx-auto"
            >
              <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Map className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      ヒートマップを見る
                    </h3>
                    <p className="text-sm text-gray-600">
                      報告データの分布状況を地図上で確認
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                このサービスについて
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  大阪府内で迷惑タバコを発見した皆様から情報をお送りいただき、
                  行政指導の効率化を図るシステムです。
                </p>
                <p>
                  報告いただいた情報は匿名情報として保存し、
                  大阪府指導員の巡回ルート最適化に活用するようにしてもらいます。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">
                報告対象
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">歩きタバコ</h4>
                    <p className="text-sm text-gray-600">歩きながら喫煙している人を発見した場合</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">立ち止まり喫煙</h4>
                    <p className="text-sm text-gray-600">禁煙エリアで立ち止まって喫煙している人を発見した場合</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">
                プライバシー保護
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 位置情報は報告処理にのみ使用されます</p>
                <p>• IPアドレスはハッシュ化され、個人の特定はできません</p>
                <p>• 公開される情報には個人情報は含まれません</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ninja Ad - placed outside the grid layout */}
        <div className="mt-12 flex justify-center">
          <NinjaAd adId="ninja-ad-1" className="max-w-lg" />
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
      
      {/* <DebugStatus /> */}
    </div>
  );
}
