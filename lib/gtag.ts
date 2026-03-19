/**
 * lib/gtag.ts
 * GA4 이벤트 헬퍼 + window.gtag 타입 선언
 */

export const GA_ID = "G-Y8N7MD4ERX";

// window.gtag 타입 선언 — TypeScript 에러 방지
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

// 이벤트 전송 헬퍼
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
