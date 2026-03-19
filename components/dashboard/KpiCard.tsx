"use client";

import { ReactNode } from "react";

interface TrendBadge {
  direction: "up" | "down" | "neutral";
  label: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  context?: string; // e.g. "최근 30일 기준"
  trend?: TrendBadge;
  accent?: "blue" | "green" | "red" | "yellow" | "default";
  icon?: ReactNode;
}

const accentMap: Record<NonNullable<KpiCardProps["accent"]>, { border: string; iconBg: string; iconColor: string }> = {
  blue:    { border: "#3182F6", iconBg: "#EFF6FF", iconColor: "#3182F6" },
  green:   { border: "#10B981", iconBg: "#F0FDF4", iconColor: "#10B981" },
  red:     { border: "#EF4444", iconBg: "#FEF2F2", iconColor: "#EF4444" },
  yellow:  { border: "#F59E0B", iconBg: "#FFFBEB", iconColor: "#F59E0B" },
  default: { border: "#E5E7EB", iconBg: "#F9FAFB", iconColor: "#9CA3AF" },
};

const trendMap: Record<TrendBadge["direction"], { bg: string; text: string; icon: string }> = {
  up:      { bg: "#FEF2F2", text: "#EF4444", icon: "↑" },
  down:    { bg: "#F0FDF4", text: "#10B981", icon: "↓" },
  neutral: { bg: "#F9FAFB", text: "#9CA3AF", icon: "—" },
};

export default function KpiCard({
  label, value, sub, context, trend, accent = "default", icon,
}: KpiCardProps) {
  const ac = accentMap[accent];
  const tr = trend ? trendMap[trend.direction] : null;

  return (
    <div
      className="bg-white border border-[#EAECF0] rounded-2xl p-5 flex flex-col gap-3"
      style={{ borderLeft: `3px solid ${ac.border}` }}
    >
      {/* Top row: label + trend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: ac.iconBg }}
            >
              <span style={{ color: ac.iconColor }}>{icon}</span>
            </div>
          )}
          <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
        </div>
        {tr && trend && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: tr.bg, color: tr.text }}
          >
            {tr.icon} {trend.label}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-bold text-[#111827] leading-none tracking-tight">
          {value}
        </span>
        {sub && (
          <span className="text-[13px] text-[#9CA3AF]">{sub}</span>
        )}
      </div>

      {/* Context */}
      {context && (
        <p className="text-[12px] text-[#9CA3AF] mt-auto">{context}</p>
      )}
    </div>
  );
}
