"use client";

import { TrendPoint } from "@/types";

interface Props {
  data: TrendPoint[];
}

export default function TrendChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const ratings = data.map((d) => d.rating);
  const minR = Math.min(...ratings) - 0.3;
  const maxR = Math.max(...ratings) + 0.3;

  const W = 560;
  const H = 120;
  const padL = 36;
  const padR = 16;
  const padT = 12;
  const padB = 32;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) =>
    padT + chartH - ((v - minR) / (maxR - minR)) * chartH;

  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.rating)}`).join(" ");
  const areaPoints = [
    `${toX(0)},${padT + chartH}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.rating)}`),
    `${toX(data.length - 1)},${padT + chartH}`,
  ].join(" ");

  // Y-axis grid lines
  const gridValues = [
    Math.ceil(minR * 10) / 10,
    (minR + maxR) / 2,
    Math.floor(maxR * 10) / 10,
  ];

  const first = data[0];
  const last = data[data.length - 1];
  const ratingChange = last.rating - first.rating;
  const trendUp = ratingChange > 0;

  return (
    <div>
      {/* Trend summary */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[13px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: trendUp ? "#F0FDF4" : "#FEF2F2",
            color: trendUp ? "#10B981" : "#EF4444",
          }}
        >
          {trendUp ? "↑" : "↓"} {Math.abs(ratingChange).toFixed(1)}점{" "}
          {trendUp ? "개선" : "하락"}
        </span>
        <span className="text-[13px] text-[#9CA3AF]">분석 기준 기간 내 변화</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 320 }}
        >
          {/* Grid lines */}
          {gridValues.map((v, i) => (
            <g key={i}>
              <line
                x1={padL}
                y1={toY(v)}
                x2={W - padR}
                y2={toY(v)}
                stroke="#F3F4F6"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={padL - 4}
                y={toY(v) + 4}
                textAnchor="end"
                fontSize="9"
                fill="#9CA3AF"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <polygon points={areaPoints} fill="#3182F6" fillOpacity="0.06" />

          {/* Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3182F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots and labels */}
          {data.map((d, i) => (
            <g key={i}>
              {/* Outer ring */}
              <circle
                cx={toX(i)}
                cy={toY(d.rating)}
                r="5"
                fill="white"
                stroke="#3182F6"
                strokeWidth="2"
              />
              {/* Inner dot */}
              <circle cx={toX(i)} cy={toY(d.rating)} r="2.5" fill="#3182F6" />

              {/* Value label above */}
              <text
                x={toX(i)}
                y={toY(d.rating) - 9}
                textAnchor="middle"
                fontSize="10"
                fill="#3182F6"
                fontWeight="700"
              >
                {d.rating}
              </text>

              {/* Date label below */}
              <text
                x={toX(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize="9"
                fill="#9CA3AF"
              >
                {d.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
