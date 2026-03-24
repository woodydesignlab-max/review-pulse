/**
 * lib/adapters/app-store.ts
 *
 * Apple App Store 어댑터 — XML RSS 기반
 *
 * RSS URL:
 *   page 1:  https://itunes.apple.com/{country}/rss/customerreviews/id={APP_ID}/sortby=mostrecent/xml
 *   page 2+: https://itunes.apple.com/{country}/rss/customerreviews/page={n}/id={APP_ID}/sortby=mostrecent/xml
 *
 * 파싱: fast-xml-parser
 * fallback: JSON 시도 없음. XML만 사용.
 */

import { XMLParser } from "fast-xml-parser";
import { StoreAdapter, AdapterResult, RawReview, RawAppInfo, FetchOptions } from "./types";

// ── 상수 ────────────────────────────────────────────────────────────────
const MAX_PAGES   = 10;
const LOOKUP_BASE = "https://itunes.apple.com/lookup";
const RSS_BASE    = "https://itunes.apple.com";

// ── XML 파서 ─────────────────────────────────────────────────────────────
// content 요소가 같은 entry 안에 type="text" / type="html" 두 번 등장하므로 배열 강제
const xmlParser = new XMLParser({
  ignoreAttributes:  false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["entry", "content", "link"].includes(name),
  processEntities:   true,
  htmlEntities:      true,
  // HTML content 내부 태그를 파싱하지 않고 텍스트로 유지
  stopNodes:         ["*.content"],
});

// ── 내부 타입 ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

// ── country 추출 (App Store URL에서) ────────────────────────────────────
// https://apps.apple.com/kr/app/... → "kr"
function extractCountry(appUrl: string): string {
  const match = appUrl.match(/apps\.apple\.com\/([a-z]{2})\//i);
  return match ? match[1].toLowerCase() : "kr";
}

// ── RSS URL 생성 ─────────────────────────────────────────────────────────
function buildRssUrl(appId: string, country: string, page: number): string {
  if (page === 1) {
    return `${RSS_BASE}/${country}/rss/customerreviews/id=${appId}/sortby=mostrecent/xml`;
  }
  return `${RSS_BASE}/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/xml`;
}

// ── 앱 정보 수집 (iTunes Lookup API) ────────────────────────────────────
async function fetchAppInfo(appId: string, country: string): Promise<RawAppInfo> {
  const url = `${LOOKUP_BASE}?id=${appId}&country=${country}`;
  console.log(`[app-store] 앱 정보 조회: ${url}`);

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as { resultCount: number; results: AnyObj[] };
    const app  = data.results?.[0];
    if (!app) throw new Error("results 없음");

    console.log(`[app-store] 앱 정보 수집 성공: ${app.trackName}`);
    return {
      name:         String(app.trackName      ?? appId),
      developer:    String(app.artistName     ?? "Unknown"),
      icon:         String(app.artworkUrl512  ?? app.artworkUrl100 ?? ""),
      category:     String(app.primaryGenreName ?? "앱"),
      url:          String(app.trackViewUrl   ?? `https://apps.apple.com/${country}/app/id${appId}`),
      avgRating:    typeof app.averageUserRating === "number" ? app.averageUserRating : undefined,
      totalRatings: typeof app.userRatingCount   === "number" ? app.userRatingCount   : undefined,
    };
  } catch (err) {
    console.warn(`[app-store] 앱 정보 수집 실패, 기본값 사용:`, err);
    return {
      name:      appId,
      developer: "Unknown",
      icon:      "",
      category:  "앱",
      url:       `https://apps.apple.com/${country}/app/id${appId}`,
    };
  }
}

// ── 단일 페이지 XML 수집 + 파싱 ──────────────────────────────────────────
async function fetchPage(appId: string, country: string, page: number): Promise<RawReview[]> {
  const url = buildRssUrl(appId, country, page);
  console.log(`[app-store] RSS fetch (page=${page}): ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept":     "application/xml, text/xml, */*",
    },
  });

  console.log(`[app-store] HTTP ${res.status} (page=${page})`);

  if (!res.ok) {
    if (res.status === 404 || res.status === 400) {
      console.log(`[app-store] fetch 실패: page=${page} HTTP ${res.status} — 페이지 없음, 수집 종료`);
      return [];
    }
    const body = await res.text();
    console.error(`[app-store] fetch 실패: page=${page} HTTP ${res.status} — body:\n${body.slice(0, 300)}`);
    throw new Error(`RSS HTTP ${res.status}`);
  }

  const xml = await res.text();

  // ── XML 파싱 ──────────────────────────────────────────────────────
  let parsed: AnyObj;
  try {
    parsed = xmlParser.parse(xml) as AnyObj;
    console.log(`[app-store] XML 파싱 성공 (page=${page})`);
  } catch (err) {
    console.error(`[app-store] XML 파싱 실패 (page=${page}):`, err);
    console.error(`[app-store] XML 앞부분:\n${xml.slice(0, 300)}`);
    throw new Error(`XML 파싱 오류: ${err}`);
  }

  const feed    = parsed?.feed as AnyObj | undefined;
  const entries = Array.isArray(feed?.entry) ? (feed.entry as AnyObj[]) : [];

  if (entries.length === 0) {
    console.log(`[app-store] entry 없음: page=${page} — feed.entry 미존재, 수집 종료`);
    return [];
  }

  // ── entry → RawReview 변환 ────────────────────────────────────────
  // 리뷰 조건: im:rating + content(type=text) 모두 존재해야 함
  const reviews: RawReview[] = [];

  for (const e of entries) {
    // im:rating 없으면 앱 메타 entry → skip
    const rawRating = e["im:rating"];
    if (rawRating == null) {
      console.log(`[app-store] skip entry (im:rating 없음): id=${e.id ?? "?"}`);
      continue;
    }

    // content 배열에서 type="text" 추출
    const contentArr: AnyObj[] = Array.isArray(e.content)
      ? e.content
      : e.content != null ? [e.content] : [];

    const textEntry = contentArr.find((c) => c["@_type"] === "text");
    // stopNodes를 사용했으므로 텍스트가 #text 또는 문자열 직접값으로 올 수 있음
    const text = String(
      textEntry?.["#text"] ??
      (typeof textEntry === "string" ? textEntry : "") ??
      ""
    ).trim();

    if (!text) {
      console.log(`[app-store] skip entry (content.text 없음): id=${e.id ?? "?"}`);
      continue;
    }

    // author
    const authorName = String(e.author?.name ?? "익명");

    // date
    const dateStr = String(e.updated ?? "");
    const date    = dateStr ? new Date(dateStr) : new Date();

    reviews.push({
      id:         String(e.id ?? Math.random()),
      text,
      rating:     Math.min(5, Math.max(1, Number(rawRating))),
      date:       isNaN(date.getTime()) ? new Date() : date,
      author:     authorName,
      version:    e["im:version"] != null ? String(e["im:version"]) : undefined,
      sortSource: "newest",
    });
  }

  console.log(`[app-store] page=${page}: ${reviews.length}개 리뷰 추출 (전체 entry: ${entries.length})`);
  return reviews;
}

// ── 전체 페이지 순차 수집 ───────────────────────────────────────────────
async function fetchAllReviews(appId: string, country: string): Promise<RawReview[]> {
  const all  = new Map<string, RawReview>(); // id → RawReview (중복 제거)

  for (let page = 1; page <= MAX_PAGES; page++) {
    let pageReviews: RawReview[];
    try {
      pageReviews = await fetchPage(appId, country, page);
    } catch (err) {
      console.error(`[app-store] page=${page} 수집 실패, 수집 중단:`, err);
      break;
    }

    if (pageReviews.length === 0) {
      console.log(`[app-store] page=${page} 빈 페이지 — 수집 종료`);
      break;
    }

    for (const r of pageReviews) {
      if (!all.has(r.id)) all.set(r.id, r);
    }

    console.log(`[app-store] 누계: ${all.size}개`);
  }

  const result = [...all.values()];
  console.log(`[app-store] 최종 수집 완료: ${result.length}개 리뷰`);
  return result;
}

// ── AppStoreAdapter ──────────────────────────────────────────────────────
export class AppStoreAdapter implements StoreAdapter {
  readonly storeType = "app_store" as const;

  /**
   * @param appId   숫자 App ID (예: "839333328")
   * @param options country 필드에 App Store URL 국가코드 전달 가능 (기본: "kr")
   */
  async fetch(appId: string, options?: FetchOptions): Promise<AdapterResult> {
    const country = options?.country ?? "kr";

    console.log(`\n[app-store] ── 수집 시작 ────────────────────────`);
    console.log(`[app-store] store detection: App Store`);
    console.log(`[app-store] extracted app id: ${appId}`);
    console.log(`[app-store] country: ${country}`);

    // 앱 정보 + 리뷰 병렬 수집
    const [appInfo, reviews] = await Promise.all([
      fetchAppInfo(appId, country),
      fetchAllReviews(appId, country),
    ]);

    console.log(`[app-store] ── 수집 완료 ────────────────────────\n`);

    return {
      appInfo,
      reviews,
      fetchedAt: new Date(),
      storeType: "app_store",
      stats: {
        newestFetched: reviews.length,
        ratingFetched: 0,
        totalUnique:   reviews.length,
      },
    };
  }
}

export const appStoreAdapter = new AppStoreAdapter();
export { extractCountry };
