/**
 * lib/analysis/insights.ts
 *
 * 실제 분석 결과를 기반으로 인사이트 텍스트 생성.
 * 현재는 템플릿 + 실제 데이터 조합 방식 (규칙 기반).
 *
 * 📌 교체 포인트:
 *   generateInsights() 함수 전체를 Claude API 호출로 교체하면
 *   자연스럽고 맥락 있는 문장 생성이 가능합니다.
 *   입력 인터페이스(InsightInput)는 유지하세요.
 *
 *   교체 예시:
 *   ```
 *   const prompt = buildPrompt(input);
 *   const response = await anthropic.messages.create({ ... });
 *   return parseInsightsFromResponse(response);
 *   ```
 */

import { Insights, Topic } from "@/types";

export interface InsightInput {
  totalReviews:   number;
  positiveRatio:  number;
  neutralRatio:   number;
  negativeRatio:  number;
  avgRating:      number;
  topics:         Topic[];
}

// ── 상위 N개 토픽 이름 추출 (조건 필터 적용) ──────────────────────────────
function topTopicNames(
  topics: Topic[],
  filter: (t: Topic) => boolean,
  n = 3
): string[] {
  return topics
    .filter(filter)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map((t) => t.name);
}

// ── 메인: 인사이트 생성 ──────────────────────────────────────────────────
export function generateInsights(input: InsightInput): Insights {
  const { totalReviews, positiveRatio, negativeRatio, avgRating, topics } = input;

  // 상위 부정/긍정 토픽
  const negTopics = topTopicNames(topics, (t) => t.negative >= 40);
  const posTopics = topTopicNames(topics, (t) => t.positive >= 50);
  const risingTopics = topics
    .filter((t) => t.trend === "up" && t.negative >= 40)
    .slice(0, 2)
    .map((t) => t.name);

  // ── 전체 요약 ────────────────────────────────────────────────────────
  const summary = buildSummary({ totalReviews, positiveRatio, negativeRatio, avgRating, negTopics, posTopics });

  // ── 긍정 포인트 ──────────────────────────────────────────────────────
  const positivePoints: string[] = posTopics.length > 0
    ? posTopics.map((name) => {
        const t = topics.find((x) => x.name === name);
        return `${name} 만족도 높음 (긍정 ${t?.positive ?? "?"}%)`;
      })
    : ["전반적인 앱 사용 경험 긍정 평가"];

  if (positivePoints.length < 3) {
    positivePoints.push(`평균 별점 ${avgRating}점 유지`);
    if (positivePoints.length < 3)
      positivePoints.push(`긍정 리뷰 비율 ${positiveRatio}% 수준`);
  }

  // ── 개선 필요 포인트 ─────────────────────────────────────────────────
  const negativePoints: string[] = negTopics.length > 0
    ? negTopics.map((name) => {
        const t = topics.find((x) => x.name === name);
        return `${name} 관련 불만 집중 (부정 ${t?.negative ?? "?"}%)`;
      })
    : ["전반적인 안정성 개선 필요"];

  if (negativePoints.length < 3) {
    negativePoints.push(`부정 리뷰 비율 ${negativeRatio}% — 개선 검토 필요`);
  }

  // ── 액션 아이템 ──────────────────────────────────────────────────────
  const actions = buildActions({ negTopics, risingTopics, negativeRatio });

  return { summary, positivePoints, negativePoints, actions };
}

// ── 요약 문장 생성 ─────────────────────────────────────────────────────────
function buildSummary(p: {
  totalReviews: number; positiveRatio: number; negativeRatio: number;
  avgRating: number; negTopics: string[]; posTopics: string[];
}): string {
  const { totalReviews, positiveRatio, negativeRatio, avgRating, negTopics, posTopics } = p;

  const negPart = negTopics.length > 0
    ? `${negTopics.join(", ")} 관련 불만`
    : "일부 기능 오류";

  const posPart = posTopics.length > 0
    ? `${posTopics.join(", ")} 만족도`
    : "전반적인 편의성";

  return (
    `수집된 ${totalReviews}개 리뷰(평균 ${avgRating}점) 분석 결과, ` +
    `${negPart}이 주요 이슈로 나타났습니다. ` +
    `반면 ${posPart}은 긍정 반응을 받고 있습니다. ` +
    `부정 리뷰 비율은 ${negativeRatio}%, 긍정은 ${positiveRatio}%입니다.`
  );
}

// ── 액션 아이템 생성 ──────────────────────────────────────────────────────
function buildActions(p: {
  negTopics: string[];
  risingTopics: string[];
  negativeRatio: number;
}): string[] {
  const { negTopics, risingTopics, negativeRatio } = p;

  const actions: string[] = [];

  // 급증 토픽 최우선
  for (const name of risingTopics.slice(0, 2)) {
    actions.push(`${name} 관련 이슈 긴급 점검 (최근 급증)`);
  }

  // 상위 부정 토픽
  for (const name of negTopics) {
    if (!risingTopics.includes(name)) {
      actions.push(`${name} 플로우 개선 검토`);
    }
    if (actions.length >= 3) break;
  }

  // 부족하면 일반 권고
  if (actions.length === 0 || negativeRatio < 20) {
    actions.push("현 수준 유지 및 정기 리뷰 모니터링");
  }
  if (actions.length < 3) {
    actions.push("주요 부정 리뷰 원인 추가 분석 권장");
  }
  if (actions.length < 3) {
    actions.push("최근 업데이트 전후 별점 변화 추이 확인");
  }

  return actions.slice(0, 3);
}
