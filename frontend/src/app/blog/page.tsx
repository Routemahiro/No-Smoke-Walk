'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BlogCard } from './components/BlogCard';
import { TagFilter } from './components/TagFilter';
import type { BlogPost, BlogMetadata } from '@/types/blog';

// 静的データ
const posts: BlogPost[] = [
  {
    id: 1,
    slug: "osaka-smoking-ban-guide",
    title: "大阪市路上喫煙禁止条例完全ガイド",
    description: "2025年最新版。大阪市の路上喫煙禁止条例の詳細解説と罰則、対象エリアを徹底説明",
    content: "",
    publishedAt: "2025-01-31",
    updatedAt: "2025-01-31",
    author: "No-Smoke Alert編集部",
    tags: ["法律解説", "大阪市", "条例", "罰則"],
    personas: ["parents", "store_owners", "commuters"],
    seo: {
      ogImage: "/blog/images/001-cover.jpg",
      keywords: ["大阪市", "路上喫煙", "禁止条例", "罰則"]
    },
    readTime: 8,
    difficulty: "初級"
  },
  {
    id: 2,
    slug: "child-safety-secondhand-smoke",
    title: "子どもを受動喫煙から守る効果的な方法",
    description: "子育て世代必見！屋外での受動喫煙から子どもを守るための実践的な対策とポイントを詳しく解説",
    content: "",
    publishedAt: "2025-02-01",
    updatedAt: "2025-02-01",
    author: "No-Smoke Alert編集部",
    tags: ["健康情報", "子育て世代", "受動喫煙", "安全対策"],
    personas: ["parents", "respiratory_risk"],
    seo: {
      ogImage: "/blog/images/002-cover.jpg",
      keywords: ["受動喫煙", "子ども", "健康被害", "対策"]
    },
    readTime: 6,
    difficulty: "初級"
  },
  {
    id: 3,
    slug: "github-actions-test",
    title: "GitHub Actionsテスト記事 - 自動デプロイ機能の動作確認",
    description: "GitHub Actionsによる自動デプロイ機能のテストを兼ねた記事です。この記事が表示されれば、自動デプロイが正常に動作しています。",
    content: "",
    publishedAt: "2025-08-27",
    updatedAt: "2025-08-27",
    author: "No-Smoke Alert開発チーム",
    tags: ["テスト", "GitHub Actions", "自動化", "開発"],
    personas: ["developers", "system_admin"],
    seo: {
      ogImage: "/blog/images/003-cover.jpg",
      keywords: ["GitHub Actions", "自動デプロイ", "テスト", "開発"]
    },
    readTime: 3,
    difficulty: "初級"
  }
];

const allTags = Array.from(new Set(posts.flatMap(post => post.tags))).sort();
const allPersonas = Array.from(new Set(posts.flatMap(post => post.personas))).sort();

const metadata: BlogMetadata = {
  totalPosts: posts.length,
  allTags,
  allPersonas,
  latestPosts: posts.slice(0, 5)
};

function BlogPageContent() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  // フィルタリング
  let filteredPosts = posts;
  
  if (selectedTag) {
    filteredPosts = filteredPosts.filter(post => 
      post.tags.includes(selectedTag)
    );
  }
  
  if (selectedPersona) {
    filteredPosts = filteredPosts.filter(post => 
      post.personas.includes(selectedPersona)
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← ホームに戻る
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  📝 ブログ・記事
                </h1>
                <p className="text-sm text-gray-600">
                  迷惑タバコ問題に関する有益な情報をお届けします
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルタセクション */}
        <div className="mb-8">
          <TagFilter 
            allTags={metadata.allTags}
            allPersonas={metadata.allPersonas}
            currentTag={selectedTag}
            currentPersona={selectedPersona}
            onTagChange={setSelectedTag}
            onPersonaChange={setSelectedPersona}
          />
        </div>

        {/* 記事統計 */}
        <div className="mb-6 text-sm text-gray-600">
          <p>
            {filteredPosts.length} 件の記事
            {selectedTag && ` (タグ: ${selectedTag})`}
            {selectedPersona && ` (対象: ${selectedPersona})`}
          </p>
        </div>

        {/* 記事一覧 */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              該当する記事が見つかりません
            </p>
            <Link 
              href="/blog"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline"
            >
              全ての記事を見る
            </Link>
          </div>
        )}

        {/* 最新記事セクション */}
        {!selectedTag && !selectedPersona && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">最新記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metadata.latestPosts.slice(0, 3).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 space-y-2">
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/terms" className="hover:text-gray-700 underline">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-gray-700 underline">
                プライバシーポリシー
              </Link>
            </div>
            <p>© 2025 NO-SMOKE ALERT Osaka</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function BlogPage() {
  return <BlogPageContent />;
}