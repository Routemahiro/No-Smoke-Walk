import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import type { BlogPost, BlogPostFrontMatter, BlogMetadata } from '@/types/blog';

const contentDirectory = path.join(process.cwd(), '..', 'content', 'blog');

// Markdownファイルを読み込んでHTMLに変換
async function processMarkdown(content: string): Promise<string> {
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(content);
  
  return processedContent.toString();
}

// ファイル名からIDを抽出（001-example.md → 1）
function extractIdFromFilename(filename: string): number {
  const match = filename.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}

// ファイル名からスラッグを抽出（001-example.md → example）
function extractSlugFromFilename(filename: string): string {
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

// 全てのブログ記事ファイル名を取得
export function getAllBlogPostFilenames(): string[] {
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }
  
  const filenames = fs.readdirSync(contentDirectory);
  return filenames
    .filter(name => name.endsWith('.md'))
    .sort((a, b) => extractIdFromFilename(a) - extractIdFromFilename(b));
}

// 特定のブログ記事を取得
export async function getBlogPost(id: number): Promise<BlogPost | null> {
  const filenames = getAllBlogPostFilenames();
  const filename = filenames.find(name => extractIdFromFilename(name) === id);
  
  if (!filename) {
    return null;
  }
  
  const filePath = path.join(contentDirectory, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const frontMatter = data as BlogPostFrontMatter;
  const htmlContent = await processMarkdown(content);
  
  return {
    id,
    slug: extractSlugFromFilename(filename),
    title: frontMatter.title,
    description: frontMatter.description,
    content: htmlContent,
    publishedAt: frontMatter.publishedAt,
    updatedAt: frontMatter.updatedAt,
    author: frontMatter.author,
    tags: frontMatter.tags,
    personas: frontMatter.personas,
    seo: frontMatter.seo,
    readTime: frontMatter.readTime,
    difficulty: frontMatter.difficulty,
  };
}

// 全てのブログ記事を取得
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const filenames = getAllBlogPostFilenames();
  const posts: BlogPost[] = [];
  
  for (const filename of filenames) {
    const id = extractIdFromFilename(filename);
    const post = await getBlogPost(id);
    if (post) {
      posts.push(post);
    }
  }
  
  return posts.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// ブログメタデータを取得
export async function getBlogMetadata(): Promise<BlogMetadata> {
  const posts = await getAllBlogPosts();
  
  const allTags = Array.from(
    new Set(posts.flatMap(post => post.tags))
  ).sort();
  
  const allPersonas = Array.from(
    new Set(posts.flatMap(post => post.personas))
  ).sort();
  
  return {
    totalPosts: posts.length,
    allTags,
    allPersonas,
    latestPosts: posts.slice(0, 5),
  };
}

// タグで記事をフィルタ
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts();
  return posts.filter(post => post.tags.includes(tag));
}

// ペルソナで記事をフィルタ
export async function getBlogPostsByPersona(persona: string): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts();
  return posts.filter(post => post.personas.includes(persona));
}

// 関連記事を取得（タグまたはペルソナが一致する記事）
export async function getRelatedPosts(
  currentPostId: number, 
  limit: number = 3
): Promise<BlogPost[]> {
  const currentPost = await getBlogPost(currentPostId);
  if (!currentPost) return [];
  
  const allPosts = await getAllBlogPosts();
  const otherPosts = allPosts.filter(post => post.id !== currentPostId);
  
  // タグまたはペルソナの一致度でスコアリング
  const scored = otherPosts.map(post => {
    const tagMatches = post.tags.filter(tag => currentPost.tags.includes(tag)).length;
    const personaMatches = post.personas.filter(persona => currentPost.personas.includes(persona)).length;
    const score = tagMatches * 2 + personaMatches * 3; // ペルソナマッチを重視
    
    return { post, score };
  });
  
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}

// 記事内検索
export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts();
  const lowercaseQuery = query.toLowerCase();
  
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowercaseQuery) ||
    post.description.toLowerCase().includes(lowercaseQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    post.content.toLowerCase().includes(lowercaseQuery)
  );
}