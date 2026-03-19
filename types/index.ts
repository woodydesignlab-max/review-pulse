export interface AppInfo {
  name: string;
  developer: string;
  icon: string;
  store: string;
  category: string;
  url: string;
}

export interface ReviewSummary {
  /** Google Play / App Store 공식 전체 평균 별점 (가중 평균, 전체 기간) */
  avgRating: number;
  /** 수집된 샘플 리뷰의 단순 평균 (최신 편향 있음, 최근 체감도 반영) */
  sampleAvgRating: number;
  /** 실제 수집된 리뷰 수 (totalReviews와 다름) */
  sampleCount: number;
  /** 스토어 공식 전체 리뷰(평가) 수 */
  totalReviews: number;
  recentReviews: number;
  negativeRatio: number;
  positiveRatio: number;
  neutralRatio: number;
}

export interface RatingDistribution {
  star: number;
  count: number;
  percent: number;
}

export interface Topic {
  name: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  trend: "up" | "down" | "stable";
}

export interface TrendPoint {
  date: string;
  rating: number;
  negative: number;
}

export interface TrendData {
  "7d": TrendPoint[];
  "30d": TrendPoint[];
  "90d": TrendPoint[];
}

export interface NegativeIssue {
  title: string;
  description: string;
  count: number;
  trend: "up" | "down" | "stable";
}

export interface Insights {
  summary: string;
  positivePoints: string[];
  negativePoints: string[];
  actions: string[];
}

export interface ReviewItem {
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface RepresentativeReviews {
  positive: ReviewItem[];
  negative: ReviewItem[];
}

export interface AnalysisReport {
  app: AppInfo;
  summary: ReviewSummary;
  ratingDistribution: RatingDistribution[];
  topics: Topic[];
  trendData: TrendData;
  recentNegativeIssues: NegativeIssue[];
  insights: Insights;
  representativeReviews: RepresentativeReviews;
  analyzedAt: string;
}
