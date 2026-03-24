"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/gtag";

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const validateUrl = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return "앱 링크를 입력해주세요.";

    // URL 형식 자체가 아닌 경우
    try { new URL(trimmed); } catch {
      return "올바른 URL 형식이 아닙니다. http:// 또는 https://로 시작하는 링크를 붙여넣으세요.";
    }

    if (trimmed.includes("play.google.com/store/apps")) return null; // valid
    if (trimmed.includes("apps.apple.com")) return null; // valid

    // 다른 도메인인 경우 힌트 포함
    if (trimmed.includes("google.com") || trimmed.includes("play.google.com")) {
      return "Google Play 앱 페이지 링크를 입력해주세요. (예: play.google.com/store/apps/details?id=...)";
    }
    if (trimmed.includes("apple.com")) {
      return "App Store 앱 페이지 링크를 입력해주세요. (예: apps.apple.com/app/...)";
    }
    return "Google Play 또는 App Store 앱 링크만 지원합니다.";
  };

  const handleAnalyze = () => {
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    trackEvent("analyze_click", { app_id: url.trim() });
    router.push(`/loading?url=${encodeURIComponent(url.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const exampleApps = [
    {
      name: "카카오뱅크",
      url: "https://play.google.com/store/apps/details?id=com.kakaobank.channel",
      store: "Google Play",
    },
    {
      name: "토스",
      url: "https://play.google.com/store/apps/details?id=viva.republica.toss",
      store: "Google Play",
    },
    {
      name: "토스 (iOS)",
      url: "https://apps.apple.com/kr/app/%ED%86%A0%EC%8A%A4/id839333328",
      store: "App Store",
    },
    {
      name: "카카오뱅크 (iOS)",
      url: "https://apps.apple.com/kr/app/%EC%B9%B4%EC%B9%B4%EC%98%A4%EB%B1%85%ED%81%AC/id1258016944",
      store: "App Store",
    },
  ];

  const features = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L12.3 7.3H18L13.3 10.5L15.1 16L10 12.8L4.9 16L6.7 10.5L2 7.3H7.7L10 2Z" fill="#F59E0B" />
        </svg>
      ),
      title: "별점 분포",
      desc: "1~5점 별점 분포와 평균 별점을 한눈에 파악",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 10C2 10 4 4 10 4C16 4 18 10 18 10C18 10 16 16 10 16C4 16 2 10 2 10Z" stroke="#3182F6" strokeWidth="1.5"/>
          <circle cx="10" cy="10" r="3" fill="#3182F6"/>
        </svg>
      ),
      title: "감성 분석",
      desc: "긍정/중립/부정 비율과 핵심 이슈 토픽 분석",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 15L7 10L11 12L17 6" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "변화 추이",
      desc: "기간별 별점과 감성 변화 흐름을 차트로 확인",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[#EAECF0]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#3182F6] rounded-lg flex items-center justify-center shadow-sm">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 12L6 9L9 11L13 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[16px] font-bold text-[#111827] tracking-tight">
              Review Pulse
            </span>
          </div>
          <span className="text-[13px] text-[#6B7280]">앱 리뷰 분석 도구</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl">
          {/* Title */}
          <div className="mb-10 text-center">
            <p className="text-[12px] font-semibold text-[#3182F6] mb-3 tracking-widest uppercase">
              App Review Analytics
            </p>
            <h1 className="text-[40px] font-bold text-[#111827] leading-tight mb-4 tracking-tight">
              앱 링크 하나로
              <br />
              리뷰를 분석하세요
            </h1>
            <p className="text-[16px] text-[#6B7280] leading-relaxed">
              별점 분포, 감성 분석, 주요 이슈, 최근 변화 추이까지
              <br />
              한 화면에서 확인할 수 있습니다
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            {[
              { value: "48,320개", label: "리뷰 분석 완료" },
              { value: "1,200개", label: "앱 분석" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#E5E7EB] select-none">·</span>}
                <span className="text-[13px] font-semibold text-[#374151]">{stat.value}</span>
                <span className="text-[13px] text-[#9CA3AF]">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="mb-3">
            <div
              className={`flex items-center gap-3 bg-white border-2 rounded-2xl px-4 py-3.5 transition-all ${
                error
                  ? "border-[#EF4444]"
                  : "border-[#E5E7EB] focus-within:border-[#3182F6] focus-within:shadow-[0_0_0_3px_rgba(49,130,246,0.12)]"
              }`}
            >
              <svg
                className="text-[#9CA3AF] shrink-0"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M13 13L17 17M8.5 15A6.5 6.5 0 108.5 2a6.5 6.5 0 000 13z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(""); // 타이핑 시작하면 에러 지우기
                }}
                onKeyDown={handleKeyDown}
                placeholder="Google Play 또는 App Store 링크를 붙여넣으세요"
                className="flex-1 text-[15px] text-[#111827] placeholder-[#9CA3AF] outline-none bg-transparent"
              />
              {url && (
                <button
                  onClick={() => {
                    setUrl("");
                    setError("");
                  }}
                  className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M5 5L13 13M13 5L5 13"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            {error && (
              <p className="mt-2 text-[13px] text-[#EF4444] px-1 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 3V7.5M7 9.5V10M13 7A6 6 0 111 7a6 6 0 0112 0z" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleAnalyze}
            className="w-full bg-[#3182F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white text-[15px] font-semibold rounded-2xl py-4 transition-colors shadow-sm mb-3"
          >
            분석 시작하기
          </button>

          {/* Sample report button — goes through loading so sessionStorage gets populated */}
          <button
            onClick={() => {
              const sampleUrl = "https://play.google.com/store/apps/details?id=com.kakaobank.channel";
              trackEvent("analyze_click", { app_id: sampleUrl, source: "sample_button" });
              router.push(`/loading?url=${encodeURIComponent(sampleUrl)}`);
            }}
            className="flex items-center justify-center gap-2 w-full border border-[#EAECF0] text-[14px] text-[#374151] font-medium rounded-2xl py-3.5 hover:bg-[#F9FAFB] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            샘플 리포트 보기 (카카오뱅크)
          </button>

          {/* Example chips */}
          <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[13px] text-[#9CA3AF]">예시</span>
            {exampleApps.map((app) => (
              <button
                key={app.name}
                onClick={() => {
                  setUrl(app.url);
                  setError("");
                }}
                className={`flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full transition-colors border ${
                  app.store === "App Store"
                    ? "text-[#0071E3] bg-[#F0F7FF] hover:bg-[#DBEAFE] border-[#BFDBFE]"
                    : "text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] border-[#E5E7EB]"
                }`}
              >
                <span className="text-[10px] opacity-60">{app.store === "App Store" ? "🍎" : "▶"}</span>
                {app.name}
              </button>
            ))}
          </div>

          {/* Features */}
          <div className="mt-14 grid grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl p-5 hover:border-[#3182F6] transition-colors group"
              >
                <div className="w-8 h-8 bg-white border border-[#EAECF0] rounded-xl flex items-center justify-center mb-3 group-hover:border-[#3182F6] transition-colors">
                  {f.icon}
                </div>
                <div className="text-[14px] font-semibold text-[#111827] mb-1">{f.title}</div>
                <div className="text-[13px] text-[#6B7280] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-[#EAECF0]">
        <p className="text-[12px] text-[#9CA3AF]">
          Review Pulse · 앱 리뷰 분석 서비스 · MVP v0.2
        </p>
      </footer>
    </div>
  );
}
