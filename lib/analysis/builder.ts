/**
 * lib/analysis/builder.ts
 *
 * AdapterResult(실제 수집) → AnalysisReport 조립.
 * 각 분석 모듈을 순서대로 호출하고 결과를 합칩니다.
 *
 * 필드별 데이터 출처:
 * ┌─────────────────────────────┬────────────────────────────────────┐
 * │ 필드                         │ 출처                               │
 * ├─────────────────────────────┼────────────────────────────────────┤
 * │ app.*                       │ ✅ REAL  — google-play-scraper     │
 * │ summary.avgRating           │ ✅ REAL  — 수집 리뷰 평균           │
 * │ summary.totalReviews        │ ✅ REAL  — 수집된 리뷰 수           │
 * │ summary.recentReviews       │ ✅ REAL  — 최근 30일 필터           │
 * │ summary.positiveRatio       │ ✅ REAL  — sentiment.ts (규칙 기반) │
 * │ summary.neutralRatio        │ ✅ REAL  — sentiment.ts            │
 * │ summary.negativeRatio       │ ✅ REAL  — sentiment.ts            │
 * │ ratingDistribution          │ ✅ REAL  — 수집 리뷰 집계           │
 * │ representativeReviews       │ ✅ REAL  — 실제 리뷰 텍스트         │
 * │ topics                      │ ✅ REAL  — topics.ts (키워드 맵)   │
 * │ trendData                   │ ✅ REAL  — trends.ts (날짜 집계)   │
 * │ recentNegativeIssues        │ ✅ REAL  — issues.ts (토픽 기반)   │
 * │ insights.summary            │ ⚠️ HEURISTIC — 템플릿 문장          │
 * │ insights.positivePoints     │ ⚠️ HEURISTIC — 토픽 기반 자동 생성  │
 * │ insights.negativePoints     │ ⚠️ HEURISTIC — 토픽 기반 자동 생성  │
 * │ insights.actions            │ ⚠️ HEURISTIC — 토픽 기반 자동 생성  │
 * │ analyzedAt                  │ ✅ REAL  — 수집 시각               │
 * └─────────────────────────────┴────────────────────────────────────┘
 *
 * HEURISTIC → Claude API 교체 포인트: lib/analysis/insights.ts
 */

import { AnalysisReport, RatingDistribution, ReviewItem } from "@/types";
import { AdapterResult }         from "@/lib/adapters/types";
import { analyzeSentiment }      from "./sentiment";
import { extractTopics }         from "./topics";
import { buildTrendData }        from "./trends";
import { extractNegativeIssues } from "./issues";
import { generateInsights }      from "./insights";

// ── 별점 분포 ────────────────────────────────────────────────────────────
function computeRatingDistribution(reviews: AdapterResult["reviews"]): RatingDistribution[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.round(Math.min(5, Math.max(1, r.rating)));
    counts[star]++;
  }
  const total = reviews.length || 1;
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star],
    percent: Math.round((counts[star] / total) * 100),
  }));
}

// ── 평균 별점 ────────────────────────────────────────────────────────────
function computeAvgRating(reviews: AdapterResult["reviews"]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// ── 최근 N일 리뷰 수 ─────────────────────────────────────────────────────
function countRecentReviews(reviews: AdapterResult["reviews"], days = 30): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return reviews.filter((r) => r.date >= cutoff).length;
}

// ── 대표 리뷰 추출 ───────────────────────────────────────────────────────
function extractRepresentativeReviews(
  reviews: AdapterResult["reviews"]
): { positive: ReviewItem[]; negative: ReviewItem[] } {
  const withText = reviews.filter((r) => r.text && r.text.trim().length > 20);

  const toItem = (r: typeof reviews[0]): ReviewItem => ({
    author: r.author.length > 8 ? r.author.slice(0, 6) + "***" : r.author + "***",
    rating: r.rating,
    date:   r.date.toISOString().slice(0, 10),
    text:   r.text,
  });

  const positive = [...withText]
    .filter((r) => r.rating >= 4)
    .sort((a, b) => (b.thumbsUp ?? 0) - (a.thumbsUp ?? 0) || b.date.getTime() - a.date.getTime())
    .slice(0, 3)
    .map(toItem);

  const negative = [...withText]
    .filter((r) => r.rating <= 2)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3)
    .map(toItem);

  return { positive, negative };
}

// ── 메인 빌더 ─────────────────────────────────────────────────────────────
export function buildAnalysisReport(
  result: AdapterResult,
  template: AnalysisReport      // 리뷰가 없거나 분석 실패 시 fallback용
): AnalysisReport {
  const { appInfo, reviews, fetchedAt, storeType } = result;

  // 리뷰가 없으면 mock 템플릿 그대로 반환
  if (reviews.length === 0) {
    console.warn("[builder] 수집된 리뷰 없음 — mock 템플릿 사용");
    return template;
  }

  // ── 1. 기본 수치 계산 ──────────────────────────────────────────────
  // sampleAvgRating: 수집된 리뷰 샘플의 단순 산술 평균.
  //   NEWEST 편향이 포함되어 있어 최근 이슈(대기열, 오류 등) 발생 시 낮게 나올 수 있음.
  // avgRating: 스토어 공식 전체 평균 (전체 기간 가중 평균). 없으면 샘플 평균으로 fallback.
  const sampleAvgRating    = Math.round(computeAvgRating(reviews) * 10) / 10;
  const officialAvgRating  = appInfo.avgRating ?? sampleAvgRating;
  const avgRating          = Math.round(officialAvgRating * 10) / 10;
  const ratingDistribution = computeRatingDistribution(reviews);
  const totalReviews       = appInfo.totalRatings ?? reviews.length;
  const recentReviews      = countRecentReviews(reviews, 30);

  // ── 2. 감성 분석 ─────────────────────────────────────────────────
  const sentiment = analyzeSentiment(reviews);

  // ── 3. 토픽 추출 ─────────────────────────────────────────────────
  const topics = extractTopics(reviews, sentiment.labels);

  // ── 4. 기간별 트렌드 ─────────────────────────────────────────────
  const trendData = buildTrendData(reviews);

  // ── 5. 부정 이슈 추출 ────────────────────────────────────────────
  const recentNegativeIssues = extractNegativeIssues(topics);

  // ── 6. 인사이트 생성 (heuristic) ─────────────────────────────────
  // 인사이트 요약문에는 실제 수집된 리뷰 수를 사용 (전체 평가 수와 구분)
  const insights = generateInsights({
    totalReviews: reviews.length,
    positiveRatio:  sentiment.positiveRatio,
    neutralRatio:   sentiment.neutralRatio,
    negativeRatio:  sentiment.negativeRatio,
    avgRating,
    topics,
  });

  // ── 7. 대표 리뷰 ─────────────────────────────────────────────────
  const representativeReviews = extractRepresentativeReviews(reviews);

  const storeLabel = storeType === "google_play" ? "Google Play" : "App Store";

  return {
    app: {
      name:      appInfo.name,
      developer: appInfo.developer,
      icon:      appInfo.icon,
      store:     storeLabel,
      category:  appInfo.category,
      url:       appInfo.url,
    },
    summary: {
      avgRating,
      sampleAvgRating,
      sampleCount: reviews.length,
      totalReviews,
      recentReviews,
      positiveRatio: sentiment.positiveRatio,
      neutralRatio:  sentiment.neutralRatio,
      negativeRatio: sentiment.negativeRatio,
    },
    ratingDistribution,
    topics:                topics.length > 0 ? topics : template.topics,
    trendData,
    recentNegativeIssues:  recentNegativeIssues.length > 0 ? recentNegativeIssues : template.recentNegativeIssues,
    insights,
    representativeReviews,
    analyzedAt: fetchedAt.toISOString(),
  };
}
