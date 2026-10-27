import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = '運営者情報とお問い合わせ | No-Smoke Alert';
const description =
  'No-Smoke Alertの運営者情報、非公式サービスであること、お問い合わせ・報告データ削除依頼の窓口を案内します。';

export const metadata: Metadata = {
  title: '運営者情報とお問い合わせ',
  description,
  alternates: {
    canonical: '/contact/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/contact/',
    siteName: 'No-Smoke Alert',
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
