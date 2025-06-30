import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境では API Routes を有効にするため export を無効化
  // 本番ビルド時のみ静的エクスポート有効化
  ...(process.env.NODE_ENV === 'production' && process.env.EXPORT_MODE === 'true' ? {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
  } : {}),
  images: {
    unoptimized: true
  }
};

export default nextConfig;
