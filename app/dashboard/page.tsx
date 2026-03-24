"use client";

import { useEffect, useState } from "react";
import { AnalysisReport } from "@/types";
import { trackEvent } from "@/lib/gtag";
import Header from "@/components/layout/Header";
import SectionCard from "@/components/layout/SectionCard";
import KpiCard from "@/components/dashboard/KpiCard";
import RatingDistributionChart from "@/components/dashboard/RatingDistributionChart";
import SentimentChart from "@/components/dashboard/SentimentChart";
import TrendChart from "@/components/dashboard/TrendChart";
import TopicCard from "@/components/dashboard/TopicCard";
import ReviewCard from "@/components/dashboard/ReviewCard";
import InsightPanel from "@/components/dashboard/InsightPanel";

type PeriodKey = "7d" | "30d" | "90d";
const periodLabels: Record<PeriodKey, string> = { "7d": "7일", "30d": "30일", "90d": "90일" };

const severityConfig = {
  up:     { bg: "#FEF2F2", border: "#FECACA", iconBg: "#EF4444", badgeText: "#EF4444", badgeBg: "#FEE2E2", badgeLabel: "급증" },
  stable: { bg: "#FFFBEB", border: "#FDE68A", iconBg: "#F59E0B", badgeText: "#92400E", badgeBg: "#FEF3C7", badgeLabel: "유지" },
  down:   { bg: "#F0FDF4", border: "#A7F3D0", iconBg: "#10B981", badgeText: "#065F46", badgeBg: "#D1FAE5", badgeLabel: "완화" },
};

function formatAnalyzedAt(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} 분석`;
  } catch { return iso; }
}

// ── SVG icons for KPI cards ───────────────────────────────────────────
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M7 1L8.8 5.2H13.3L9.8 7.8L11.1 12.3L7 9.7L2.9 12.3L4.2 7.8L0.7 5.2H5.2L7 1Z"/>
  </svg>
);
const IconReviews = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2H2a1 1 0 00-1 1v7a1 1 0 001 1h2l2 2 2-2h4a1 1 0 001-1V3a1 1 0 00-1-1z"/>
  </svg>
);
const IconNegative = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M7 3v4M7 8.5v1M13 7A6 6 0 111 7a6 6 0 0112 0z"/>
  </svg>
);
const IconTrend = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 10l4-4 3 2 5-6"/>
  </svg>
);

export default function DashboardPage() {
  const [data, setData]             = useState<AnalysisReport | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [debugRaw, setDebugRaw]     = useState<string | null>(null);
  const [period, setPeriod]         = useState<PeriodKey>("30d");
  const [isMock, setIsMock]         = useState(false);
  const [mockReason, setMockReason] = useState<string | null>(null);

  useEffect(() => {
    console.log("[dashboard] useEffect 실행");
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem("analysisResult");
    } catch (e) {
      console.error("[dashboard] sessionStorage 접근 실패:", e);
      setError("sessionStorage 접근 실패 — 브라우저 설정 확인");
      return;
    }
    console.log("[dashboard] sessionStorage 결과:", raw ? `${raw.length}자 존재` : "null (비어있음)");
    setDebugRaw(raw);

    if (!raw) {
      console.error("[dashboard] analysisResult 없음 — 에러 화면 표시");
      setError("analysisResult 없음");
      return;
    }
    try {
      const parsed: AnalysisReport = JSON.parse(raw);
      console.log("[dashboard] 파싱 성공 —", {
        app: parsed.app?.name,
        store: parsed.app?.store,
        sampleCount: parsed.summary?.sampleCount,
        hasTrendData: !!parsed.trendData,
        hasInsights: !!parsed.insights,
      });
      setData(parsed);
      const source = sessionStorage.getItem("analysisSource");
      const reason = sessionStorage.getItem("analysisMockReason");
      if (source === "mock") {
        setIsMock(true);
        setMockReason(reason);
        console.warn("[dashboard] ⚠️  mock 데이터 표시 중. 이유:", reason);
      }
      trackEvent("view_result", {
        app_name: parsed.app.name,
        store: parsed.app.store,
        avg_rating: parsed.summary.avgRating,
        sample_avg_rating: parsed.summary.sampleAvgRating,
        negative_ratio: parsed.summary.negativeRatio,
      });
    } catch (e) {
      console.error("[dashboard] JSON.parse 실패:", e, "\nraw 앞 200자:", raw?.slice(0, 200));
      setError(`JSON 파싱 실패: ${e}`);
    }
  }, []);

  // ── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-white border border-[#EAECF0] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[#111827] mb-2">분석 결과가 없어요</h2>
          <p className="text-[14px] text-[#6B7280] leading-relaxed mb-4">
            분석 결과는 분석 완료 직후에만 볼 수 있어요.<br />
            앱 링크를 입력해서 새로 분석을 시작해보세요.
          </p>
          {/* 디버그: 실패 원인 표시 */}
          <p className="text-[11px] text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 mb-4 text-left font-mono break-all">
            원인: {error}
            {debugRaw && <><br />raw: {debugRaw.slice(0, 100)}{debugRaw.length > 100 ? "…" : ""}</>}
            {!debugRaw && <><br />sessionStorage가 비어있음</>}
          </p>
          <a href="/"
            className="inline-flex items-center gap-2 bg-[#3182F6] text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-[#2563EB] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M6 1L1 7L6 13M1 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            처음으로 돌아가기
          </a>
          <p className="mt-4 text-[12px] text-[#D1D5DB]">
            또는{" "}
            <a href="/loading?url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.kakaobank.channel"
              className="text-[#3182F6] hover:underline">
              샘플 리포트 보기
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { app, summary, ratingDistribution, topics, trendData, recentNegativeIssues, insights, representativeReviews } = data;
  const topIssue = recentNegativeIssues[0];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header showBack appName={app.name} />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-5">

        {/* ── [진단용] dev 환경에서만 표시 ─────────────────────── */}
        {process.env.NODE_ENV === "development" && (
          <details className="bg-[#1E1E1E] text-[#D4D4D4] rounded-xl text-[11px] font-mono">
            <summary className="px-4 py-2 cursor-pointer text-[#9CDCFE] select-none">
              🔍 Debug: {app.store} / sampleCount={summary.sampleCount} / source 확인
            </summary>
            <pre className="px-4 pb-4 overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {JSON.stringify({ app, summary: { ...summary }, trendDataKeys: Object.keys(trendData ?? {}) }, null, 2)}
            </pre>
          </details>
        )}

        {/* ── Mock 데이터 경고 배너 ──────────────────────────────────── */}
        {isMock && (
          <div className="flex items-start gap-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-4 py-3">
            <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3L16 15H2L9 3Z" fill="#F59E0B" opacity=".2"/>
              <path d="M9 3L16 15H2L9 3Z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 7.5V10.5M9 12V12.5" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-[#92400E]">샘플 데이터로 표시 중</p>
              <p className="text-[12px] text-[#B45309] mt-0.5">
                실제 리뷰를 수집하지 못해 샘플 데이터를 보여드리고 있어요.
              </p>
              {mockReason && (
                <p className="text-[11px] text-[#92400E] mt-1 font-mono bg-[#FEF3C7] rounded px-2 py-1 break-all">
                  {mockReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── App Info Card ──────────────────────────────────────────── */}
        <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden">
          {/* Blue top accent */}
          <div className="h-1 bg-[#3182F6]" />
          <div className="p-6">
            <div className="flex items-start gap-5 flex-wrap">
              {/* Icon */}
              <div className="w-16 h-16 bg-[#FEF08A] border border-[#FDE68A] rounded-2xl flex items-center justify-center text-3xl shrink-0 select-none">
                🏦
              </div>

              {/* App details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h1 className="text-[20px] font-bold text-[#111827]">{app.name}</h1>
                  <span className="text-[12px] bg-[#F3F4F6] text-[#6B7280] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                    {app.store}
                  </span>
                  <span className="text-[12px] bg-[#EFF6FF] text-[#3182F6] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                    {app.category}
                  </span>
                </div>
                <p className="text-[14px] text-[#6B7280]">{app.developer}</p>

                {/* Inline stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F3F4F6] flex-wrap">
                  {[
                    { label: "전체 평가", value: summary.totalReviews.toLocaleString() + "건" },
                    { label: "분석 샘플", value: summary.sampleCount.toLocaleString() + "건" },
                    { label: "최근 30일", value: summary.recentReviews.toLocaleString() + "건" },
                    { label: "부정 비율", value: summary.negativeRatio + "%" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-[#E5E7EB]">·</span>}
                      <span className="text-[13px] text-[#9CA3AF]">{stat.label}</span>
                      <span className="text-[13px] font-semibold text-[#374151]">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating display */}
              <div className="text-right shrink-0">
                {/* Official rating — big */}
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-[40px] font-bold text-[#111827] leading-none tracking-tight">
                    {summary.avgRating}
                  </span>
                  <span className="text-[18px] text-[#9CA3AF]">/ 5</span>
                </div>
                <div className="flex justify-end gap-0.5 mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="15" height="15" viewBox="0 0 12 12"
                      fill={i < Math.round(summary.avgRating) ? "#F59E0B" : "#E5E7EB"}>
                      <path d="M6 1L7.5 4.5H11L8.5 6.8L9.5 10.5L6 8.3L2.5 10.5L3.5 6.8L1 4.5H4.5L6 1Z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-1">{app.store} 공식 평점</p>

                {/* Sample rating — smaller, separated */}
                <div className="mt-2.5 pt-2.5 border-t border-[#F3F4F6]">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[11px] text-[#9CA3AF]">최근 체감</span>
                    <span className={`text-[15px] font-bold ${
                      summary.sampleAvgRating < summary.avgRating - 0.4
                        ? "text-[#EF4444]"
                        : summary.sampleAvgRating > summary.avgRating + 0.4
                        ? "text-[#10B981]"
                        : "text-[#6B7280]"
                    }`}>
                      {summary.sampleAvgRating}
                    </span>
                    {summary.sampleAvgRating < summary.avgRating - 0.4 && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 9L2 4h8L6 9z" fill="#EF4444"/>
                      </svg>
                    )}
                    {summary.sampleAvgRating > summary.avgRating + 0.4 && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 3L10 8H2L6 3z" fill="#10B981"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-[11px] text-[#B0B8C1] mt-0.5">수집 {summary.sampleCount.toLocaleString()}건 평균</p>
                </div>

                <p className="text-[11px] text-[#D1D5DB] mt-2">{formatAnalyzedAt(data.analyzedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="공식 평균 별점"
            value={summary.avgRating.toString()}
            sub="/ 5.0"
            context={`${app.store} 전체 기간 가중 평균`}
            accent="yellow"
            icon={<IconStar />}
            trend={{ direction: "neutral", label: "공식" }}
          />
          <KpiCard
            label="최근 체감 평점"
            value={summary.sampleAvgRating.toString()}
            sub="/ 5.0"
            context={`수집 ${summary.sampleCount.toLocaleString()}건 단순 평균`}
            accent={summary.sampleAvgRating < summary.avgRating - 0.4 ? "red" : "green"}
            icon={<IconStar />}
            trend={{
              direction: summary.sampleAvgRating < summary.avgRating - 0.4 ? "down" : "up",
              label: summary.sampleAvgRating < summary.avgRating - 0.4 ? "하락" : "양호",
            }}
          />
          <KpiCard
            label="전체 리뷰 수"
            value={summary.totalReviews.toLocaleString()}
            sub="건"
            context={`분석 샘플 ${summary.sampleCount.toLocaleString()}건`}
            accent="blue"
            icon={<IconReviews />}
          />
          <KpiCard
            label="부정 리뷰 비율"
            value={`${summary.negativeRatio}%`}
            sub="of sample"
            context={topIssue ? `최근 급증: ${topIssue.title}` : "수집 샘플 기준"}
            accent="red"
            icon={<IconNegative />}
            trend={{ direction: "up", label: "주의" }}
          />
        </div>

        {/* ── Rating Gap Insight Banner ───────────────────────────────── */}
        {Math.abs(summary.avgRating - summary.sampleAvgRating) >= 0.3 && (() => {
          const gap = (summary.avgRating - summary.sampleAvgRating).toFixed(1);
          const isNeg = summary.sampleAvgRating < summary.avgRating;
          return (
            <div className={`rounded-2xl border px-5 py-4 flex items-start gap-4 ${
              isNeg
                ? "bg-[#FFF7ED] border-[#FED7AA]"
                : "bg-[#F0FDF4] border-[#A7F3D0]"
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isNeg ? "bg-[#F97316]" : "bg-[#10B981]"
              }`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v5M8 10v1.5M14 8A6 6 0 112 8a6 6 0 0112 0z"
                    stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold mb-0.5 ${isNeg ? "text-[#9A3412]" : "text-[#065F46]"}`}>
                  {isNeg
                    ? `공식 평점(${summary.avgRating})보다 최근 체감 평점(${summary.sampleAvgRating})이 ${gap}점 낮아요`
                    : `최근 체감 평점(${summary.sampleAvgRating})이 공식 평점(${summary.avgRating})보다 ${Math.abs(Number(gap)).toFixed(1)}점 높아요`
                  }
                </p>
                <p className={`text-[12px] leading-relaxed ${isNeg ? "text-[#C2410C]" : "text-[#059669]"}`}>
                  {isNeg
                    ? `공식 평점은 출시 이후 전체 평가의 가중 평균이에요. 최근 수집된 ${summary.sampleCount.toLocaleString()}건의 리뷰가 낮은 이유는 최근 불만이 집중됐거나, 특정 이슈가 단기간 급증했기 때문일 수 있어요.`
                    : `최근 수집된 ${summary.sampleCount.toLocaleString()}건의 리뷰 평균이 공식 평점보다 높아요. 최근 사용자 경험이 개선되고 있거나 만족도 높은 사용자층이 리뷰를 남기는 추세일 수 있어요.`
                  }
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Rating Distribution + Sentiment ───────────────────────── */}
        <div className="grid md:grid-cols-5 gap-5">
          <div className="md:col-span-3">
            <SectionCard
              title="별점 분포"
              subtitle={`수집 샘플 ${summary.sampleCount.toLocaleString()}건 기준`}
              badge={`전체 ${summary.totalReviews.toLocaleString()}건`}
            >
              <RatingDistributionChart
                data={ratingDistribution}
                totalReviews={summary.sampleCount}
              />
            </SectionCard>
          </div>
          <div className="md:col-span-2">
            <SectionCard title="감성 분석" subtitle="분석 기준: 최근 30일">
              <SentimentChart
                positive={summary.positiveRatio}
                neutral={summary.neutralRatio}
                negative={summary.negativeRatio}
              />
            </SectionCard>
          </div>
        </div>

        {/* ── Trend Chart ────────────────────────────────────────────── */}
        <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[#111827]">평균 별점 변화 추이</h2>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">분석 기준: 선택 기간</p>
              </div>
              <div className="flex bg-[#F3F4F6] rounded-xl p-1 gap-1">
                {(Object.keys(periodLabels) as PeriodKey[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                      period === p
                        ? "bg-white text-[#111827] shadow-sm"
                        : "text-[#6B7280] hover:text-[#374151]"
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6">
            <TrendChart data={trendData[period]} />
          </div>
        </div>

        {/* ── Topics Grid ────────────────────────────────────────────── */}
        <SectionCard
          title="주요 이슈 토픽"
          subtitle="리뷰에서 가장 많이 언급된 주제"
          badge="최근 30일"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {topics.map((topic, i) => (
              <TopicCard key={topic.name} topic={topic} rank={i + 1} />
            ))}
          </div>
        </SectionCard>

        {/* ── Recent Negative Issues ─────────────────────────────────── */}
        <SectionCard
          title="최근 부정 이슈"
          subtitle="긴급 대응이 필요한 항목"
          badge={`${recentNegativeIssues.length}개 이슈`}
        >
          <div className="space-y-3">
            {recentNegativeIssues.map((issue, i) => {
              const sev = severityConfig[issue.trend];
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl border transition-colors"
                  style={{ background: sev.bg, borderColor: sev.border }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: sev.iconBg }}
                  >
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                      <path d="M7 3V7.5M7 9.5V10M13 7A6 6 0 111 7a6 6 0 0112 0z"
                        stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[14px] font-semibold text-[#111827]">{issue.title}</span>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sev.badgeBg, color: sev.badgeText }}
                      >
                        {sev.badgeLabel}
                      </span>
                      <span className="text-[12px] font-medium text-[#EF4444]">{issue.count}건</span>
                    </div>
                    <p className="text-[13px] text-[#374151] leading-relaxed">{issue.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Insights Panel ─────────────────────────────────────────── */}
        <SectionCard title="인사이트 요약" subtitle="리뷰 데이터 기반 분석 결과" badge="분석 완료">
          <InsightPanel insights={insights} />
        </SectionCard>

        {/* ── Representative Reviews ─────────────────────────────────── */}
        <SectionCard
          title="대표 리뷰"
          subtitle="긍정 · 부정 대표 사례"
          badge="최근 30일"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Positive */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F3F4F6]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-[13px] font-semibold text-[#065F46]">긍정 리뷰</span>
                <span className="text-[12px] text-[#9CA3AF]">
                  ({representativeReviews.positive.length}건)
                </span>
              </div>
              <div className="space-y-3">
                {representativeReviews.positive.map((r, i) => (
                  <ReviewCard key={i} review={r} type="positive" />
                ))}
              </div>
            </div>

            {/* Negative */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F3F4F6]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="text-[13px] font-semibold text-[#7F1D1D]">부정 리뷰</span>
                <span className="text-[12px] text-[#9CA3AF]">
                  ({representativeReviews.negative.length}건)
                </span>
              </div>
              <div className="space-y-3">
                {representativeReviews.negative.map((r, i) => (
                  <ReviewCard key={i} review={r} type="negative" />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="text-center py-6 space-y-1">
          <p className="text-[13px] text-[#9CA3AF]">Review Pulse · 앱 리뷰 분석 서비스</p>
          <p className="text-[12px] text-[#D1D5DB]">공식 평점: {app.store} 전체 평가 가중 평균 · 체감 평점: 수집 샘플 단순 평균</p>
        </div>
      </main>
    </div>
  );
}
