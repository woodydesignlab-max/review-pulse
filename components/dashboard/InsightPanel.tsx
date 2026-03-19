"use client";

import { Insights } from "@/types";

interface Props {
  insights: Insights;
}

export default function InsightPanel({ insights }: Props) {
  return (
    <div>
      {/* Summary */}
      <p className="text-[14px] text-[#374151] leading-relaxed p-4 bg-[#F7F8FA] border border-[#EAECF0] rounded-xl mb-5">
        {insights.summary}
      </p>

      {/* Three columns */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Positive */}
        <div className="p-4 bg-[#F0FDF4] border border-[#A7F3D0] rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5L4 7L8 3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[#065F46]">긍정 포인트</span>
          </div>
          <ul className="space-y-2">
            {insights.positivePoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#10B981] mt-0.5 shrink-0 text-[13px]">✓</span>
                <span className="text-[13px] text-[#065F46] leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negative */}
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 3V5.5M5 6.5V7"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[#7F1D1D]">개선 필요</span>
          </div>
          <ul className="space-y-2">
            {insights.negativePoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#EF4444] mt-0.5 shrink-0 text-[13px]">!</span>
                <span className="text-[13px] text-[#7F1D1D] leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-[#3182F6] rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 2V8M2 5H8"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[#1E3A5F]">액션 아이템</span>
          </div>
          <ul className="space-y-2">
            {insights.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#3182F6] font-semibold shrink-0 text-[13px] mt-0.5">
                  {i + 1}.
                </span>
                <span className="text-[13px] text-[#1E3A5F] leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
