export function PhotoCredit({ children = 'Photo: Seoul Marathon' }: { children?: string }) {
  return <span className="absolute bottom-2.5 left-3 text-[11px] text-white/85">{children}</span>;
}
