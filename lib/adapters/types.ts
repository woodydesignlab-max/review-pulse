/**
 * lib/adapters/types.ts
 * 모든 스토어 어댑터가 구현해야 하는 공용 인터페이스.
 */

export interface RawReview {
  id: string;
  text: string;
  rating: number;       // 1~5
  date: Date;
  author: string;
  version?: string;
  thumbsUp?: number;
  sortSource?: "newest" | "rating"; // 어떤 정렬로 가져왔는지 (분석 참고용)
}

export interface RawAppInfo {
  name: string;
  developer: string;
  icon: string;
  category: string;
  url: string;
  /** 스토어에 표시되는 공식 평균 별점 (전체 평가 기반) */
  avgRating?: number;
  /** 스토어에 표시되는 전체 평가 수 */
  totalRatings?: number;
}

/**
 * 수집 옵션.
 *
 * ┌─────────────┬──────────┬──────────┬─────────────────────────────┐
 * │ 프리셋       │ NEWEST   │ RATING   │ 예상 응답시간               │
 * ├─────────────┼──────────┼──────────┼─────────────────────────────┤
 * │ fast        │ 200      │  0       │ 1~2초 (최신 편향)           │
 * │ standard    │ 250      │ 150      │ 2~4초 (기본값, 균형)        │
 * │ thorough    │ 400      │ 300      │ 5~8초 (대표성 ↑)           │
 * └─────────────┴──────────┴──────────┴─────────────────────────────┘
 */
export interface FetchOptions {
  /** NEWEST 정렬로 가져올 리뷰 수 (기본: 250) */
  newestCount?: number;
  /** RATING(관련성) 정렬로 가져올 리뷰 수 (기본: 150) */
  ratingCount?: number;
  language?: string;
  country?: string;
}

export interface AdapterResult {
  appInfo: RawAppInfo;
  reviews: RawReview[];
  fetchedAt: Date;
  storeType: "google_play" | "app_store";
  /** 수집 통계 (디버깅 및 UI 표시용) */
  stats: {
    newestFetched: number;
    ratingFetched: number;
    totalUnique: number;
  };
}

export interface StoreAdapter {
  readonly storeType: "google_play" | "app_store";
  fetch(appId: string, options?: FetchOptions): Promise<AdapterResult>;
}
