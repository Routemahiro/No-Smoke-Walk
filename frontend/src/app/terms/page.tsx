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
              <h1 className="min-w-0 text-2xl font-bold leading-tight text-gray-900">No-Smoke Alert 利用規約</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose max-w-none">
            <div className="mb-8">
              <p className="text-gray-600 mb-4">最終更新日：2026-06-04</p>
              <p className="text-gray-700 leading-relaxed">
                この利用規約（以下「本規約」）は、No-Smoke Alert（以下「本サービス」）を運営する本サービス運営者（以下「当運営」）が提供するウェブサイト https://no-smoke-alert.com/（以下「本サイト」）の利用条件を定めるものです。本サイトを利用した方（以下「ユーザー」）は、本規約に同意したものとみなします。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 1. 本サービスの位置づけ</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                本サービスは、大阪市内の歩きタバコおよび適切な喫煙場所ではない公共空間での立ち止まり喫煙について、市民からの報告を集め、報告が集まっている可能性のあるエリアを地図で可視化するための参考情報サービスです。
              </p>
              <p>
                本サービスは大阪市その他の行政機関が運営する公式サービスではなく、行政機関との公式な連携や行政対応を保証するものではありません。報告データは行政観察データ、違反事実の証明、完全な統計調査ではありません。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 2. 提供内容</h2>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(1) 歩きタバコまたは立ち止まり喫煙の報告フォーム</p>
              <p>(2) 報告データを集計・加工したヒートマップ表示</p>
              <p>(3) 本サービスの改善、不正投稿防止、アクセス解析のための機能</p>
              <p>(4) 一定件数が集まった場合に、重点巡回・啓発候補エリア等として整理するための内部分析</p>
              <p className="text-sm text-gray-600">
                ※ 現時点で、行政機関への自動提出、法的措置の代行、違反者の特定、行政処分の請求を行う機能は提供していません。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 3. アカウント登録</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              本サービスは、アカウント登録なしで利用できます。メールアドレス、氏名、住所、電話番号の入力は求めていません。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 4. 報告ルール</h2>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>4-1. 報告は、ユーザーが実際に見かけた状況に基づき、可能な範囲で現在地に近い位置から行ってください。</p>
              <p>4-2. 報告カテゴリは、ユーザーが状況を伝えるための分類であり、法令違反の断定を求めるものではありません。</p>
              <p>4-3. 顔写真、氏名、車両ナンバー、勤務先、学校名、店舗・施設への攻撃的な記述など、個人や特定の施設の識別・晒しにつながる情報を投稿、送信、共有しないでください。</p>
              <p>4-4. 同一事象の過度な重複投稿、意図的な虚偽報告、報復・嫌がらせを目的とした利用は行わないでください。</p>
              <p>4-5. 危険な接近、撮影、追跡、口論など、ユーザー自身または第三者の安全を損なう行為を行わないでください。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 5. 禁止事項</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              以下の行為を禁止します。違反が確認された場合、当運営は報告の除外、表示抑制、アクセス制限その他必要な措置を行うことがあります。
            </p>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(a) 虚偽または誤認を招く報告の投稿</p>
              <p>(b) 個人、店舗、施設、団体等への攻撃、晒し、差別、脅迫、名誉毀損につながる行為</p>
              <p>(c) スクリプト投稿、過度なリクエスト、リバースエンジニアリングなど本サービスの運営を妨げる行為</p>
              <p>(d) 本サービスの地図、集計、報告データを用いて特定個人や特定施設を推測・追跡しようとする行為</p>
              <p>(e) 法令または公序良俗に反する行為</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 6. 報告データの取扱い</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                当運営は、ユーザーから送信された位置情報、報告カテゴリ、報告日時、推定地域情報、不正対策に必要なハッシュ化情報等を、本サービスの運営、集計、表示、品質改善、不正投稿防止、問い合わせ対応のために利用します。詳細は<Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</Link>をご確認ください。
              </p>
              <p>
                ヒートマップや外部向け資料では、個人や店舗・施設の特定につながらないよう、報告データを集計、丸め、抑制、要約する場合があります。低件数または識別リスクのあるデータは、表示や共有の対象から除外することがあります。
              </p>
              <p>
                当運営は、報告データを大阪市等へ共有することを検討する場合がありますが、その場合も原則として集計・要約した参考資料として扱い、行政対応、巡回、啓発、指導、過料徴収等の実施を保証しません。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 7. 外部サービス</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              本サービスでは、配信基盤、データ保存、アクセス解析、広告配信、地図表示等のために、Cloudflare、Supabase、Google Analytics、Ninja広告関連サービス、OpenStreetMapタイルサーバー等の外部サービスを利用する場合があります。これらの外部サービスの利用条件および情報の取扱いは、各提供者の規約・プライバシーポリシーにも従います。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 8. 知的財産</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>8-1. 本サイト上のテキスト、ロゴ、UIデザイン、プログラムその他の著作物に関する権利は、当運営または正当な権利者に帰属します。</p>
              <p>8-2. ユーザーが送信した報告データについて、ユーザーは当運営に対し、本サービスの運営、改善、集計、分析、表示、行政・第三者への集計資料共有のために必要な範囲で、無償かつ非独占的に利用する権利を許諾するものとします。</p>
              <p>8-3. ユーザーは、当運営の事前許可なく、本サイトに含まれる著作物を転載、再配布、改変してはなりません。ただし、法令上認められる引用等はこの限りではありません。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 9. 免責事項</h2>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>9-1. 当運営は、報告内容、位置情報、ヒートマップ、集計結果の正確性、完全性、最新性、有用性を保証しません。</p>
              <p>9-2. 本サービスの表示は市民報告に基づく参考情報であり、実際の喫煙行為の発生、法令違反、危険性、行政対応の必要性を断定するものではありません。</p>
              <p>9-3. 当運営は、ユーザーによる本サービスの利用、利用不能、報告内容の誤り、第三者とのトラブルから生じた損害について、法令上免責が認められない場合を除き、責任を負いません。</p>
              <p>9-4. システム障害、保守、外部サービスの停止、仕様変更等により、本サービスの全部または一部を中断・停止する場合があります。</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 10. サービス変更・終了</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は、必要に応じて本サービスの内容を変更し、または提供を終了することがあります。重要な変更を行う場合は、可能な範囲で本サイト上に掲示します。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 11. 規約の改定</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は、法令、サービス内容、運営体制の変更等に応じて本規約を改定することがあります。改定後の規約は、本サイト上で掲示した時点から適用されます。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 12. 準拠法・管轄</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              本規約は日本法に準拠します。本サービスに関して紛争が生じた場合は、当事者間で誠実に協議し、解決を目指します。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 13. お問い合わせ</h2>
            <div className="mb-6 text-gray-700">
              <p className="mb-2">
                本規約または本サービスに関するお問い合わせは、本サイト上で別途表示する連絡先または当運営が案内する問い合わせ導線からご連絡ください。
              </p>
              <p className="text-sm text-gray-500">
                連絡先の正式表示前であっても、当運営者名や未確認のメールアドレスを装った問い合わせ先は使用しません。
              </p>
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
