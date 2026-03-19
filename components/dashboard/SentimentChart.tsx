"use client";

interface Props {
  positive: number;
  neutral: number;
  negative: number;
}

const SEGMENTS = [
  { key: "positive" as const, label: "긍정", color: "#10B981", trackColor: "#D1FAE5" },
  { key: "neutral"  as const, label: "중립", color: "#F59E0B", trackColor: "#FEF3C7" },
  { key: "negative" as const, label: "부정", color: "#EF4444", trackColor: "#FEE2E2" },
];

// SVG donut segment helper
function DonutArc({
  pct,
  color,
  trackColor,
  size = 80,
  stroke = 10,
}: {
  pct: number;
  color: string;
  trackColor: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SentimentChart({ positive, neutral, negative }: Props) {
  const values = { positive, neutral, negative };

  return (
    <div className="space-y-5">
      {/* Stacked bar */}
      <div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {SEGMENTS.map((s) => (
            <div
              key={s.key}
              className="transition-all duration-700 ease-out"
              style={{ width: `${values[s.key]}%`, background: s.color }}
              title={`${s.label}: ${values[s.key]}%`}
            />
          ))}
        </div>
      </div>

      {/* Three donut + label rows */}
      <div className="space-y-3">
        {SEGMENTS.map((s) => {
          const pct = values[s.key];
          return (
            <div key={s.key} className="flex items-center gap-3">
              {/* Mini donut */}
              <DonutArc pct={pct} color={s.color} trackColor={s.trackColor} size={44} stroke={6} />

              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-[13px] text-[#6B7280]">{s.label}</span>
                  </div>
                  <span className="text-[14px] font-bold" style={{ color: s.color }}>
                    {pct}%
                  </span>
                </div>
                {/* Background track bar */}
                <div className="h-1.5 rounded-full" style={{ background: s.trackColor }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: s.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider + summary */}
      <div className="pt-3 border-t border-[#F3F4F6]">
        <p className="text-[13px] text-[#6B7280] leading-relaxed">
          긍정 리뷰가{" "}
          <span className="font-semibold text-[#10B981]">{positive}%</span>로 우세하며,
          부정 리뷰는{" "}
          <span className="font-semibold text-[#EF4444]">{negative}%</span>
          {negative >= 20 ? "로 관리 필요 수준입니다." : "로 양호한 수준입니다."}
        </p>
      </div>
    </div>
  );
}
