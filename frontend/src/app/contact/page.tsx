'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// TODO(マージ前に必須): くろだくんが作成した Google フォームの URL を入れる。
// 空のままだと「準備中」表示になり、壊れたリンクは出さない。
const CONTACT_FORM_URL = '';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="min-w-0 text-2xl font-bold leading-tight text-gray-900">No-Smoke Alert 運営者情報とお問い合わせ</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">最終更新日：2026-10-27</p>

            <h2 className="text-xl font-semibold mb-4">◆ 1. 運営者情報</h2>
            <ul className="mb-6 text-gray-700 space-y-1 list-disc pl-5">
              <li>サービス名：No-Smoke Alert（ノースモークアラート）</li>
              <li>URL：https://no-smoke-alert.com/</li>
              <li>運営者：no-smoke-alert 運営</li>
              <li>内容：大阪市内の歩きタバコ・迷惑喫煙の報告受付と、報告をもとにした参考地図・ヒートマップの表示</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">◆ 2. 非公式サービスであることについて</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              本サービスは個人有志が運営する非公式サービスであり、大阪市その他の行政機関が運営・委託・承認するものではありません。路上喫煙に関する行政への通報・相談は、各自治体の公式窓口をご利用ください。本サービスへの報告は、行政対応、巡回、指導、過料徴収等を保証するものではありません。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 3. お問い合わせ</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p className="leading-relaxed">
                本サービスに関するご質問、不具合のご連絡、報告データの削除・利用停止のご依頼、権利侵害の申し出は、以下のお問い合わせフォームで受け付けています。
              </p>
              {CONTACT_FORM_URL ? (
                <p>
                  <a
                    href={CONTACT_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white no-underline hover:bg-blue-700"
                  >
                    お問い合わせフォームを開く（Googleフォーム）
                  </a>
                </p>
              ) : (
                <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  お問い合わせフォームは現在準備中です。
                </p>
              )}
              <p className="leading-relaxed">
                報告データの削除をご希望の場合は、対象を特定するため、報告日時（おおよそ）、報告カテゴリ、概略位置、ご希望の理由をお書きください。アカウント登録のない仕組みのため、対象を特定できない場合は対応できないことがあります。
              </p>
              <p className="leading-relaxed">
                返信には数日いただく場合があります。お問い合わせ時にいただいたメールアドレス等は、返信のためにのみ利用します。個人や店舗・施設を特定・非難する内容、営業目的のご連絡にはお答えしないことがあります。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 4. 関連ページ</h2>
            <p className="mb-2 text-gray-700">
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">利用規約</Link>
              {' ／ '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
