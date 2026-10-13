import type { Metadata } from 'next';
import { AreaPage } from '@/components/AreaPage';
import { getArea } from '@/lib/areas';

const area = getArea('namba-shinsaibashi');

export const metadata: Metadata = {
  title: { absolute: area.title },
  description: area.description,
  alternates: { canonical: '/area/namba-shinsaibashi/' },
  // REVIEW GATE: noindex while in review. Remove this `robots` line at publish.
  robots: { index: false, follow: true },
  openGraph: { type: 'website', locale: 'ja_JP', url: '/area/namba-shinsaibashi/', siteName: 'No-Smoke Alert', title: area.title, description: area.description },
};

export default function Page() {
  return <AreaPage area={area} />;
}
