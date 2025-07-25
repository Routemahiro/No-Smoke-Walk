import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 対応設定
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // ビルド時間短縮のため無効化
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 本番環境でのAPI URL書き換え
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://no-smoke-walk-api.no-smoke-walk.workers.dev'
  },
};

export default nextConfig;
