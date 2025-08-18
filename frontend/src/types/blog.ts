export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  personas: string[];
  seo: {
    ogImage?: string;
    keywords: string[];
  };
  readTime: number;
  difficulty: "初級" | "中級" | "上級";
}

export interface BlogMetadata {
  totalPosts: number;
  allTags: string[];
  allPersonas: string[];
  latestPosts: BlogPost[];
}

export interface BlogPostFrontMatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  personas: string[];
  seo: {
    ogImage?: string;
    keywords: string[];
  };
  readTime: number;
  difficulty: "初級" | "中級" | "上級";
}

export const BLOG_TAGS = {
  topic: ["法律解説", "健康情報", "統計データ", "地域活動"],
  target: ["子育て世代", "通勤者", "店舗経営", "NPO団体"],
  area: ["大阪市", "関西", "全国"],
  level: ["初級", "中級", "上級"]
} as const;

export const PERSONAS = {
  parents: "子育て世代",
  commuters: "通勤会社員", 
  store_owners: "店舗オーナー",
  respiratory_risk: "呼吸器系リスク層",
  npo: "NPO・市民団体",
  compliant_smoker: "一般喫煙者"
} as const;