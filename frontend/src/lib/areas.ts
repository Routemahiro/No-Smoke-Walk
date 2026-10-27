// Area landing pages (draft). Official facts verified 2026-10-13 against:
// - https://www.city.osaka.lg.jp/kankyo/page/0000630108.html (市内全域 路上喫煙禁止, 令和7年1月27日〜, 過料1,000円)
// - https://www.city.osaka.lg.jp/kankyo/page/0000607135.html (大阪市内の喫煙可能な場所, 2026年10月6日更新)
// Smoking-spot counts = 大阪市指定喫煙所 on that page whose map coordinates are within 1km of `center` (counted 2026-10-13).
// Umeda `spots` were checked 2026-10-26 against that page's 2026-10-16 update (北区). Counts were not re-tallied.

export type AreaSlug = 'namba-shinsaibashi' | 'umeda' | 'shin-osaka';

export interface AreaSpot {
  name: string;
  location: string;
}

export interface AreaConfig {
  slug: AreaSlug;
  name: string; // short display name
  title: string;
  description: string;
  h1: string;
  center: { lat: number; lon: number };
  radiusM: number;
  intro: string;
  spotCount: number;
  spotExamples: string[];
  /** Named spots inside the existing smoking section. When set, spotExamples are not repeated. */
  spots?: AreaSpot[];
  spotsLead?: string;
  /** Replaces SPOTS_CHECKED in this area's smoking-section source line. */
  spotsChecked?: string;
  cityListUrl: string;
  extra?: { heading: string; body: string[] };
}

export const OSAKA_RULE_URL = 'https://www.city.osaka.lg.jp/kankyo/page/0000630108.html';
export const OSAKA_SPOTS_URL = 'https://www.city.osaka.lg.jp/kankyo/page/0000607135.html';
export const SPOTS_CHECKED = '2026年10月13日確認（大阪市ページ 2026年10月6日更新分）';

export const AREAS: AreaConfig[] = [
  {
    slug: 'namba-shinsaibashi',
    name: '難波・心斎橋',
    title: '難波・心斎橋の喫煙所と歩きタバコ報告｜大阪市の路上喫煙ルール',
    description:
      '難波・心斎橋周辺の大阪市指定喫煙所の数と探し方、市内全域の路上喫煙禁止（過料1,000円）のルール、歩きタバコ・立ち止まり喫煙の報告マップをまとめています。',
    h1: '難波・心斎橋の喫煙所と歩きタバコ報告',
    center: { lat: 34.67, lon: 135.501 },
    radiusM: 1000,
    intro:
      '難波から心斎橋にかけては、駅・商店街・繁華街が続き、人通りの多いエリアです。このページでは、近くの喫煙所の探し方と、このあたりで寄せられた歩きタバコ・立ち止まり喫煙の報告をまとめています。',
    spotCount: 49,
    spotExamples: ['なんば喫煙所', '三休橋喫煙所', '東心斎橋喫煙所'],
    cityListUrl: `${'https://www.city.osaka.lg.jp/kankyo/page/0000607135.html'}#chuouku`,
  },
  {
    slug: 'umeda',
    name: '梅田',
    title: '梅田の喫煙所と歩きタバコ報告｜大阪市の路上喫煙ルール',
    description:
      '梅田・大阪駅周辺の大阪市指定喫煙所の数と探し方、主な喫煙所の場所、市内全域の路上喫煙禁止（過料1,000円）のルール、歩きタバコ・立ち止まり喫煙の報告マップをまとめています。',
    h1: '梅田の喫煙所と歩きタバコ報告',
    center: { lat: 34.7025, lon: 135.4959 },
    radiusM: 1000,
    intro:
      '梅田は大阪駅・梅田駅を中心に、通勤や乗り換えで多くの人が行き来するエリアです。このページでは、近くの喫煙所の探し方と、このあたりで寄せられた歩きタバコ・立ち止まり喫煙の報告をまとめています。',
    spotCount: 28,
    spotExamples: ['小松原町喫煙所', 'うめきた公園喫煙所', '西梅田公園喫煙所'],
    spotsLead:
      '吸うときは、歩きながらではなく指定喫煙所で。梅田駅・大阪駅のまわりでは、たとえば次の場所があります。',
    // 堂山町喫煙所の所在地は市ページ表記の「北区小松原町」のまま。西梅田公園喫煙所は市ページでも空白なし。
    spots: [
      { name: '小松原町喫煙所', location: '北区小松原町（屋外・終日）' },
      { name: '堂山町喫煙所', location: '北区小松原町（屋外・終日）' },
      { name: '西梅田公園喫煙所', location: '北区梅田2丁目6番（屋外・終日）' },
      { name: 'うめきた公園喫煙所', location: '北区大深町・うめきた公園内（6時〜24時30分）' },
      { name: 'THE TOBACCO UMEDA', location: '北区梅田1丁目3番1号・大阪駅前第1ビル1階（平日9時〜21時）' },
    ],
    spotsChecked: '大阪市ページ 2026年10月16日更新分、2026年10月26日確認',
    cityListUrl: `${'https://www.city.osaka.lg.jp/kankyo/page/0000607135.html'}#kitaku`,
  },
  {
    slug: 'shin-osaka',
    name: '新大阪駅',
    title: '新大阪駅の喫煙所と歩きタバコ報告｜新幹線に乗る前に',
    description:
      '新大阪駅周辺の大阪市指定喫煙所の数と探し方、新幹線車内の喫煙ルーム廃止、市内全域の路上喫煙禁止（過料1,000円）、歩きタバコ報告マップをまとめています。',
    h1: '新大阪駅の喫煙所と歩きタバコ報告',
    center: { lat: 34.7334, lon: 135.5001 },
    radiusM: 1000,
    intro:
      '新大阪駅は新幹線の乗り降りで多くの人が利用する駅です。このページでは、駅のまわりの喫煙所の探し方と、駅から半径1km以内で寄せられた歩きタバコ・立ち止まり喫煙の報告をまとめています（区は問いません）。',
    spotCount: 9,
    spotExamples: ['新大阪駅西喫煙所', '新大阪駅南喫煙所', '新大阪駅北喫煙所'],
    cityListUrl: `${'https://www.city.osaka.lg.jp/kankyo/page/0000607135.html'}#yodogawaku`,
    extra: {
      heading: '新幹線の中では吸えません',
      body: [
        '東海道・山陽・九州新幹線の車内喫煙ルームは2024年3月16日に廃止され、車内は全面禁煙です。',
        '乗る前に吸いたい場合は、駅の外の大阪市指定喫煙所を使うか、駅の中の喫煙場所の有無をJRの駅案内でご確認ください。駅の中の喫煙場所については、このサイトでは確認できていません。',
      ],
    },
  },
];

export const JR_CENTRAL_SMOKING_ROOM_URL = 'https://jr-central.co.jp/news/release/_pdf/000043148.pdf';

export function getArea(slug: AreaSlug): AreaConfig {
  const a = AREAS.find(x => x.slug === slug);
  if (!a) throw new Error(`unknown area ${slug}`);
  return a;
}
