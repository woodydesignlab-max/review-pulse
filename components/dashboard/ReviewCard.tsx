"use client";

import { ReviewItem } from "@/types";

interface Props {
  review: ReviewItem;
  type: "positive" | "negative";
}

const typeConfig = {
  positive: { color: "#10B981", bg: "#F0FDF4", label: "긍정", borderColor: "#A7F3D0" },
  negative: { color: "#EF4444", bg: "#FEF2F2", label: "부정", borderColor: "#FECACA" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill={i < rating ? "#F59E0B" : "#E5E7EB"}>
          <path d="M6 1L7.5 4.5H11L8.5 6.8L9.5 10.5L6 8.3L2.5 10.5L3.5 6.8L1 4.5H4.5L6 1Z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewCard({ review, type }: Props) {
  const cfg = typeConfig[type];
  const initial = review.author[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="bg-white border border-[#EAECF0] rounded-2xl p-5 hover:shadow-sm transition-shadow relative overflow-hidden"
      style={{ borderLeft: `3px solid ${cfg.borderColor}` }}
    >
      {/* Large decorative quote mark */}
      <svg
        className="absolute top-3 right-4 opacity-[0.06]"
        width="36" height="28" viewBox="0 0 36 28" fill={cfg.color}
      >
        <path d="M0 28V17.5C0 7.833 5.333 2.167 16 .5L17.5 3C12.833 4.333 10 7.167 9 11.5H16V28H0ZM20 28V17.5C20 7.833 25.333 2.167 36 .5L37.5 3C32.833 4.333 30 7.167 29 11.5H36V28H20Z"/>
      </svg>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
            style={{ background: cfg.color }}
          >
            {initial}
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#374151]">{review.author}</p>
            <StarRating rating={review.rating} />
          </div>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Review text */}
      <p className="text-[14px] text-[#374151] leading-relaxed line-clamp-3">
        {review.text}
      </p>

      {/* Date */}
      <p className="text-[12px] text-[#9CA3AF] mt-3 pt-3 border-t border-[#F3F4F6]">
        {review.date}
      </p>
    </div>
  );
}
