/**
 * lib/analysis/topics.ts
 *
 * 한국어 키워드 맵 기반 토픽 추출.
 *
 * 방식:
 *   - 토픽별 키워드 사전을 정의
 *   - 각 리뷰 텍스트에서 키워드를 매칭해 토픽 귀속
 *   - 토픽별 긍정/중립/부정 비율 계산
 *   - 최근 15일 vs 이전 15일 비교로 trend 계산
 *
 * 📌 교체 포인트:
 *   TOPIC_MAP을 늘리거나, extractTopics() 함수 내부를
 *   임베딩 기반 클러스터링 또는 Claude API 호출로 교체하면
 *   더 정확한 토픽 추출이 가능합니다.
 */

import { Topic } from "@/types";
import { RawReview } from "@/lib/adapters/types";
import { SentimentLabel } from "./sentiment";

// ── 토픽 키워드 사전 ──────────────────────────────────────────────────────
// 각 토픽에 속하는 한국어 키워드 목록.
// 키워드가 리뷰 텍스트에 포함되면 해당 토픽으로 분류.
export const TOPIC_MAP: Record<string, string[]> = {
  "로그인":    ["로그인", "로그아웃", "비밀번호", "비번", "본인인증", "인증번호", "핀번호", "핀", "패스워드", "비밀 번호"],
  "송금":      ["송금", "이체", "계좌", "입금", "출금", "송금이", "송금을", "이체가", "계좌번호"],
  "속도":      ["느리", "렉", "버벅", "로딩", "느립", "빠르", "속도", "오래걸", "느려", "버벅임", "버벅거"],
  "UI/디자인": ["디자인", "화면", "인터페이스", "깔끔", "레이아웃", "ui", "ux", "가독성", "폰트", "색상", "배너"],
  "알림":      ["알림", "푸시", "통지", "알림이", "알림을", "알림 안", "push", "알람"],
  "보안":      ["보안", "해킹", "안전", "지문", "생체", "보안카드", "공인인증", "인증서"],
  "결제":      ["결제", "카드", "페이", "충전", "결제가", "결제를", "결제 안", "카드 등록"],
  "오류/버그":  ["오류", "에러", "버그", "먹통", "튕김", "다운", "안됨", "안 됨", "작동", "실행이", "안열"],
};

// ── 리뷰 하나에서 매칭되는 토픽 목록 추출 ─────────────────────────────────
function matchTopics(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(TOPIC_MAP)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([topicName]) => topicName);
}

// ── trend 계산: 최근 절반 기간 vs 이전 절반 기간 언급량 비교 ────────────────
function computeTrend(
  recentCount: number,
  prevCount: number
): Topic["trend"] {
  if (prevCount === 0) return recentCount > 0 ? "up" : "stable";
  const change = (recentCount - prevCount) / prevCount;
  if (change > 0.2)  return "up";
  if (change < -0.2) return "down";
  return "stable";
}

// ── 메인: 토픽 추출 ───────────────────────────────────────────────────────
export function extractTopics(
  reviews: RawReview[],
  sentimentLabels: Map<string, SentimentLabel>
): Topic[] {
  if (reviews.length === 0) return [];

  // 기간 기준점: 전체 수집 기간의 절반 나누기
  const dates = reviews.map((r) => r.date.getTime());
  const midpoint = (Math.max(...dates) + Math.min(...dates)) / 2;

  // 토픽별 집계 구조 초기화
  const stats: Record<string, {
    total: number; pos: number; neu: number; neg: number;
    recentCount: number; prevCount: number;
  }> = {};
  for (const name of Object.keys(TOPIC_MAP)) {
    stats[name] = { total: 0, pos: 0, neu: 0, neg: 0, recentCount: 0, prevCount: 0 };
  }

  // 리뷰별 토픽 매칭 + 감성 집계
  for (const review of reviews) {
    const matched = matchTopics(review.text);
    if (matched.length === 0) continue;

    const label = sentimentLabels.get(review.id) ?? "neutral";
    const isRecent = review.date.getTime() >= midpoint;

    for (const topicName of matched) {
      const s = stats[topicName];
      s.total++;
      if (label === "positive") s.pos++;
      else if (label === "neutral") s.neu++;
      else s.neg++;
      if (isRecent) s.recentCount++;
      else s.prevCount++;
    }
  }

  // Topic[] 형태로 변환, 언급 수 0인 토픽 제외, 언급 많은 순 정렬
  return Object.entries(stats)
    .filter(([, s]) => s.total > 0)
    .map(([name, s]): Topic => {
      const total = s.total || 1;
      const positive = Math.round((s.pos / total) * 100);
      const negative = Math.round((s.neg / total) * 100);
      const neutral  = 100 - positive - negative;
      return {
        name,
        count: s.total,
        positive,
        negative,
        neutral: Math.max(0, neutral),
        trend: computeTrend(s.recentCount, s.prevCount),
      };
    })
    .sort((a, b) => b.count - a.count);
}
