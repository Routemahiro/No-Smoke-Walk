'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">利用規約</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">第1条（目的）</h2>
            <p className="mb-6 text-gray-700">
              本規約は、NO-SMOKE ALERT Osaka（以下「本サービス」）の利用条件を定めるものです。
              ユーザーは本規約に同意の上、本サービスをご利用ください。
            </p>

            <h2 className="text-xl font-semibold mb-4">第2条（サービス内容）</h2>
            <p className="mb-4 text-gray-700">
              本サービスは、大阪府内における迷惑タバコの報告及び情報共有を目的としたWebアプリケーションです。
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>歩きタバコの報告機能</li>
              <li>立ち止まり喫煙の報告機能</li>
              <li>報告データのヒートマップ表示</li>
              <li>その他関連する機能</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">第3条（利用規則）</h2>
            <p className="mb-4 text-gray-700">
              ユーザーは以下の行為を行ってはなりません：
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>虚偽の情報を報告すること</li>
              <li>他者の迷惑となる行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>その他法令に違反する行為</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">第4条（免責事項）</h2>
            <p className="mb-6 text-gray-700">
              本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
              また、本サービスの継続性や正確性について保証するものではありません。
            </p>

            <h2 className="text-xl font-semibold mb-4">第5条（規約の変更）</h2>
            <p className="mb-6 text-gray-700">
              運営者は、必要に応じて本規約を変更することがあります。
              変更後の規約は、本サービス上で告知された時点から効力を生じます。
            </p>

            <div className="mt-12 pt-8 border-t text-center text-gray-500">
              <p>制定日：2025年1月1日</p>
              <p>最終更新：2025年1月1日</p>
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