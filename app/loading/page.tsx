"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisReport } from "@/types";
import { trackEvent } from "@/lib/gtag";

// Steps to show in UI (purely cosmetic — advance on a timer)
const STEPS = [
  { id: 1, label: "앱 정보 확인 중", duration: 800 },
  { id: 2, label: "리뷰 수집 중", duration: 2000 },
  { id: 3, label: "감성 분석 중", duration: 1500 },
  { id: 4, label: "키워드 추출 중", duration: 1200 },
  { id: 5, label: "리포트 생성 중", duration: 500 },
];

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const decodedUrl = decodeURIComponent(url);

  const [currentStep, setCurrentStep] = useState(0); // 0 = not started
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // URL 파라미터 없이 직접 접근한 경우
    if (!url) {
      setError("분석할 앱 링크가 없습니다. 처음 화면에서 링크를 입력해주세요.");
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Run visual steps in parallel with the API call
    // Steps are purely cosmetic — they advance on a timer
    let stepIndex = 0;
    const advanceStep = () => {
      if (stepIndex >= STEPS.length - 1) return;
      stepIndex++;
      setCurrentStep(stepIndex);
      setTimeout(advanceStep, STEPS[stepIndex].duration);
    };
    setTimeout(advanceStep, STEPS[0].duration);

    // Actual API call
    console.log("[analyze] request start:", decodedUrl);
    console.log("[analyze] detected store:", decodedUrl.includes("apps.apple.com") ? "App Store" : "Google Play");

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: decodedUrl }),
    })
      .then(async (res) => {
        console.log("[analyze] response status:", res.status);
        const json = await res.json() as { success: boolean; report?: AnalysisReport; source?: string; store?: string; error?: string; mockReason?: string };
        console.log("[analyze] response shape — success:", json.success, "| store:", json.store, "| source:", json.source, "| hasReport:", !!json.report);
        if (json.source === "mock" && json.mockReason) {
          console.warn("[analyze] ⚠️  mock fallback 이유:", json.mockReason);
        }
        if (!res.ok || !json.success) {
          return Promise.reject(json.error || "분석 실패");
        }
        return json;
      })
      .then((json) => {
        const data = json.report!;
        console.log("[analyze] success — app:", data.app?.name, "| reviews:", data.summary?.sampleCount);
        trackEvent("analyze_success", {
          app_id: decodedUrl,
          app_name: data.app.name,
          store: data.app.store,
          avg_rating: data.summary.avgRating,
          sample_avg_rating: data.summary.sampleAvgRating,
          sample_count: data.summary.sampleCount,
          negative_ratio: data.summary.negativeRatio,
        });
        // Store result for dashboard to consume
        const serialized = JSON.stringify(data);
        sessionStorage.setItem("analysisResult", serialized);
        sessionStorage.setItem("analysisUrl", decodedUrl);
        sessionStorage.setItem("analysisSource", json.source ?? "unknown");
        if (json.mockReason) {
          sessionStorage.setItem("analysisMockReason", json.mockReason);
        } else {
          sessionStorage.removeItem("analysisMockReason");
        }
        console.log("[analyze] sessionStorage 저장 완료 — bytes:", serialized.length);
        console.log("[analyze] 검증:", {
          hasApp: !!data.app,
          appName: data.app?.name,
          appStore: data.app?.store,
          hasSummary: !!data.summary,
          hasTrendData: !!data.trendData,
          hasInsights: !!data.insights,
        });
        // Ensure all steps complete visually before redirecting
        setCurrentStep(STEPS.length - 1);
        setIsDone(true);
        console.log("[analyze] router.push('/dashboard') 예약 (700ms 후)");
        setTimeout(() => {
          console.log("[analyze] router.push('/dashboard') 실행");
          router.push("/dashboard");
        }, 700);
      })
      .catch((err: unknown) => {
        const msg = typeof err === "string" ? err : "분석 중 오류가 발생했습니다.";
        console.error("[analyze] fail reason:", msg, err);
        setError(msg);
      });
  }, [url, decodedUrl, router]);

  const progress = isDone ? 100 : Math.round(((currentStep) / (STEPS.length - 1)) * 85);

  // Detect store type from URL
  const getStoreType = (u: string): "Google Play" | "App Store" | null => {
    if (u.includes("play.google.com")) return "Google Play";
    if (u.includes("apps.apple.com")) return "App Store";
    return null;
  };

  // Detect app name from URL for display
  const getAppName = (u: string) => {
    if (u.includes("kakaobank")) return "카카오뱅크";
    if (u.includes("toss") || u.includes("viva.republica")) return "토스";
    if (u.includes("baemin") || u.includes("woowa")) return "배달의민족";
    // App Store URL: extract name segment between /app/ and /id
    if (u.includes("apps.apple.com")) {
      const match = u.match(/\/app\/([^/]+)\/id/);
      if (match) return decodeURIComponent(match[1].replace(/-/g, " "));
    }
    return "앱 분석 중";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 bg-[#FEF2F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[#111827] mb-2">분석 실패</h2>
          <p className="text-[14px] text-[#6B7280] mb-6">{error}</p>
          <a href="/" className="inline-block bg-[#3182F6] text-white text-[14px] font-semibold px-6 py-3 rounded-xl">
            다시 시도하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* App info row */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0]">
          <div className="w-12 h-12 bg-[#FDE300] rounded-xl flex items-center justify-center text-xl shrink-0">🏦</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[15px] font-semibold text-[#111827]">{getAppName(decodedUrl)}</div>
              {getStoreType(decodedUrl) && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                  getStoreType(decodedUrl) === "App Store"
                    ? "bg-[#F0F7FF] text-[#0071E3] border-[#BFDBFE]"
                    : "bg-[#F0FDF4] text-[#16A34A] border-[#A7F3D0]"
                }`}>
                  {getStoreType(decodedUrl)}
                </span>
              )}
            </div>
            <div className="text-[12px] text-[#9CA3AF] truncate mt-0.5">{decodedUrl}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-7">
          <div className="flex justify-between mb-2">
            <span className="text-[13px] text-[#6B7280]">분석 중...</span>
            <span className="text-[13px] font-semibold text-[#3182F6]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3182F6] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-2">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep || isDone;
            const isActive = idx === currentStep && !isDone;
            return (
              <div key={step.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-[#EBF3FF]" : ""}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isCompleted ? "bg-[#10B981]" : isActive ? "bg-[#3182F6]" : "bg-[#E5E7EB]"
                }`}>
                  {isCompleted ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : isActive ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : null}
                </div>
                <span className={`text-[14px] ${isCompleted ? "text-[#9CA3AF]" : isActive ? "text-[#3182F6] font-medium" : "text-[#D1D5DB]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {isDone && (
          <p className="mt-5 text-center text-[13px] text-[#10B981] font-medium">✓ 분석 완료 — 대시보드로 이동합니다</p>
        )}
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
