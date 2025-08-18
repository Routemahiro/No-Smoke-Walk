import Link from 'next/link';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const readTimeText = `約${post.readTime}分`;
  const publishDate = new Date(post.publishedAt).toLocaleDateString('ja-JP');

  return (
    <Link href={`/blog/${post.id}`}>
      <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="p-6 flex-1">
          {/* 難易度とカテゴリバッジ */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {post.difficulty}
            </span>
            <span className="text-xs text-gray-500">
              {readTimeText}
            </span>
          </div>

          {/* タイトル */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>

          {/* 説明 */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {post.description}
          </p>

          {/* タグ */}
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-gray-400 text-xs px-2 py-1">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>{publishDate}</span>
            <span>{post.author}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}