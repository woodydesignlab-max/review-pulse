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
// "apps.apple.com" 포함 시 무조건 App Store로 분기
function detectStoreType(url: string): "google_play" | "app_store" | null {
  if (url.includes("apps.apple.com")) return "app_store";
  if (url.includes("play.google.com/store/apps")) return "google_play";
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
      // https://apps.apple.com/kr/app/.../id1460766549
      const match = parsed.pathname.match(/\/id(\d+)/);
      return match ? match[1] : null;
    }
  } catch {
    // URL 파싱 실패
  }
  return null;
}

// ── App Store country 코드 추출 ───────────────────────────────────────────
// https://apps.apple.com/kr/app/... → "kr"
function extractAppStoreCountry(url: string): string {
  const match = url.match(/apps\.apple\.com\/([a-z]{2})\//i);
  return match ? match[1].toLowerCase() : "kr";
}

// ── POST 핸들러 ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    // ── 입력 검증 ──────────────────────────────────────────────────────
    if (!url || typeof url !== "string") {
      return Response.json({ success: false, error: "앱 링크를 입력해주세요." }, { status: 400 });
    }

    const storeType = detectStoreType(url.trim());
    if (!storeType) {
      return Response.json(
        { success: false, error: "Google Play 또는 App Store 링크만 지원합니다." },
        { status: 400 }
      );
    }

    const appId = extractAppId(url.trim(), storeType);
    if (!appId) {
      return Response.json(
        { success: false, error: "앱 ID를 추출할 수 없습니다. 링크를 확인해주세요." },
        { status: 400 }
      );
    }

    // ── 수집 + 분석 ────────────────────────────────────────────────────
    // App Store는 country 코드를 URL에서 추출해서 options에 전달
    const country = storeType === "app_store"
      ? extractAppStoreCountry(url.trim())
      : "kr";

    console.log(`[route] storeType=${storeType}, appId=${appId}, country=${country}`);

    const { report, source } = await scrape(appId, storeType, { country });

    // 응답: 항상 { success, report, source, store } 구조로 반환
    return Response.json(
      { success: true, report, source, store: storeType },
      { status: 200, headers: { "X-Data-Source": source } }
    );
  } catch (err) {
    console.error("[/api/analyze] Unhandled error:", err);
    return Response.json(
      { success: false, error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
