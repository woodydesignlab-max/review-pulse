/**
 * scripts/test-app-store.ts
 *
 * App Store 어댑터 단독 테스트 스크립트.
 *
 * 사용법:
 *   npx tsx scripts/test-app-store.ts [앱스토어URL 또는 APP_ID]
 *
 * 예시:
 *   npx tsx scripts/test-app-store.ts 1460766549
 *   npx tsx scripts/test-app-store.ts https://apps.apple.com/kr/app/toss/id839333328
 */

import { AppStoreAdapter } from "../lib/adapters/app-store";

// ── APP_ID 파싱 ──────────────────────────────────────────────────────────
function parseAppId(input: string): string | null {
  // 숫자만 → 그대로 사용
  if (/^\d+$/.test(input.trim())) return input.trim();
  // URL → /id{숫자} 추출
  const match = input.match(/\/id(\d+)/);
  return match ? match[1] : null;
}

// ── 색상 출력 헬퍼 ──────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};
const star = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

// ── 메인 ─────────────────────────────────────────────────────────────────
async function main() {
  const rawInput = process.argv[2] ?? "839333328"; // 기본값: 토스
  const appId = parseAppId(rawInput);

  if (!appId) {
    console.error(`${C.red}❌ 앱 ID를 파싱할 수 없습니다: "${rawInput}"${C.reset}`);
    console.error(`   숫자 ID 또는 App Store URL을 입력하세요.`);
    process.exit(1);
  }

  console.log(`\n${C.bold}${C.cyan}🍎 App Store 어댑터 테스트${C.reset}`);
  console.log(`${C.gray}APP_ID: ${appId}${C.reset}\n`);

  const adapter = new AppStoreAdapter();

  console.log(`⏳ 수집 중...`);
  const start = Date.now();

  try {
    const result = await adapter.fetch(appId);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // ── 앱 정보 ──────────────────────────────────────────────────────
    const { appInfo, reviews, stats } = result;
    console.log(`\n${C.bold}📱 앱 정보${C.reset}`);
    console.log(`  이름:      ${C.bold}${appInfo.name}${C.reset}`);
    console.log(`  개발사:    ${appInfo.developer}`);
    console.log(`  카테고리:  ${appInfo.category}`);
    if (appInfo.avgRating)    console.log(`  평균 별점: ${star(Math.round(appInfo.avgRating))} (${appInfo.avgRating.toFixed(1)})`);
    if (appInfo.totalRatings) console.log(`  전체 평가: ${appInfo.totalRatings.toLocaleString()}개`);
    console.log(`  URL:       ${C.gray}${appInfo.url}${C.reset}`);

    // ── 수집 통계 ────────────────────────────────────────────────────
    console.log(`\n${C.bold}📊 수집 결과${C.reset}`);
    console.log(`  수집 리뷰: ${C.green}${stats.totalUnique}개${C.reset}`);
    console.log(`  소요 시간: ${elapsed}초`);

    if (reviews.length === 0) {
      console.log(`\n${C.yellow}⚠️  수집된 리뷰가 없습니다.${C.reset}`);
      return;
    }

    // ── 별점 분포 ────────────────────────────────────────────────────
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) dist[Math.round(r.rating)]++;
    const total = reviews.length;

    console.log(`\n${C.bold}⭐ 별점 분포${C.reset}`);
    for (let s = 5; s >= 1; s--) {
      const cnt = dist[s];
      const pct = Math.round((cnt / total) * 100);
      const bar = "█".repeat(Math.round(pct / 3)).padEnd(34);
      const color = s >= 4 ? C.green : s === 3 ? C.yellow : C.red;
      console.log(`  ${s}★  ${color}${bar}${C.reset} ${pct}% (${cnt}개)`);
    }

    // ── 최신 리뷰 5개 미리보기 ──────────────────────────────────────
    console.log(`\n${C.bold}📝 최신 리뷰 미리보기 (최대 5개)${C.reset}`);
    const preview = [...reviews]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    for (const r of preview) {
      const ratingColor = r.rating >= 4 ? C.green : r.rating <= 2 ? C.red : C.yellow;
      console.log(`\n  ${ratingColor}${star(r.rating)}${C.reset}  ${C.gray}${r.date.toISOString().slice(0, 10)}${C.reset}  ${r.author}`);
      const text = r.text.length > 120 ? r.text.slice(0, 120) + "…" : r.text;
      console.log(`  ${C.gray}"${text}"${C.reset}`);
    }

    console.log(`\n${C.green}✅ 테스트 완료${C.reset}\n`);

  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\n${C.red}❌ 수집 실패 (${elapsed}초)${C.reset}`);
    console.error(err);
    process.exit(1);
  }
}

main();
