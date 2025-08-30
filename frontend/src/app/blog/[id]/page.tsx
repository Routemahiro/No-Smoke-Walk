import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost, getRelatedPosts, getAllBlogPostFilenames } from '@/lib/blog';
import { BlogCard } from '../components/BlogCard';
import { PERSONAS } from '@/types/blog';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 静的サイト生成のためのパス生成
export async function generateStaticParams() {
  // 現在の記事IDを手動で指定（実際にはAPIから取得）
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ];
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  
  if (isNaN(id)) {
    notFound();
  }
  
  // 仮のデータ（実際にはAPIから取得）
  const mockPosts = [
    {
      id: 1,
      slug: "osaka-smoking-ban-guide",
      title: "大阪市路上喫煙禁止条例完全ガイド",
      description: "2025年最新版。大阪市の路上喫煙禁止条例の詳細解説と罰則、対象エリアを徹底説明",
      content: "<h1>大阪市路上喫煙禁止条例完全ガイド</h1><p>大阪市では、市民の健康と安全な街づくりのため「大阪市路上喫煙の防止に関する条例」を制定しています。</p>",
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
      difficulty: "初級" as const
    },
    {
      id: 2,
      slug: "child-safety-secondhand-smoke",
      title: "子どもを受動喫煙から守る効果的な方法",
      description: "子育て世代必見！屋外での受動喫煙から子どもを守るための実践的な対策とポイントを詳しく解説",
      content: "<h1>子どもを受動喫煙から守る効果的な方法</h1><p>子どもの健康を脅かす受動喫煙。特に屋外では予期せぬ場面で煙に遭遇することがあります。</p>",
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
      difficulty: "初級" as const
    },
    {
      id: 3,
      slug: "github-actions-test",
      title: "GitHub Actionsテスト記事 - 自動デプロイ機能の動作確認",
      description: "GitHub Actionsによる自動デプロイ機能のテストを兼ねた記事です。この記事が表示されれば、自動デプロイが正常に動作しています。",
      content: "<h1>GitHub Actionsテスト記事</h1><p>🚀 この記事は<strong>GitHub Actionsの自動デプロイ機能</strong>をテストするために作成されました。</p><h2>テストの目的</h2><ul><li>✅ GitHubへのpush時に自動ビルドが実行されるかの確認</li><li>✅ Cloudflare Pagesへの自動デプロイが動作するかの確認</li><li>✅ ブログページに新しい記事が表示されるかの確認</li><li>✅ 静的サイト生成（SSG）が正常に動作するかの確認</li></ul><h2>結論</h2><p>もしあなたがこの記事をブログページで読んでいるなら、<strong>GitHub Actionsによる自動デプロイは正常に動作しています！</strong> 🎉</p>",
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
      difficulty: "初級" as const
    }
  ];

  const post = mockPosts.find(p => p.id === id);
  
  if (!post) {
    notFound();
  }
  
  const relatedPosts = mockPosts.filter(p => p.id !== id);

  // 読了時間の計算
  const readTimeText = `約${post.readTime}分で読めます`;
  
  // ペルソナ名の変換
  const personaNames = post.personas.map(persona => 
    PERSONAS[persona as keyof typeof PERSONAS] || persona
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">ホーム</Link>
            <span>›</span>
            <Link href="/blog" className="hover:text-gray-900">ブログ</Link>
            <span>›</span>
            <span className="text-gray-900">{post.title}</span>
          </nav>
          
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <span>📅 {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</span>
              <span>👤 {post.author}</span>
              <span>⏱️ {readTimeText}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {post.difficulty}
              </span>
            </div>
            
            <p className="text-lg text-gray-700 mb-6">
              {post.description}
            </p>
            
            {/* タグ */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
            
            {/* 対象ペルソナ */}
            {personaNames.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">対象読者: </span>
                {personaNames.join('、')}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 記事本文 */}
        <article className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* 関連記事 */}
        {relatedPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">関連記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}

        {/* ナビゲーション */}
        <div className="flex justify-center">
          <Link 
            href="/blog"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ← ブログ一覧に戻る
          </Link>
        </div>
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
