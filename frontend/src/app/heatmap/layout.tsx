import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = '大阪市の歩きタバコ・迷惑喫煙ヒートマップ | No-Smoke Alert';
const description =
  '大阪市内で寄せられた歩きタバコ・立ち止まり喫煙の報告傾向を、タバコの煙を避けるための参考地図として確認できます。';

export const metadata: Metadata = {
  title: '大阪市の歩きタバコ・迷惑喫煙ヒートマップ',
  description,
  alternates: {
    canonical: '/heatmap/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/heatmap/',
    siteName: 'No-Smoke Alert',
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function HeatmapLayout({ children }: { children: ReactNode }) {
  return children;
}
