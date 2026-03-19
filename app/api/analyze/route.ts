/**
 * app/api/analyze/route.ts
 *
 * POST /api/analyze
 * Body: { url: string }
 *
 * 흐름:
 *   URL 검증 → 스토어 타입 감지 → 앱 ID 추출 → scraper 호출 → 결과 반환
 */

import { scrape } from "@/lib/scraper";

// ── 스토어 타입 감지 ──────────────────────────────────────────────────────
function detectStoreType(url: string): "google_play" | "app_store" | null {
  if (url.includes("play.google.com/store/apps")) return "google_play";
  if (url.includes("apps.apple.com")) return "app_store";
  return null;
}

// ── 앱 ID 추출 ────────────────────────────────────────────────────────────
function extractAppId(url: string, storeType: "google_play" | "app_store"): string | null {
  try {
    const parsed = new URL(url);
    if (storeType === "google_play") {
      // https://play.google.com/store/apps/details?id=com.kakaobank.channel
      return parsed.searchParams.get("id");
    }
    if (storeType === "app_store") {
      // https://apps.apple.com/kr/app/toss/id839333328
      const match = parsed.pathname.match(/\/id(\d+)/);
      return match ? match[1] : null;
    }
  } catch {
    // URL 파싱 실패
  }
  return null;
}

// ── POST 핸들러 ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    // ── 입력 검증 ──────────────────────────────────────────────────────
    if (!url || typeof url !== "string") {
      return Response.json({ error: "앱 링크를 입력해주세요." }, { status: 400 });
    }

    const storeType = detectStoreType(url.trim());
    if (!storeType) {
      return Response.json(
        { error: "Google Play 또는 App Store 링크만 지원합니다." },
        { status: 400 }
      );
    }

    const appId = extractAppId(url.trim(), storeType);
    if (!appId) {
      return Response.json(
        { error: "앱 ID를 추출할 수 없습니다. 링크를 확인해주세요." },
        { status: 400 }
      );
    }

    // ── 수집 + 분석 ────────────────────────────────────────────────────
    // scrape() 내부에서:
    //   - GOOGLE_PLAY_ENABLED=true  → 실제 수집 시도 → 실패 시 mock fallback
    //   - GOOGLE_PLAY_ENABLED 없음  → 즉시 mock 반환
    const { report, source } = await scrape(appId, storeType);

    // 응답 헤더에 데이터 출처 표시 (개발 중 디버깅용)
    return Response.json(report, {
      status: 200,
      headers: { "X-Data-Source": source },
    });
  } catch (err) {
    console.error("[/api/analyze] Unhandled error:", err);
    return Response.json(
      { error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
