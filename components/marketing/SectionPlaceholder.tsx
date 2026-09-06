type SectionPlaceholderProps = {
  minHeight?: number;
  className?: string;
};

export function SectionPlaceholder({
  minHeight = 480,
  className,
}: SectionPlaceholderProps) {
  return (
    <div
      aria-hidden
      className={["w-full bg-surface-card", className].filter(Boolean).join(" ")}
      style={{ minHeight }}
    />
  );
}
