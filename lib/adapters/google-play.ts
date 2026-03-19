/**
 * lib/adapters/google-play.ts
 *
 * Google Play 스토어 어댑터.
 * google-play-scraper 패키지를 사용해 리뷰와 앱 정보를 수집.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  📌 실제 수집 로직이 담긴 핵심 파일                              │
 * │  이 파일 안의 fetchReviews / fetchAppInfo 함수를               │
 * │  공식 API 또는 다른 수집 방식으로 교체하면 됩니다.                │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 수집 전략:
 *   NEWEST (최신순) + RATING (관련성순) 병렬 수집 후 ID 기준 중복 제거.
 *   최신 이슈와 시간 분산된 리뷰를 동시에 확보해 편향을 줄입니다.
 *
 * 의존 패키지: google-play-scraper
 * 설치: npm install google-play-scraper
 */

import { StoreAdapter, AdapterResult, RawReview, RawAppInfo, FetchOptions } from "./types";

// google-play-scraper는 ESM default export를 가진 패키지
// require()로 로드한 뒤 .default로 접근해야 함
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;

// ── 기본 수집 옵션 ──────────────────────────────────────────────────────
const DEFAULTS: Required<FetchOptions> = {
  newestCount: 250,
  ratingCount: 150,
  language: "ko",
  country: "kr",
};

// ── 앱 정보 수집 ─────────────────────────────────────────────────────────
async function fetchAppInfo(appId: string, opts: Required<FetchOptions>): Promise<RawAppInfo> {
  // 📌 INTEGRATION POINT ─ 앱 정보 수집
  // gplay.app() → 스토어 페이지의 앱 메타데이터 반환
  // avgRating (= app.score) 은 Google Play의 공식 전체 평균 별점입니다.
  const app = await gplay.app({
    appId,
    lang: opts.language,
    country: opts.country,
  });

  return {
    name: app.title ?? appId,
    developer: app.developer ?? "Unknown",
    icon: app.icon ?? "",
    category: app.genre ?? "앱",
    url: app.url ?? `https://play.google.com/store/apps/details?id=${appId}`,
    avgRating: app.score ?? undefined,
    totalRatings: app.ratings ?? undefined,
  };
}

// ── 단일 정렬 기준으로 리뷰 수집 ──────────────────────────────────────────
async function fetchReviewsBySort(
  appId: string,
  sort: number,
  count: number,
  sortSource: "newest" | "rating",
  opts: Required<FetchOptions>
): Promise<RawReview[]> {
  if (count <= 0) return [];

  const result = await gplay.reviews({
    appId,
    sort,
    num: count,
    lang: opts.language,
    country: opts.country,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result.data.map((r: any): RawReview => ({
    id: r.id ?? String(Math.random()),
    text: r.text ?? "",
    rating: Number(r.score) || 3,
    date: r.date instanceof Date ? r.date : new Date(r.date),
    author: r.userName ?? "익명",
    version: r.version ?? undefined,
    thumbsUp: r.thumbsUp ?? 0,
    sortSource,
  }));
}

// ── 병렬 수집 + 중복 제거 ─────────────────────────────────────────────────
async function fetchReviews(
  appId: string,
  opts: Required<FetchOptions>
): Promise<{ reviews: RawReview[]; newestFetched: number; ratingFetched: number }> {
  // 📌 INTEGRATION POINT ─ 리뷰 수집
  // NEWEST + RATING(관련성) 두 정렬을 병렬로 수집.
  // NEWEST: 최근 이슈 파악. RATING: 시간 분산된 대표 리뷰 확보.
  const [newest, rating] = await Promise.all([
    fetchReviewsBySort(appId, gplay.sort.NEWEST, opts.newestCount, "newest", opts),
    fetchReviewsBySort(appId, gplay.sort.RATING, opts.ratingCount, "rating",  opts),
  ]);

  // ID 기준 중복 제거 (NEWEST 우선 유지)
  const seen = new Set<string>();
  const unique: RawReview[] = [];

  for (const r of [...newest, ...rating]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      unique.push(r);
    }
  }

  return {
    reviews: unique,
    newestFetched: newest.length,
    ratingFetched: rating.length,
  };
}

// ── GooglePlayAdapter 구현 ────────────────────────────────────────────
export class GooglePlayAdapter implements StoreAdapter {
  readonly storeType = "google_play" as const;

  async fetch(appId: string, options?: FetchOptions): Promise<AdapterResult> {
    const opts: Required<FetchOptions> = { ...DEFAULTS, ...options };

    // 앱 정보와 리뷰를 병렬 수집
    const [appInfo, reviewResult] = await Promise.all([
      fetchAppInfo(appId, opts),
      fetchReviews(appId, opts),
    ]);

    const { reviews, newestFetched, ratingFetched } = reviewResult;

    return {
      appInfo,
      reviews,
      fetchedAt: new Date(),
      storeType: "google_play",
      stats: {
        newestFetched,
        ratingFetched,
        totalUnique: reviews.length,
      },
    };
  }
}

// 싱글톤 인스턴스 (route.ts에서 import해서 사용)
export const googlePlayAdapter = new GooglePlayAdapter();
