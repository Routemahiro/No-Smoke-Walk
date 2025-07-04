import { ReportForm } from '@/components/ReportForm';
import { DebugStatus } from '@/components/DebugStatus';
import Link from 'next/link';
import { Map } from 'lucide-react';

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
            <div className="text-sm text-gray-500">
              v1.2.0
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
                  大阪府内で迷惑タバコを発見した際に、
                  府民の皆様から情報を収集し、行政指導の効率化を図るシステムです。
                </p>
                <p>
                  報告いただいた情報は匿名化処理され、
                  大阪府指導員の巡回ルート最適化に活用されます。
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
                <p>• 位置情報は報告処理のためのみ使用され、精度は約200m以内です</p>
                <p>• IPアドレスはハッシュ化され、個人の特定はできません</p>
                <p>• 報告データは365日後に自動削除されます</p>
                <p>• 公開される統計情報には個人情報は含まれません</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 NO-SMOKE ALERT Osaka. 大阪府路上喫煙対策の一環として運営されています。</p>
          </div>
        </div>
      </footer>
      
      <DebugStatus />
    </div>
  );
}
