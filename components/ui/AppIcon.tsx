"use client";

import Image from "next/image";
import { useState } from "react";

// 카테고리 키워드 → 배경/글자 색상 매핑
const CATEGORY_COLORS: { key: string; bg: string; text: string }[] = [
  { key: "금융",      bg: "#EEF2FF", text: "#4338CA" },
  { key: "finance",   bg: "#EEF2FF", text: "#4338CA" },
  { key: "banking",   bg: "#EEF2FF", text: "#4338CA" },
  { key: "음식",      bg: "#FFF7ED", text: "#C2410C" },
  { key: "food",      bg: "#FFF7ED", text: "#C2410C" },
  { key: "배달",      bg: "#FFF7ED", text: "#C2410C" },
  { key: "쇼핑",      bg: "#FDF4FF", text: "#7E22CE" },
  { key: "shopping",  bg: "#FDF4FF", text: "#7E22CE" },
  { key: "소셜",      bg: "#EFF6FF", text: "#1D4ED8" },
  { key: "social",    bg: "#EFF6FF", text: "#1D4ED8" },
  { key: "여행",      bg: "#ECFDF5", text: "#059669" },
  { key: "travel",    bg: "#ECFDF5", text: "#059669" },
  { key: "게임",      bg: "#FFF1F2", text: "#BE123C" },
  { key: "game",      bg: "#FFF1F2", text: "#BE123C" },
  { key: "교육",      bg: "#F0FDF4", text: "#16A34A" },
  { key: "education", bg: "#F0FDF4", text: "#16A34A" },
  { key: "헬스",      bg: "#FFF0F6", text: "#BE185D" },
  { key: "health",    bg: "#FFF0F6", text: "#BE185D" },
];

function getCategoryColors(category?: string): { bg: string; text: string } {
  if (!category) return { bg: "#F4F4F5", text: "#52525B" };
  const lower = category.toLowerCase();
  const match = CATEGORY_COLORS.find((c) => lower.includes(c.key));
  return match ? { bg: match.bg, text: match.text } : { bg: "#F4F4F5", text: "#52525B" };
}

interface AppIconProps {
  icon: string;
  name: string;
  category?: string;
  size?: number;
  className?: string;
}

export default function AppIcon({ icon, name, category, size = 64, className = "" }: AppIconProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const colors = getCategoryColors(category);
  const letter = (name || "?").trim().charAt(0);

  const showImage = !!icon && !imgError;

  return (
    <div
      className={`rounded-2xl shadow-lg shrink-0 overflow-hidden relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Letter fallback — 항상 렌더링, 이미지가 로드되면 가려짐 */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none font-bold"
        style={{
          background: colors.bg,
          color: colors.text,
          fontSize: Math.round(size * 0.42),
        }}
      >
        {letter}
      </div>

      {/* 실제 아이콘 — 로드 완료 시 fade-in으로 fallback 위를 덮음 */}
      {showImage && (
        <Image
          src={icon}
          alt={`${name} 아이콘`}
          width={size}
          height={size}
          className="absolute inset-0 object-cover transition-opacity duration-300"
          style={{ opacity: imgLoaded ? 1 : 0 }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          unoptimized
        />
      )}
    </div>
  );
}
