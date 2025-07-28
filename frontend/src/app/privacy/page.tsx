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
            <h2 className="text-xl font-semibold mb-4">1. 個人情報の取得について</h2>
            <p className="mb-6 text-gray-700">
              当サービスでは、サービス提供のために以下の情報を取得する場合があります：
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>位置情報（報告時の緯度・経度）</li>
              <li>IPアドレス（ハッシュ化して保存）</li>
              <li>ブラウザ情報（重複投稿防止のため）</li>
              <li>アクセス解析データ（Google Analytics）</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">2. 個人情報の利用目的</h2>
            <p className="mb-4 text-gray-700">
              取得した個人情報は以下の目的で利用します：
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>迷惑タバコの報告データとしての集計・分析</li>
              <li>重複投稿や不正利用の防止</li>
              <li>サービスの改善・運営</li>
              <li>法令に基づく対応</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. 個人情報の管理</h2>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>IPアドレスはSHA-256でハッシュ化され、個人の特定はできません</li>
              <li>位置情報は報告データとしてのみ使用され、個人との紐付けは行いません</li>
              <li>適切なセキュリティ対策を講じて情報を保護します</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">4. 第三者への提供</h2>
            <p className="mb-6 text-gray-700">
              個人情報は、法令に基づく場合を除き、第三者に提供することはありません。
              ただし、統計的に処理された匿名データについては、行政機関等に提供する場合があります。
            </p>

            <h2 className="text-xl font-semibold mb-4">5. Google Analyticsの利用</h2>
            <p className="mb-6 text-gray-700">
              当サービスでは、Googleが提供するアクセス解析ツール「Google Analytics」を使用しています。
              Google Analyticsはクッキーを使用してユーザーの行動を分析しますが、
              個人を特定する情報は含まれません。
            </p>

            <h2 className="text-xl font-semibold mb-4">6. クッキーについて</h2>
            <p className="mb-6 text-gray-700">
              当サービスでは、サービス向上のためクッキーを使用する場合があります。
              ブラウザの設定により、クッキーの受け取りを拒否することが可能です。
            </p>

            <h2 className="text-xl font-semibold mb-4">7. プライバシーポリシーの変更</h2>
            <p className="mb-6 text-gray-700">
              当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。
              変更後のプライバシーポリシーは、本サービス上で告知された時点から効力を生じます。
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