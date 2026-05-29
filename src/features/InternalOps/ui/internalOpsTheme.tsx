export const internalTheme = {
  card: "rounded-[12px] border border-[#e0d9ce] bg-white p-4 shadow-sm",
  cardCompact: "rounded-[12px] border border-[#e0d9ce] bg-white p-3 shadow-sm",
  nested: "rounded-[10px] bg-[#f3eadc]",
  skeleton: "rounded-[12px] bg-[#e8e2d4]",
  label: "text-[11px] font-normal uppercase tracking-[0.08em] text-[#3b3f6e99]",
  title: "text-[#3b3f6e]",
  muted: "text-[#2b2b2f99]",
  faint: "text-[#2b2b2f66]",
  pillActive: "bg-[#3b3f6e] text-[#f7f1e6]",
  pillInactive: "border border-[#e0d9ce] bg-white text-[#3b3f6e99]",
};

export function InternalRefreshPill({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <span className="rounded-full bg-[#e8e2d4] px-3 py-1 text-[11px] font-medium text-[#3b3f6e99]">
      Refreshing...
    </span>
  );
}
