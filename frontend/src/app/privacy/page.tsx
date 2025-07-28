'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">プライバシーポリシー</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose max-w-none">
            <div className="mb-8">
              <p className="text-gray-600 mb-4">最終更新日：YYYY‑MM‑DD</p>
              <p className="text-gray-700 leading-relaxed">
                本プライバシーポリシー（以下「本ポリシー」）は、No‑Smoke Alert（以下「本サービス」）を運営する◯◯（以下「当運営」）が、本サービスの利用に際して取得する情報の取り扱い方針を定めるものです。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 1. 収集する情報</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              当運営は、本サービスにおいて以下の情報のみを取得します。
            </p>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(a) 位置情報（緯度・経度）</p>
              <p>(b) IPアドレス</p>
              <p>(c) 通報日時</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 2. 利用目的</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              取得した情報は、次の目的にのみ利用します。
            </p>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(1) 通報地点を地図上に表示するため</p>
              <p>(2) 通報データを統計化し、サービス改善に役立てるため</p>
              <p>(3) 行政・自治体へ提供する報告資料の作成のため</p>
            </div>
            <p className="mb-6 text-gray-700 leading-relaxed">
              これらの目的以外で利用することはありません。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 3. 第三者提供</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は、取得情報を行政・自治体に限り提供する場合があります。<br />
              法令に基づく開示要請を除き、その他の第三者へは提供いたしません。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 4. Cookie 及び Google Analytics</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>4‑1. 本サービスはアクセス解析のため Google Analytics（GA）を利用します。GA は Cookie を用いて利用者のサイト閲覧情報を匿名で収集します。</p>
              <p>4‑2. GA によるデータ収集を望まない場合、Google 提供の「Google Analytics オプトアウトブラウザアドオン」をインストールすることで無効化できます。</p>
              <p>4‑3. 将来的に広告配信を行う際は、広告 Cookie の使用およびオプトアウト方法を本サイト上で改めて告知します。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 5. 開示・削除請求</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              取得情報の開示・訂正・利用停止・削除等を希望される場合は、下記お問い合わせ窓口までご連絡ください。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 6. お問い合わせ</h2>
            <div className="mb-6 text-gray-700">
              <p className="mb-2">本ポリシーに関するご質問は、下記メールアドレスまでお問い合わせください。</p>
              <p className="font-mono text-blue-600">&lt;privacy@example.com&gt;</p>
              <p className="text-sm text-gray-500">（※仮アドレス）</p>
            </div>

            <div className="mt-12 pt-8 border-t text-center text-gray-500">
              <p>― 以上 ―</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 NO-SMOKE ALERT Osaka</p>
          </div>
        </div>
      </footer>
    </div>
  );
}