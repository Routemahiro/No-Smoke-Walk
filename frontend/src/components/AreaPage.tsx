import Link from 'next/link';
import { AREAS, AreaConfig, JR_CENTRAL_SMOKING_ROOM_URL, OSAKA_RULE_URL, OSAKA_SPOTS_URL, SPOTS_CHECKED } from '@/lib/areas';
import { AreaReportMap } from '@/components/AreaReportMap';

export function AreaPage({ area }: { area: AreaConfig }) {
  const others = AREAS.filter(a => a.slug !== area.slug);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/" className="text-sm font-bold text-[#0F2346]">NO-SMOKE ALERT Osaka</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="space-y-3 rounded-lg border bg-white p-5">
          <h1 className="text-2xl font-bold text-gray-900">{area.h1}</h1>
          <p className="text-sm leading-6 text-gray-700">{area.intro}</p>
          <Link href="/?quick=1&src=area" className="block rounded-xl bg-rose-500 px-4 py-4 text-center text-lg font-bold text-white shadow-md">
            歩きタバコを見かけたら、すぐ報告
          </Link>
        </section>

        <section className="space-y-3 rounded-lg border bg-white p-5">
          <h2 className="text-lg font-bold">{area.name}周辺の報告マップ</h2>
          <AreaReportMap center={area.center} radiusM={area.radiusM} />
        </section>

        <section className="space-y-3 rounded-lg border bg-white p-5">
          <h2 className="text-lg font-bold">大阪市のルール</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-gray-700">
            <li>2025年1月27日から、大阪市内全域で路上喫煙が禁止されています（市が管理する道路・広場・公園など）。</li>
            <li>違反すると1,000円の過料の対象になります。</li>
            <li>紙巻たばこだけでなく、加熱式たばこも対象です。</li>
          </ul>
          <p className="text-xs text-gray-500">
            出典：大阪市「<a className="underline" href={OSAKA_RULE_URL} target="_blank" rel="noopener noreferrer">路上喫煙を禁止する区域を大阪市内全域に拡大しました</a>」（2026年10月13日確認）
          </p>
        </section>

        <section className="space-y-3 rounded-lg border bg-white p-5">
          <h2 className="text-lg font-bold">{area.name}の喫煙所</h2>
          <p className="text-sm leading-6 text-gray-700">
            大阪市の掲載情報をもとに数えると、{area.name}の中心から半径1km以内に「大阪市指定喫煙所」が約{area.spotCount}か所あります。たとえば{area.spotExamples.join('、')}などです。
          </p>
          <p className="text-sm leading-6 text-gray-700">
            場所・利用時間は変わることがあります。最新の一覧と地図は大阪市のページで確認してください。
          </p>
          <a href={area.cityListUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-700">
            大阪市の喫煙所一覧を見る
          </a>
          <p className="text-xs text-gray-500">
            出典：大阪市「<a className="underline" href={OSAKA_SPOTS_URL} target="_blank" rel="noopener noreferrer">大阪市内の喫煙可能な場所について</a>」（{SPOTS_CHECKED}）。件数は同ページの地図座標から当サイトが数えたものです。
          </p>
        </section>

        {area.extra && (
          <section className="space-y-2 rounded-lg border bg-white p-5">
            <h2 className="text-lg font-bold">{area.extra.heading}</h2>
            {area.extra.body.map(t => (
              <p key={t} className="text-sm leading-6 text-gray-700">{t}</p>
            ))}
            <p className="text-xs text-gray-500">
              出典：JR東海「<a className="underline" href={JR_CENTRAL_SMOKING_ROOM_URL} target="_blank" rel="noopener noreferrer">東海道新幹線 車内喫煙ルームの廃止日について</a>」
            </p>
          </section>
        )}

        <nav className="space-y-2 rounded-lg border bg-white p-5 text-sm">
          <h2 className="text-base font-bold">ほかのエリア</h2>
          <ul className="space-y-1">
            {others.map(o => (
              <li key={o.slug}><Link className="text-blue-700 underline" href={`/area/${o.slug}/`}>{o.h1}</Link></li>
            ))}
            <li><Link className="text-blue-700 underline" href="/heatmap/">大阪市全体のヒートマップ</Link></li>
            <li><Link className="text-blue-700 underline" href="/">トップページ</Link></li>
          </ul>
        </nav>
        <p className="text-xs text-gray-500">本サービスは大阪市の公式サービスではありません。</p>
      </main>
    </div>
  );
}
