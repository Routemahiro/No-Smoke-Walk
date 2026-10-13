import Link from 'next/link';
import { AREAS, AreaConfig, JR_CENTRAL_SMOKING_ROOM_URL, OSAKA_RULE_URL, OSAKA_SPOTS_URL, SPOTS_CHECKED } from '@/lib/areas';
import { AreaReportMap } from '@/components/AreaReportMap';
import { ds, Panel, PrimaryLink } from '@/components/ds';

export function AreaPage({ area }: { area: AreaConfig }) {
  const others = AREAS.filter(a => a.slug !== area.slug);
  return (
    <div className={ds.pageBg}>
      <header className={ds.header}>
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/" className={`text-sm font-bold ${ds.brandText}`}>NO-SMOKE ALERT Osaka</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Panel className="space-y-3">
          <h1 className={ds.h1}>{area.h1}</h1>
          <p className={ds.body}>{area.intro}</p>
          <PrimaryLink href="/?quick=1&src=area" className="py-4 text-lg">
            歩きタバコを見かけたら、すぐ報告
          </PrimaryLink>
        </Panel>

        <Panel className="space-y-3">
          <h2 className={ds.h2}>{area.name}周辺の報告マップ</h2>
          <AreaReportMap center={area.center} radiusM={area.radiusM} />
        </Panel>

        <Panel className="space-y-3">
          <h2 className={ds.h2}>大阪市のルール</h2>
          <ul className={`list-disc space-y-1 pl-5 ${ds.body}`}>
            <li>2025年1月27日から、大阪市内全域で路上喫煙が禁止されています（市が管理する道路・広場・公園など）。</li>
            <li>違反すると1,000円の過料の対象になります。</li>
            <li>紙巻たばこだけでなく、加熱式たばこも対象です。</li>
          </ul>
          <p className={ds.small}>
            出典：大阪市「<a className="underline" href={OSAKA_RULE_URL} target="_blank" rel="noopener noreferrer">路上喫煙を禁止する区域を大阪市内全域に拡大しました</a>」（2026年10月13日確認）
          </p>
        </Panel>

        <Panel className="space-y-3">
          <h2 className={ds.h2}>{area.name}の喫煙所</h2>
          <p className={ds.body}>
            大阪市の掲載情報をもとに数えると、{area.name}の中心から半径1km以内に「大阪市指定喫煙所」が約{area.spotCount}か所あります。たとえば{area.spotExamples.join('、')}などです。
          </p>
          <p className={ds.body}>
            場所・利用時間は変わることがあります。最新の一覧と地図は大阪市のページで確認してください。
          </p>
          <a href={area.cityListUrl} target="_blank" rel="noopener noreferrer" className={ds.secondary}>
            大阪市の喫煙所一覧を見る
          </a>
          <p className={ds.small}>
            出典：大阪市「<a className="underline" href={OSAKA_SPOTS_URL} target="_blank" rel="noopener noreferrer">大阪市内の喫煙可能な場所について</a>」（{SPOTS_CHECKED}）。件数は同ページの地図座標から当サイトが数えたものです。
          </p>
        </Panel>

        {area.extra && (
          <Panel className="space-y-2">
            <h2 className={ds.h2}>{area.extra.heading}</h2>
            {area.extra.body.map(t => (
              <p key={t} className={ds.body}>{t}</p>
            ))}
            <p className={ds.small}>
              出典：JR東海「<a className="underline" href={JR_CENTRAL_SMOKING_ROOM_URL} target="_blank" rel="noopener noreferrer">東海道新幹線 車内喫煙ルームの廃止日について</a>」
            </p>
          </Panel>
        )}

        <Panel as="nav" className="space-y-2 text-sm">
          <h2 className={ds.h2}>ほかのエリア</h2>
          <ul className="space-y-1">
            {others.map(o => (
              <li key={o.slug}><Link className={ds.link} href={`/area/${o.slug}/`}>{o.h1}</Link></li>
            ))}
            <li><Link className={ds.link} href="/heatmap/">大阪市全体のヒートマップ</Link></li>
            <li><Link className={ds.link} href="/">トップページ</Link></li>
          </ul>
        </Panel>
        <p className={ds.small}>本サービスは大阪市の公式サービスではありません。</p>
      </main>
    </div>
  );
}
