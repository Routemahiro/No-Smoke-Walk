import type { Metadata, Viewport } from 'next';
// import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import './globals.css';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

// Temporary: Use system fonts to avoid build timeout
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// const notoSansJP = Noto_Sans_JP({
//   variable: "--font-noto-sans-jp",
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
// });

const siteUrl = 'https://no-smoke-alert.com';
const siteName = 'No-Smoke Alert';
const siteTitle = `${siteName} | 大阪市の歩きタバコ・迷惑喫煙報告マップ`;
const siteDescription =
  'No-Smoke Alertは、大阪市の歩きタバコ・迷惑喫煙の報告を集め、報告が集まっている可能性のあるエリアを地図で可視化するサービスです。';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'No-Smoke Alert',
    '大阪市 歩きタバコ',
    '大阪市 迷惑喫煙',
    '歩きタバコ 報告',
    '迷惑喫煙 報告',
    '喫煙マナー',
    'ヒートマップ',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/',
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  category: 'civic technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-256x256.png', sizes: '256x256', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <GoogleAnalytics measurementId="G-3F4H0CTST0" />
        {children}
      </body>
    </html>
  );
}
