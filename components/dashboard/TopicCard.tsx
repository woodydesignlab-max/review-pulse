"use client";

import { Topic } from "@/types";

interface Props {
  topic: Topic;
  rank?: number;
}

const trendConfig = {
  up:     { color: "#EF4444", bg: "#FEF2F2", icon: "↑", label: "급증" },
  down:   { color: "#10B981", bg: "#F0FDF4", icon: "↓", label: "완화" },
  stable: { color: "#9CA3AF", bg: "#F9FAFB", icon: "—", label: "유지" },
};

const sentimentStatus = (positive: number, negative: number) => {
  if (negative >= 50) return { label: "주의", color: "#EF4444", bg: "#FEF2F2" };
  if (negative >= 30) return { label: "경고", color: "#F59E0B", bg: "#FFFBEB" };
  return { label: "양호", color: "#10B981", bg: "#F0FDF4" };
};

export default function TopicCard({ topic, rank }: Props) {
  const trend = trendConfig[topic.trend];
  const status = sentimentStatus(topic.positive, topic.negative);

  return (
    <div className="bg-white border border-[#EAECF0] rounded-2xl p-4 hover:border-[#3182F6] hover:shadow-sm transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="text-[11px] font-bold text-[#9CA3AF] w-4 shrink-0">
              #{rank}
            </span>
          )}
          <span className="text-[14px] font-semibold text-[#111827] group-hover:text-[#3182F6] transition-colors">
            {topic.name}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ color: trend.color, background: trend.bg }}
        >
          {trend.icon} {trend.label}
        </span>
      </div>

      {/* Mention count */}
      <p className="text-[12px] text-[#9CA3AF] mb-3">
        {topic.count.toLocaleString()}건 언급
      </p>

      {/* Sentiment bar — thicker */}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-2">
        <div style={{ width: `${topic.positive}%`, background: "#10B981" }} className="transition-all" />
        <div style={{ width: `${topic.neutral}%`,  background: "#F59E0B" }} className="transition-all" />
        <div style={{ width: `${topic.negative}%`, background: "#EF4444" }} className="transition-all" />
      </div>

      {/* Footer: sentiment labels + status chip */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <span className="text-[11px] font-medium text-[#10B981]">긍 {topic.positive}%</span>
          <span className="text-[11px] text-[#9CA3AF]">중 {topic.neutral}%</span>
          <span className="text-[11px] font-medium text-[#EF4444]">부 {topic.negative}%</span>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{ color: status.color, background: status.bg }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}
