/**
 * lib/gtag.ts
 * GA4 이벤트 헬퍼 + window.gtag 타입 선언
 */

export const GA_ID = "G-Y8N7MD4ERX";

// window.gtag / dataLayer 타입 선언
declare global {
  interface Window {
    gtag: (
      command: "event" | "config" | "js",
      targetId: string | Date,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

/**
 * GA4 이벤트 전송.
 *
 * - window.gtag 가 로드된 경우: gtag('event', ...) 직접 호출
 * - window.gtag 미로드 상태: window.dataLayer 에 push 해서 버퍼링
 *   (gtag.js 가 나중에 로드되면 dataLayer 를 순서대로 소비함)
 *
 * transport_type: 'beacon' — 페이지 이동 직전 이벤트 유실 방지
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  const payload = { event: eventName, ...params };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, {
      transport_type: "beacon",
      ...params,
    });
  } else {
    // gtag.js 아직 미로드 → dataLayer 버퍼링
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    console.warn("[gtag] window.gtag 미로드 — dataLayer에 버퍼링:", payload);
  }
}
