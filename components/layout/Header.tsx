import Link from "next/link";

interface Props {
  showBack?: boolean;
  appName?: string;
}

export default function Header({ showBack = false, appName }: Props) {
  return (
    <header className="bg-white border-b border-[#EAECF0] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
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
          <span className="text-[16px] font-bold text-[#111827] tracking-tight group-hover:text-[#3182F6] transition-colors">
            Review Pulse
          </span>
        </Link>

        {/* Center - App Name */}
        {appName && (
          <span className="text-[14px] font-medium text-[#374151] hidden sm:block">
            {appName}
          </span>
        )}

        {/* Right - Back link */}
        {showBack && (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            새 분석
          </Link>
        )}
      </div>
    </header>
  );
}
