import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = '利用規約 | No-Smoke Alert';
const description =
  'No-Smoke Alertの利用条件、報告ルール、禁止事項、報告データの取扱い、免責事項を説明します。';

export const metadata: Metadata = {
  title: '利用規約',
  description,
  alternates: {
    canonical: '/terms/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/terms/',
    siteName: 'No-Smoke Alert',
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
