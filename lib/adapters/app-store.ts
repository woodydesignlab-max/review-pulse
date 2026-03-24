/**
 * lib/adapters/app-store.ts
 *
 * Apple App Store 어댑터.
 * iTunes RSS Feed를 사용해 리뷰와 앱 정보를 수집.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  RSS Feed URL:                                               │
 * │  https://itunes.apple.com/kr/rss/customerreviews/           │
 * │    page={n}/id={APP_ID}/sortby=mostrecent/json              │
 * │                                                              │
 * │  앱 정보 URL (iTunes Lookup API):                            │
 * │  https://itunes.apple.com/lookup?id={APP_ID}&country=kr     │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 수집 전략:
 *   최신순(mostrecent) RSS 페이지를 최대 10페이지 순차 수집.
 *   각 페이지당 최대 50개 리뷰. 빈 페이지가 나오면 조기 종료.
 *
 * Fallback: RSS 실패 시 HTML scraping 시도 없음 (명시적 요구사항).
 */

import { StoreAdapter, AdapterResult, RawReview, RawAppInfo, FetchOptions } from "./types";

// ── 상수 ────────────────────────────────────────────────────────────────
const MAX_PAGES = 10;
const RSS_BASE  = "https://itunes.apple.com/kr/rss/customerreviews";
const LOOKUP_BASE = "https://itunes.apple.com/lookup";

// ── iTunes RSS 응답 타입 ─────────────────────────────────────────────────
interface RssEntry {
  id?:            { label?: string };
  title?:         { label?: string };
  content?:       { label?: string };
  "im:rating"?:  { label?: string };
  "im:version"?: { label?: string };
  author?:        { name?: { label?: string } };
  updated?:       { label?: string };
  // 첫 번째 entry는 앱 정보이므로 im:name이 존재
  "im:name"?:     { label?: string };
}

interface RssFeed {
  feed?: {
    entry?: RssEntry[] | RssEntry;
  };
}

// ── iTunes Lookup API 응답 타입 ──────────────────────────────────────────
interface LookupResult {
  resultCount: number;
  results: Array<{
    trackName?: string;
    artistName?: string;
    artworkUrl512?: string;
    artworkUrl100?: string;
    primaryGenreName?: string;
    trackViewUrl?: string;
    averageUserRating?: number;
    userRatingCount?: number;
  }>;
}

// ── 앱 정보 수집 (iTunes Lookup API) ────────────────────────────────────
async function fetchAppInfo(appId: string): Promise<RawAppInfo> {
  const url = `${LOOKUP_BASE}?id=${appId}&country=kr`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Lookup API ${res.status}`);

    const data: LookupResult = await res.json();
    const app = data.results?.[0];
    if (!app) throw new Error("앱 정보 없음");

    return {
      name:         app.trackName      ?? appId,
      developer:    app.artistName     ?? "Unknown",
      icon:         app.artworkUrl512  ?? app.artworkUrl100 ?? "",
      category:     app.primaryGenreName ?? "앱",
      url:          app.trackViewUrl   ?? `https://apps.apple.com/kr/app/id${appId}`,
      avgRating:    app.averageUserRating,
      totalRatings: app.userRatingCount,
    };
  } catch (err) {
    console.warn(`[app-store] 앱 정보 수집 실패, 기본값 사용:`, err);
    return {
      name:      appId,
      developer: "Unknown",
      icon:      "",
      category:  "앱",
      url:       `https://apps.apple.com/kr/app/id${appId}`,
    };
  }
}

// ── 단일 페이지 RSS 수집 ─────────────────────────────────────────────────
async function fetchPage(appId: string, page: number): Promise<RawReview[]> {
  const url = `${RSS_BASE}/page=${page}/id=${appId}/sortby=mostrecent/json`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept":     "application/json",
    },
  });

  if (!res.ok) {
    // 404 or 400 = 페이지 없음 → 조기 종료 신호
    if (res.status === 404 || res.status === 400) return [];
    throw new Error(`RSS 응답 오류: ${res.status} (page=${page})`);
  }

  const data: RssFeed = await res.json();
  const rawEntries = data?.feed?.entry;
  if (!rawEntries) return [];

  // entry는 단일 객체일 수도, 배열일 수도 있음
  const entries: RssEntry[] = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  // 첫 번째 entry는 앱 메타정보(im:name 포함) → 리뷰 아님, 건너뜀
  const reviewEntries = entries.filter((e) => !e["im:name"]);

  return reviewEntries.map((e): RawReview => {
    const id     = e.id?.label ?? String(Math.random());
    const text   = e.content?.label ?? "";
    const rating = Number(e["im:rating"]?.label) || 3;
    const author = e.author?.name?.label ?? "익명";
    const dateStr = e.updated?.label ?? "";
    const date   = dateStr ? new Date(dateStr) : new Date();
    const version = e["im:version"]?.label;

    return {
      id,
      text,
      rating: Math.min(5, Math.max(1, rating)),
      date: isNaN(date.getTime()) ? new Date() : date,
      author,
      version,
      sortSource: "newest",
    };
  });
}

// ── 전체 페이지 순차 수집 ───────────────────────────────────────────────
async function fetchAllReviews(appId: string): Promise<RawReview[]> {
  const all: RawReview[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    let pageReviews: RawReview[];
    try {
      pageReviews = await fetchPage(appId, page);
    } catch (err) {
      console.warn(`[app-store] page=${page} 수집 실패, 중단:`, err);
      break;
    }

    // 빈 페이지 = 더 이상 데이터 없음
    if (pageReviews.length === 0) {
      console.log(`[app-store] page=${page} 빈 페이지 — 수집 종료`);
      break;
    }

    // 중복 제거
    for (const r of pageReviews) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        all.push(r);
      }
    }

    console.log(`[app-store] page=${page}: ${pageReviews.length}개 수집 (누계: ${all.length})`);
  }

  return all;
}

// ── AppStoreAdapter 구현 ─────────────────────────────────────────────────
export class AppStoreAdapter implements StoreAdapter {
  readonly storeType = "app_store" as const;

  async fetch(appId: string, _options?: FetchOptions): Promise<AdapterResult> {
    // 앱 정보와 리뷰를 병렬 수집
    const [appInfo, reviews] = await Promise.all([
      fetchAppInfo(appId),
      fetchAllReviews(appId),
    ]);

    return {
      appInfo,
      reviews,
      fetchedAt: new Date(),
      storeType: "app_store",
      stats: {
        newestFetched: reviews.length,
        ratingFetched: 0,           // RSS는 단일 정렬 — rating 별도 수집 없음
        totalUnique:   reviews.length,
      },
    };
  }
}

// 싱글톤 인스턴스
export const appStoreAdapter = new AppStoreAdapter();
