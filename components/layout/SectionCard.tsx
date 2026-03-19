interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SectionCard({ title, subtitle, badge, children, footer }: Props) {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-[#F3F4F6]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>
            {subtitle && (
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">{subtitle}</p>
            )}
          </div>
          {badge && (
            <span className="text-[11px] text-[#9CA3AF] bg-[#F9FAFB] border border-[#EAECF0] px-2.5 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-6">{children}</div>

      {/* Optional footer */}
      {footer && (
        <div className="px-6 py-3 border-t border-[#F3F4F6] bg-[#F9FAFB]">
          {footer}
        </div>
      )}
    </div>
  );
}
