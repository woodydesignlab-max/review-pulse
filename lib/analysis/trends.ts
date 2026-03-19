/**
 * lib/analysis/trends.ts
 *
 * 실제 리뷰 날짜 데이터를 기간별로 집계해 TrendData 생성.
 *
 * 기간별 버킷 전략:
 *   7d  → 최근 7일, 일별(7개 포인트)
 *   30d → 최근 30일, 5일 간격(6개 포인트)
 *   90d → 최근 90일, 15일 간격(6개 포인트)
 *
 * 버킷에 리뷰가 없으면 직전 버킷 값으로 채움 (선형 보간보다 단순하게).
 *
 * 📌 교체 포인트:
 *   더 많은 리뷰를 수집하거나, DB에 누적 데이터가 쌓이면
 *   이 함수를 DB 쿼리 기반으로 교체하면 됩니다.
 */

import { TrendData, TrendPoint } from "@/types";
import { RawReview } from "@/lib/adapters/types";
import { classifySentiment } from "./sentiment";

// ── 날짜를 "M/D" 형식 문자열로 변환 ───────────────────────────────────────
function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ── 버킷 단위로 리뷰 집계 ─────────────────────────────────────────────────
interface BucketResult {
  date: string;
  avgRating: number;
  negativeRatio: number;
}

function bucketReviews(
  reviews: RawReview[],
  buckets: Date[] // 각 버킷의 시작일 (오래된 순)
): BucketResult[] {
  const results: BucketResult[] = [];

  for (let i = 0; i < buckets.length; i++) {
    const from = buckets[i];
    const to   = buckets[i + 1] ?? new Date(Date.now() + 86400_000); // 다음 버킷 시작 or 내일

    const inBucket = reviews.filter(
      (r) => r.date >= from && r.date < to
    );

    if (inBucket.length === 0) {
      // 빈 버킷: 직전 결과 재사용 or 전체 평균
      const prev = results[results.length - 1];
      results.push({
        date: formatDate(from),
        avgRating: prev?.avgRating ?? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)) * 10) / 10,
        negativeRatio: prev?.negativeRatio ?? 0,
      });
      continue;
    }

    const avgRating = Math.round(
      (inBucket.reduce((s, r) => s + r.rating, 0) / inBucket.length) * 10
    ) / 10;

    const negCount = inBucket.filter(
      (r) => classifySentiment(r.rating, r.text) === "negative"
    ).length;
    const negativeRatio = Math.round((negCount / inBucket.length) * 100);

    results.push({ date: formatDate(from), avgRating, negativeRatio });
  }

  return results;
}

// ── 버킷 시작일 배열 생성 (N개, intervalDays 간격) ──────────────────────────
function makeBuckets(totalDays: number, intervalDays: number): Date[] {
  const buckets: Date[] = [];
  const now = Date.now();
  const bucketCount = Math.floor(totalDays / intervalDays);

  for (let i = bucketCount - 1; i >= 0; i--) {
    const d = new Date(now - (i + 1) * intervalDays * 86400_000);
    d.setHours(0, 0, 0, 0);
    buckets.push(d);
  }
  return buckets;
}

// ── 메인: TrendData 생성 ───────────────────────────────────────────────────
export function buildTrendData(reviews: RawReview[]): TrendData {
  const toTrendPoint = (b: BucketResult): TrendPoint => ({
    date:     b.date,
    rating:   b.avgRating,
    negative: b.negativeRatio,
  });

  // 리뷰가 너무 적으면 빈 버킷이 많아지므로 전체 평균으로 단순 채움
  if (reviews.length < 5) {
    const avgRating = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
    const flat: TrendPoint = { date: "", rating: avgRating, negative: 0 };
    return { "7d": [flat], "30d": [flat], "90d": [flat] };
  }

  return {
    "7d":  bucketReviews(reviews, makeBuckets(7,  1)).map(toTrendPoint),
    "30d": bucketReviews(reviews, makeBuckets(30, 5)).map(toTrendPoint),
    "90d": bucketReviews(reviews, makeBuckets(90, 15)).map(toTrendPoint),
  };
}
