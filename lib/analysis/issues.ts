/**
 * lib/analysis/issues.ts
 *
 * 실제 토픽 데이터에서 최근 부정 이슈 3개 추출.
 *
 * 기준:
 *   - 부정 비율이 높고 (negative % 기준)
 *   - 언급량이 많은 토픽
 *   - trend가 "up"인 것 우선
 *
 * 📌 교체 포인트:
 *   description 문구를 Claude API로 자동 생성하면
 *   더 자연스러운 이슈 설명이 가능합니다.
 *   현재는 규칙 기반 템플릿 문구를 사용합니다.
 */

import { NegativeIssue, Topic } from "@/types";

// ── 토픽별 이슈 설명 템플릿 ───────────────────────────────────────────────
const ISSUE_TEMPLATES: Record<string, (topic: Topic) => string> = {
  "로그인":    (t) => `'로그인이 안 된다', '인증 오류' 관련 불만이 최근 ${t.count}건 언급됐습니다. 부정 비율 ${t.negative}%.`,
  "송금":      (t) => `'송금', '이체' 관련 문제가 ${t.count}건 보고됐습니다. 부정 비율 ${t.negative}%.`,
  "속도":      (t) => `'느리다', '렉', '버벅임' 관련 불만이 ${t.count}건 언급됐습니다. 부정 비율 ${t.negative}%.`,
  "UI/디자인": (t) => `UI/디자인 관련 언급이 ${t.count}건이며, 부정 비율은 ${t.negative}%입니다.`,
  "알림":      (t) => `'알림이 안 온다'는 불만이 ${t.count}건 반복되고 있습니다. 부정 비율 ${t.negative}%.`,
  "보안":      (t) => `보안 관련 불만이 ${t.count}건 언급됐습니다. 부정 비율 ${t.negative}%.`,
  "결제":      (t) => `'결제가 안 된다', '카드 오류' 관련 불만이 ${t.count}건 발생했습니다. 부정 비율 ${t.negative}%.`,
  "오류/버그":  (t) => `앱 오류, 버그, 튕김 관련 불만이 ${t.count}건 보고됐습니다. 부정 비율 ${t.negative}%.`,
};

const DEFAULT_TEMPLATE = (t: Topic) =>
  `'${t.name}' 관련 불만이 ${t.count}건 언급됐습니다. 부정 비율 ${t.negative}%.`;

// ── 이슈 제목 포맷 ─────────────────────────────────────────────────────────
function issueTitle(topic: Topic): string {
  const trendLabel = topic.trend === "up" ? " 급증" : topic.trend === "down" ? " 완화" : "";
  return `${topic.name} 관련 불만${trendLabel}`;
}

// ── 메인: 부정 이슈 추출 ──────────────────────────────────────────────────
export function extractNegativeIssues(topics: Topic[]): NegativeIssue[] {
  // 최소 언급 수 이상 + 부정 비율 30% 이상 토픽만 이슈로 분류
  const MIN_COUNT    = 3;
  const MIN_NEGATIVE = 30;

  const candidates = topics.filter(
    (t) => t.count >= MIN_COUNT && t.negative >= MIN_NEGATIVE
  );

  // 정렬: trend "up" 우선, 그다음 부정 비율 높은 순
  const sorted = [...candidates].sort((a, b) => {
    const trendScore = (t: Topic) =>
      t.trend === "up" ? 2 : t.trend === "stable" ? 1 : 0;
    const diff = trendScore(b) - trendScore(a);
    return diff !== 0 ? diff : b.negative - a.negative;
  });

  return sorted.slice(0, 3).map((t): NegativeIssue => ({
    title:       issueTitle(t),
    description: (ISSUE_TEMPLATES[t.name] ?? DEFAULT_TEMPLATE)(t),
    count:       t.count,
    trend:       t.trend,
  }));
}
