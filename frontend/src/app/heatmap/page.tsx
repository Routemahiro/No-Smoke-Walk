import { HeatmapView } from '@/components/HeatmapView';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
                  大阪市内の喫煙・ポイ捨て報告データの可視化
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              No-Smoke Walk Osaka
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeatmapView />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 No-Smoke Walk Osaka. 大阪市路上喫煙対策の一環として運営されています。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}