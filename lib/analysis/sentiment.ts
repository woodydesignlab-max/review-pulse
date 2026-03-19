/**
 * lib/analysis/sentiment.ts
 *
 * 규칙 기반 한국어 감성 분석.
 *
 * 분류 방식:
 *   1차) 별점 기반 (가장 신뢰도 높음)
 *       - 4~5점 → positive (기본)
 *       - 3점   → 키워드로 판단
 *       - 1~2점 → negative (기본)
 *   2차) 부정 키워드 보정
 *       - 4~5점이라도 부정 키워드 다수 → neutral
 *
 * 📌 교체 포인트:
 *   이 파일의 classifySentiment() 함수를 Claude API 또는
 *   외부 NLP 모델 호출로 교체하면 정확도가 크게 향상됩니다.
 *   함수 시그니처(입력/출력)는 유지하세요.
 */

import { RawReview } from "@/lib/adapters/types";

export type SentimentLabel = "positive" | "neutral" | "negative";

// ── 한국어 감성 키워드 사전 ────────────────────────────────────────────────
const NEGATIVE_KEYWORDS = [
  "안됨", "안 됨", "안되", "안돼", "안됩니다", "안 됩니다",
  "오류", "에러", "버그", "오류가", "에러가",
  "느리", "느립", "렉", "버벅", "로딩이", "느려",
  "불편", "최악", "별로", "실망", "불만",
  "환불", "삭제", "짜증", "화남", "화가",
  "고쳐", "먹통", "튕김", "다운", "죽어",
  "못쓰", "답답", "어이없", "황당",
  "대기", "대기자", "기다려", "안 된다", "안된다",
  "작동안", "작동 안", "접속이", "접속안",
  "이상해", "이상합니다", "이상하게",
  "망함", "쓰레기", "개빡", "빡치",
];

const POSITIVE_KEYWORDS = [
  "좋아", "좋네", "좋습니다", "좋고", "좋은",
  "편해", "편합니다", "편리", "편하고",
  "빠르다", "빠릅니다", "빠르고", "빠른",
  "훌륭", "최고", "만족", "감사", "칭찬",
  "추천", "유용", "쉽고", "쉽습니다", "쉬운",
  "깔끔", "간편", "완벽", "훌륭합니다",
  "잘됩니다", "잘 됩니다", "잘되네", "잘되고",
  "사용하기", "편의성", "신뢰", "안전해",
];

// ── 단일 리뷰 감성 분류 ───────────────────────────────────────────────────
export function classifySentiment(rating: number, text: string): SentimentLabel {
  const lowerText = text.toLowerCase();

  const negCount = NEGATIVE_KEYWORDS.filter((kw) => lowerText.includes(kw)).length;
  const posCount = POSITIVE_KEYWORDS.filter((kw) => lowerText.includes(kw)).length;

  // 1~2점: 기본 negative. 단 positive 키워드가 훨씬 많으면 neutral
  if (rating <= 2) {
    return posCount >= 3 && posCount > negCount * 2 ? "neutral" : "negative";
  }

  // 4~5점: 기본 positive. 단 부정 키워드가 많으면 neutral로 조정
  if (rating >= 4) {
    return negCount >= 2 ? "neutral" : "positive";
  }

  // 3점: 키워드로 결정
  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

// ── 배치 감성 분석 ────────────────────────────────────────────────────────
export interface SentimentResult {
  positiveRatio: number;
  neutralRatio:  number;
  negativeRatio: number;
  /** 리뷰 ID → 감성 레이블 (topics.ts, issues.ts 에서 재사용) */
  labels: Map<string, SentimentLabel>;
}

export function analyzeSentiment(reviews: RawReview[]): SentimentResult {
  if (reviews.length === 0) {
    return { positiveRatio: 0, neutralRatio: 0, negativeRatio: 0, labels: new Map() };
  }

  const labels = new Map<string, SentimentLabel>();
  let pos = 0, neu = 0, neg = 0;

  for (const r of reviews) {
    const label = classifySentiment(r.rating, r.text);
    labels.set(r.id, label);
    if (label === "positive") pos++;
    else if (label === "neutral") neu++;
    else neg++;
  }

  const total = reviews.length;
  // 합계가 100이 되도록 마지막 값 보정
  const positiveRatio = Math.round((pos / total) * 100);
  const negativeRatio = Math.round((neg / total) * 100);
  const neutralRatio  = 100 - positiveRatio - negativeRatio;

  return { positiveRatio, neutralRatio: Math.max(0, neutralRatio), negativeRatio, labels };
}
