import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = 'プライバシーポリシー | No-Smoke Alert';
const description =
  'No-Smoke Alertにおける位置情報、報告データ、アクセス解析、広告・外部サービスの利用目的と取扱い方針を説明します。';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description,
  alternates: {
    canonical: '/privacy/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/privacy/',
    siteName: 'No-Smoke Alert',
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
