"use client";

import { RatingDistribution } from "@/types";

interface Props {
  data: RatingDistribution[];
  totalReviews?: number;
}

export default function RatingDistributionChart({ data, totalReviews }: Props) {
  const sorted = [...data].sort((a, b) => b.star - a.star);
  const maxPercent = Math.max(...sorted.map((d) => d.percent));

  return (
    <div className="space-y-2.5">
      {sorted.map((item) => {
        const isDominant = item.percent === maxPercent;
        const barColor =
          item.star >= 4 ? "#10B981" : item.star === 3 ? "#F59E0B" : "#EF4444";

        return (
          <div
            key={item.star}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
              isDominant ? "bg-[#F9FAFB]" : ""
            }`}
          >
            {/* Star label */}
            <div className="flex items-center gap-1 w-10 shrink-0">
              <span
                className={`text-[13px] font-semibold w-3 text-right ${
                  isDominant ? "text-[#111827]" : "text-[#6B7280]"
                }`}
              >
                {item.star}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill={isDominant ? "#F59E0B" : "#E5E7EB"}>
                <path d="M6 1L7.5 4.5H11L8.5 6.8L9.5 10.5L6 8.3L2.5 10.5L3.5 6.8L1 4.5H4.5L6 1Z" />
              </svg>
            </div>

            {/* Bar track */}
            <div className="flex-1 h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${item.percent}%`, background: barColor }}
              />
            </div>

            {/* Percent — prominent */}
            <span
              className={`text-[13px] w-9 text-right shrink-0 font-semibold ${
                isDominant ? "text-[#111827]" : "text-[#9CA3AF]"
              }`}
            >
              {item.percent}%
            </span>

            {/* Count */}
            <span className="text-[12px] text-[#9CA3AF] w-16 text-right shrink-0 hidden sm:block">
              {item.count.toLocaleString()}
            </span>
          </div>
        );
      })}

      {totalReviews && (
        <p className="text-[12px] text-[#9CA3AF] pt-1 text-right">
          총 {totalReviews.toLocaleString()}건 기준
        </p>
      )}
    </div>
  );
}
