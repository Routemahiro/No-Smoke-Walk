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
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" height="80" viewBox="0 0 500 100" className="h-10 flex-shrink-0 sm:h-16">
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
              <div className="min-w-0">
                <p className="text-xs leading-tight text-gray-600 sm:text-sm">
                  大阪市の迷惑タバコ報告システム
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-6 rounded-lg border bg-white p-5 shadow-sm">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-medium text-blue-700">No-Smoke Alert</p>
            <h1 className="text-2xl font-bold tracking-normal text-gray-900 sm:text-3xl">
              大阪市の歩きタバコ・迷惑喫煙を見かけたら、その場で報告
            </h1>
            <p className="text-sm leading-6 text-gray-600 sm:text-base">
              ブラウザで現在地を取得し、歩きタバコまたは立ち止まり喫煙を選んで送信します。
              みなさまのご報告をもとに、どこを歩くとタバコを避けやすいかわかるマップも見られます。
            </p>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Report Form */}
          <div className="min-w-0 space-y-4">
            <ReportForm />
            
            {/* Navigation Links */}
            <div className="space-y-4">
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
                      <h2 className="font-medium text-gray-900">
                        ヒートマップを見る
                      </h2>
                      <p className="text-sm text-gray-600">
                        大阪市内の歩きタバコ・迷惑喫煙の報告傾向を参考地図で確認
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Information Panel */}
          <div className="min-w-0 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                No-Smoke Alertとは
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  大阪市内で歩きタバコや迷惑喫煙を見かけたときに、
                  ワンボタンで場所と状況を報告できるサービスです。
                </p>
                <p>
                  集まった報告はヒートマップとして可視化し、
                  タバコの煙を吸ってしまう可能性のあるエリアを把握する材料にさせていただいています。
                </p>
                <p>
                  本サービスは大阪市公式サービスではありません。
                  報告データはサイトご利用者の方の報告に基づく参考情報であり、行政による対応を保証するものではありません。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                報告対象
              </h2>
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
                    <p className="text-sm text-gray-600">適切な喫煙場所ではないと思われる場所で立ち止まって喫煙している人を見かけた場合</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                プライバシー保護
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 位置情報は報告、地図の表示、不正対策、集計のために利用します</p>
                <p>• 報告は個人の特定や晒しにつながらないよう、集計して扱います</p>
                <p>• 詳細はプライバシーポリシーをご確認ください</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                よくある確認
              </h2>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h3 className="font-medium text-gray-900">大阪市公式サービスですか？</h3>
                  <p>いいえ。No-Smoke Alertは大阪市の公式サービスではなく、行政機関との公式な連携を示すものでもありません。</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">報告は違反の証明になりますか？</h3>
                  <p>報告データはみなさまのご報告に基づく参考情報です。実際の違反事実や行政対応を保証するものではありません。</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">集まった報告はどう使いますか？</h3>
                  <p>迷惑な喫煙のご報告が集まっている可能性のあるエリアを把握するために集計して扱います。</p>
                </div>
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
