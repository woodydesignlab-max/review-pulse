/**
 * lib/scraper.ts
 *
 * 어댑터 선택 + 수집 오케스트레이터.
 * route.ts에서 이 함수만 호출하면 됩니다.
 *
 * 흐름:
 *   1. storeType에 맞는 어댑터 선택
 *   2. GOOGLE_PLAY_ENABLED=true 이면 실제 수집 시도
 *   3. 실패하거나 비활성화 상태면 mock fallback
 *   4. builder로 AnalysisReport 조립 후 반환
 */

import { AnalysisReport } from "@/types";
import { StoreAdapter } from "@/lib/adapters/types";
import { buildAnalysisReport } from "@/lib/analysis/builder";

// ── 환경변수 ─────────────────────────────────────────────────────────────
// .env.local 에 GOOGLE_PLAY_ENABLED=true 를 추가하면 실제 수집 활성화
const GOOGLE_PLAY_ENABLED = process.env.GOOGLE_PLAY_ENABLED === "true";

// ── 어댑터 레지스트리 ─────────────────────────────────────────────────────
// 📌 새로운 스토어 추가 시 여기에 등록
async function getAdapter(storeType: "google_play" | "app_store"): Promise<StoreAdapter | null> {
  if (storeType === "google_play") {
    const { googlePlayAdapter } = await import("@/lib/adapters/google-play");
    return googlePlayAdapter;
  }
  // 📌 App Store 어댑터 추가 예정
  // if (storeType === "app_store") {
  //   const { appStoreAdapter } = await import("@/lib/adapters/app-store");
  //   return appStoreAdapter;
  // }
  return null;
}

// ── mock 템플릿 로드 ──────────────────────────────────────────────────────
async function loadMockTemplate(): Promise<AnalysisReport> {
  const { getMockAnalysis } = await import("@/data/mock-data");
  return getMockAnalysis();
}

// ── 메인 함수 ─────────────────────────────────────────────────────────────
/**
 * URL에서 앱 ID를 추출하고, 적절한 어댑터로 수집 후 AnalysisReport 반환.
 * 실패 시 mock fallback.
 */
export async function scrape(
  appId: string,
  storeType: "google_play" | "app_store"
): Promise<{ report: AnalysisReport; source: "real" | "mock" }> {
  const mockTemplate = await loadMockTemplate();

  // ── 실제 수집 시도 ───────────────────────────────────────────────────
  const isEnabled =
    storeType === "google_play" ? GOOGLE_PLAY_ENABLED : false; // App Store는 아직 비활성

  if (isEnabled) {
    try {
      const adapter = await getAdapter(storeType);
      if (!adapter) throw new Error(`${storeType} 어댑터가 없습니다.`);

      console.log(`[scraper] 실제 수집 시작: ${storeType} / ${appId}`);
      const result = await adapter.fetch(appId, {
        newestCount: 250,
        ratingCount: 150,
        language: "ko",
        country: "kr",
      });
      console.log(
        `[scraper] 수집 완료: ${result.reviews.length}개 리뷰 ` +
        `(newest=${result.stats.newestFetched}, rating=${result.stats.ratingFetched}, unique=${result.stats.totalUnique})`
      );

      const report = buildAnalysisReport(result, mockTemplate);
      return { report, source: "real" };
    } catch (err) {
      // 📌 실제 수집 실패 → mock fallback
      // 운영 환경에서는 에러 모니터링 서비스에 리포트하세요.
      console.warn(`[scraper] 실제 수집 실패, mock fallback으로 전환:`, err);
    }
  } else {
    console.log(
      `[scraper] 실제 수집 비활성 (${storeType}). mock 반환. ` +
      `활성화하려면 .env.local에 GOOGLE_PLAY_ENABLED=true 추가`
    );
  }

  // ── Mock fallback ────────────────────────────────────────────────────
  return { report: mockTemplate, source: "mock" };
}
