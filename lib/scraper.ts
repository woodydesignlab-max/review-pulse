/**
 * lib/scraper.ts
 *
 * 어댑터 선택 + 수집 오케스트레이터.
 * route.ts에서 이 함수만 호출하면 됩니다.
 *
 * ⚠️  환경변수는 반드시 함수 실행 시점에 읽어야 합니다.
 *     모듈 최상단에서 읽으면 Next.js 빌드 시 undefined로 인라인될 수 있습니다.
 */

import { AnalysisReport } from "@/types";
import { StoreAdapter } from "@/lib/adapters/types";
import { buildAnalysisReport } from "@/lib/analysis/builder";

// ── 어댑터 레지스트리 ─────────────────────────────────────────────────────
async function getAdapter(storeType: "google_play" | "app_store"): Promise<StoreAdapter | null> {
  if (storeType === "google_play") {
    const { googlePlayAdapter } = await import("@/lib/adapters/google-play");
    return googlePlayAdapter;
  }
  if (storeType === "app_store") {
    const { appStoreAdapter } = await import("@/lib/adapters/app-store");
    return appStoreAdapter;
  }
  return null;
}

// ── mock 템플릿 로드 ──────────────────────────────────────────────────────
async function loadMockTemplate(): Promise<AnalysisReport> {
  const { getMockAnalysis } = await import("@/data/mock-data");
  return getMockAnalysis();
}

// ── 메인 함수 ─────────────────────────────────────────────────────────────
export async function scrape(
  appId: string,
  storeType: "google_play" | "app_store",
  extraOptions?: { country?: string }
): Promise<{ report: AnalysisReport; source: "real" | "mock"; mockReason?: string }> {
  // ⚠️  env는 요청 시점에 읽어야 합니다 (빌드 타임 인라인 방지)
  const GOOGLE_PLAY_ENABLED = process.env.GOOGLE_PLAY_ENABLED === "true";
  const APP_STORE_ENABLED   = process.env.APP_STORE_ENABLED   === "true";

  console.log(`[scraper] ── 요청 시작 ──────────────────────────────────────`);
  console.log(`[scraper] storeType=${storeType}, appId=${appId}, country=${extraOptions?.country ?? "kr"}`);
  console.log(`[scraper] env: GOOGLE_PLAY_ENABLED=${GOOGLE_PLAY_ENABLED}, APP_STORE_ENABLED=${APP_STORE_ENABLED}`);
  console.log(`[scraper] raw env: GOOGLE_PLAY_ENABLED="${process.env.GOOGLE_PLAY_ENABLED}", APP_STORE_ENABLED="${process.env.APP_STORE_ENABLED}"`);

  const mockTemplate = await loadMockTemplate();

  // ── 활성화 여부 판단 ─────────────────────────────────────────────────
  const isEnabled =
    storeType === "google_play" ? GOOGLE_PLAY_ENABLED :
    storeType === "app_store"   ? APP_STORE_ENABLED   : false;

  if (!isEnabled) {
    const envKey = storeType === "google_play" ? "GOOGLE_PLAY_ENABLED" : "APP_STORE_ENABLED";
    const reason = `${envKey} 환경변수가 설정되지 않았거나 "true"가 아닙니다 (현재값: "${process.env[envKey] ?? "undefined"}")`;
    console.warn(`[scraper] ⚠️  실제 수집 비활성 — ${reason}`);
    console.warn(`[scraper]    → mock fallback 반환. 배포 서버에 ${envKey}=true 추가 필요`);
    return { report: patchMockStore(mockTemplate, storeType), source: "mock", mockReason: reason };
  }

  // ── 실제 수집 시도 ───────────────────────────────────────────────────
  try {
    const adapter = await getAdapter(storeType);
    if (!adapter) {
      const reason = `${storeType} 어댑터를 찾을 수 없습니다`;
      console.error(`[scraper] ❌ ${reason}`);
      return { report: patchMockStore(mockTemplate, storeType), source: "mock", mockReason: reason };
    }

    console.log(`[scraper] ✅ 실제 수집 시작: ${storeType} / ${appId}`);
    const result = await adapter.fetch(appId, {
      newestCount: 250,
      ratingCount: 150,
      language: "ko",
      country: extraOptions?.country ?? "kr",
    });

    console.log(
      `[scraper] ✅ 수집 완료: ${result.reviews.length}개 리뷰` +
      ` (newest=${result.stats.newestFetched}, unique=${result.stats.totalUnique})`
    );

    const report = buildAnalysisReport(result, mockTemplate);
    return { report, source: "real" };

  } catch (err) {
    const reason = `어댑터 실행 중 오류: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[scraper] ❌ 실제 수집 실패 → mock fallback:`, err);
    return { report: patchMockStore(mockTemplate, storeType), source: "mock", mockReason: reason };
  }
}

// ── mock 데이터 store 레이블 보정 ────────────────────────────────────────
function patchMockStore(mock: AnalysisReport, storeType: "google_play" | "app_store"): AnalysisReport {
  const storeLabel = storeType === "app_store" ? "App Store" : "Google Play";
  return { ...mock, app: { ...mock.app, store: storeLabel } };
}
