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
              <h1 className="min-w-0 text-2xl font-bold leading-tight text-gray-900">No-Smoke Alert プライバシーポリシー</h1>
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
                本プライバシーポリシー（以下「本ポリシー」）は、No-Smoke Alert（以下「本サービス」）を運営する本サービス運営者（以下「当運営」）が、本サービスの提供にあたり取得または利用する情報の取扱い方針を定めるものです。
              </p>
              <p className="mt-3 text-gray-700 leading-relaxed">
                本サービスは、大阪市内の歩きタバコ・迷惑喫煙の報告と参考地図表示を目的とした非公式サービスであり、大阪市その他の行政機関が運営する公式サービスではありません。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 1. 取得する情報</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              当運営は、本サービスの利用状況に応じて、以下の情報を取得または利用します。氏名、メールアドレス、電話番号、住所、アカウント情報の入力は現時点で求めていません。
            </p>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                (a) 報告データ：緯度・経度、報告カテゴリ（歩きタバコ、立ち止まり喫煙等）、報告日時、座標から推定した都道府県・市区町村、信頼度スコア等の管理用情報。
              </p>
              <p>
                (b) 位置情報：ブラウザの位置情報機能により取得される現在地、位置精度、取得時刻。位置情報は、ユーザーがブラウザ上で許可した場合、または位置情報取得ボタンを操作した場合に取得します。
              </p>
              <p>
                (c) 不正対策情報：IPアドレスをハッシュ化した値、ユーザーエージェント等から生成したハッシュ値、投稿回数、投稿時間帯等。原則として、投稿制限や重複・不正投稿の抑制のために利用します。
              </p>
              <p>
                (d) 端末・ブラウザ情報：ユーザーエージェント、言語、タイムゾーン、画面解像度を丸めた値、Cookie利用可否等から生成される最小化されたブラウザ指紋ハッシュ。現時点では主にブラウザ内の投稿制限に利用します。
              </p>
              <p>
                (e) アクセス解析情報：ページURL、ページタイトル、閲覧・操作イベント、報告カテゴリ、地図操作、報告時の概略位置ラベル等。Google Analytics 4を通じて取得される場合があります。
              </p>
              <p>
                (f) 外部サービスが取得する可能性のある情報：広告配信、地図タイル配信、アクセス解析、ホスティング、データ保存のために、各外部サービスがCookie、IPアドレス、リファラー、ブラウザ情報、リクエスト情報等を取得する場合があります。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 2. ブラウザ内に保存される情報</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                本サービスは、使いやすさと連続投稿防止のため、ユーザーのブラウザのlocalStorageに情報を保存します。主な保存内容は、位置情報自動取得のオン・オフ、前回取得した位置情報、位置情報許可済みの目印、10分間の投稿回数管理情報です。
              </p>
              <p>
                前回取得した位置情報は、古くなった場合や日本国外の座標と判断された場合にブラウザ側で削除されます。localStorageの情報は、ユーザーがブラウザ設定から削除できます。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 3. 利用目的</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              取得した情報は、以下の目的で利用します。
            </p>
            <div className="mb-6 text-gray-700 space-y-2">
              <p>(1) 報告の受付、保存、集計、ヒートマップ表示のため</p>
              <p>(2) 大阪市内の歩きタバコ・迷惑喫煙に関する市民報告の傾向を把握するため</p>
              <p>(3) 重複投稿、虚偽投稿、機械的な投稿、過度なリクエスト等を検知・抑制するため</p>
              <p>(4) 本サービスの表示、機能、導線、性能、信頼性を改善するため</p>
              <p>(5) 問い合わせ、削除依頼、権利侵害の申し出等に対応するため</p>
              <p>(6) 集計・要約した参考資料を作成し、大阪市等への共有を検討するため</p>
            </div>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は、報告データを個人攻撃、晒し、違反者の特定、行政処分の保証、広告目的の個人追跡のために利用することを目的としていません。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 4. 位置情報の取扱い</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                位置情報は、報告地点の記録および周辺の報告傾向表示のために利用します。報告送信時には、現在地の緯度・経度および報告カテゴリがAPIへ送信されます。
              </p>
              <p>
                ヒートマップでは、個別の報告地点をそのまま公開するのではなく、一定期間内の報告を集計・丸め・抑制した参考情報として表示することを基本方針とします。ただし、実装上の表示粒度や抑制条件は改善中であり、識別リスクがあると判断したデータは表示や外部共有から除外する場合があります。
              </p>
              <p>
                位置情報の自動取得を有効にした場合、ブラウザの許可状態に応じて一定間隔で現在地を更新します。自動取得はユーザーが画面上で切り替えできます。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 5. アクセス解析</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                本サービスは、利用状況の把握と改善のためにGoogle Analytics 4を利用します。Google AnalyticsはCookie等を用いて閲覧情報やイベント情報を処理する場合があります。
              </p>
              <p>
                現在の実装では、報告送信イベント、報告カテゴリ、地図操作、フィルター操作に加え、報告時の緯度・経度を小数第3位程度に丸めた概略位置ラベルがGoogle Analyticsのイベントとして送信される場合があります。これはサービス改善のための集計用途であり、個人の移動履歴を追跡する目的ではありません。
              </p>
              <p>
                Google Analyticsによるデータ収集を望まない場合は、ブラウザ設定、拡張機能、またはGoogleが提供する
                <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Google Analytics オプトアウト アドオン</a>
                等をご利用ください。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 6. 広告・外部スクリプト</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                本サービスでは、Ninja広告関連サービスのスクリプトを読み込み、広告を表示する場合があります。広告配信事業者やその提携先は、Cookie、広告用ID、リクエスト情報、ブラウザ情報等を取得・利用する場合があります。
              </p>
              <p>
                また、地図表示のためにOpenStreetMapのタイルサーバー等へリクエストが送信される場合があります。外部サービスにおける情報の取扱いは、各提供者の規約・プライバシーポリシーに従います。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 7. 第三者提供・外部共有</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                当運営は、法令に基づく場合、ユーザーまたは第三者の権利・安全を守るために必要な場合、サービス運営に必要な委託先・外部サービスを利用する場合を除き、個人を直接識別する情報を第三者に提供しません。
              </p>
              <p>
                大阪市等へ共有を検討する場合は、原則として、対象期間、対象エリア、件数、カテゴリ内訳、傾向、注意書きを含む集計・要約資料として扱います。個別報告の生座標、個別時刻、低件数クラスター、未確認の自由記述、個人や店舗・施設の特定につながる情報をそのまま外部公開または提出することは意図していません。
              </p>
              <p>
                共有した資料が行政対応、巡回、啓発、指導、過料徴収等につながることを保証するものではありません。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 8. 保存期間と削除</h2>
            <div className="mb-6 text-gray-700 space-y-3">
              <p>
                報告データは、本サービスの運営、集計、不正対策、傾向分析、問い合わせ対応に必要な期間保存します。具体的な保存期間は、サービスの運用状況、データ量、行政共有の必要性、識別リスク等を踏まえて見直します。
              </p>
              <p>
                不要になった情報、誤報・虚偽報告・識別リスクが高いと判断した情報、削除依頼に合理的な理由がある情報については、可能な範囲で削除、非表示、集計対象外化、または匿名性を高める加工を行います。
              </p>
              <p>
                Cloudflare、Supabase、Google Analytics、広告配信事業者等の外部サービスに保存されるログや解析情報の保存期間・削除方法は、各サービスの仕様や設定に従います。
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">◆ 9. 開示・削除等の依頼</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              報告データの確認、削除、利用停止等を希望する場合は、本サイト上で別途表示する連絡先または当運営が案内する問い合わせ導線からご連絡ください。アカウント登録を行わない仕組みのため、対象データの特定には、報告日時、報告カテゴリ、概略位置、削除を希望する理由などの情報が必要になる場合があります。本人確認や対象特定が困難な場合、対応できないことがあります。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 10. 安全管理</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は、取得情報について、アクセス制限、ハッシュ化、集計・丸め処理、低件数データの抑制、不要情報の削除等、運営規模に応じた安全管理に努めます。ただし、インターネット上の通信や外部サービスを利用する性質上、完全な安全性を保証するものではありません。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 11. 本ポリシーの変更</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              当運営は、法令、サービス内容、外部サービス、運営体制の変更等に応じて本ポリシーを改定することがあります。重要な変更を行う場合は、可能な範囲で本サイト上に掲示します。
            </p>

            <h2 className="text-xl font-semibold mb-4">◆ 12. お問い合わせ</h2>
            <div className="mb-6 text-gray-700">
              <p className="mb-2">
                本ポリシーに関するお問い合わせは、本サイト上で別途表示する連絡先または当運営が案内する問い合わせ導線からご連絡ください。
              </p>
              <p className="text-sm text-gray-500">
                連絡先の正式表示前であっても、未確認の個人名や仮メールアドレスを問い合わせ先として表示しません。
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
