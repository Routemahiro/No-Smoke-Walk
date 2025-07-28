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
            <div className="mb-8">
              <p className="text-gray-600 mb-4">最終更新日：YYYY‑MM‑DD</p>
              <p className="text-gray-700 leading-relaxed">
                この利用規約（以下「本規約」）は、No‑Smoke Alert（以下「本サービス」）を運営する◯◯（以下「当運営」）が提供するウェブサイト https://no-smoke-alert.com/（以下「本サイト」）の利用条件を定めるものです。本サイトを利用した時点で本規約に同意したものとみなします。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 1. はじめに</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              本サービスは、公共空間での歩きタバコ・路上喫煙行為（以下「喫煙行為」）を誰でも手軽に報告でき、その位置情報をマップ上で共有することを目的としたウェブプラットフォームです。本規約は本サイト上で提供されるすべての機能に適用されます。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 2. 提供内容</h2>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(1) 喫煙行為の報告フォーム（歩きタバコ／立ち止まり喫煙を選択）</p>
              <p>(2) 報告地点を可視化したヒートマップ／一覧表示</p>
              <p className="text-sm">※ 行政機関と直接データ連携する機能・法的措置の代行機能は現時点で提供していません。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 3. アカウント登録</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              本サービスは、投稿を含むすべての機能をアカウント登録なしで利用できます。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 4. 投稿ルール</h2>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>4‑1. 報告は事実に基づき、できる限り正確な位置を選択してください。</p>
              <p>4‑2. 個人を識別し得る情報（顔写真・車両ナンバー等）は投稿しないでください。</p>
              <p>4‑3. 同一事象の重複投稿や意図的な虚偽報告はご遠慮ください。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 5. 禁止事項</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              以下の行為を禁止します。違反が発覚した場合、当運営は予告なく投稿削除・アクセス制限等の措置を行うことがあります。
            </p>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(a) 虚偽または誤認を招く報告の投稿</p>
              <p>(b) 当サービスの運営を妨げる行為（スクリプト投稿、過度なリクエスト等）</p>
              <p>(c) 法令・公序良俗に反する行為</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 6. 知的財産</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>6‑1. 本サイト上のテキスト・ロゴ・UIデザインその他一切の著作物は当運営に帰属します。</p>
              <p>6‑2. ユーザーが投稿した位置データおよび関連メタ情報（以下「ユーザー投稿」）の著作権はユーザーに留保されますが、ユーザーは当運営に対し、<strong>本サービスの運営および改善目的に限り</strong>無償かつ非独占的に利用（複製・加工・内部共有等）する権利を許諾するものとします。</p>
              <p>6‑3. 当運営はユーザー投稿を第三者へ再配布・公開しません。ただし統計処理を行い、個人を特定できない形式に加工したデータを公開・共有する場合があります。</p>
              <p>6‑4. ユーザーは当運営の事前許可なく、本サイトに含まれる著作物を転載・再配布・改変してはなりません。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 7. 免責事項</h2>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>7‑1. 投稿内容の真実性について当運営は保証しません。</p>
              <p>7‑2. 本サービスの利用または利用不能から生じた損害について、当運営は一切責任を負いません。</p>
              <p>7‑3. システム障害・保守等によりサービス提供を中断・停止する場合があります。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 8. サービス変更・終了</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は事前の予告なく本サービスの内容を変更または提供を終了することがあります。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 9. 規約の改定</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は必要に応じて本規約を改定できます。改定後の規約は本サイト上で掲示した時点で効力を生じます。重要な変更を行う場合は、合理的な方法でユーザーへ周知します。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 10. お問い合わせ</h2>
            <div className="mb-6 text-gray-700">
              <p className="mb-2">ご不明点は以下のメールアドレスまでご連絡ください。</p>
              <p className="font-mono text-blue-600">&lt;info@example.com&gt;</p>
              <p className="text-sm text-gray-500">（※仮アドレス／正式運用時に差し替え予定）</p>
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