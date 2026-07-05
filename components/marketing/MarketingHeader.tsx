import { AnselioLogo } from "@/components/brand/AnselioLogo";

const container = "mx-auto w-full max-w-[1200px] px-6";

type MarketingHeaderProps = {
  children: React.ReactNode;
  sticky?: boolean;
};

export function MarketingHeader({ children, sticky = false }: MarketingHeaderProps) {
  return (
    <header
      className={[
        "border-b border-hairline bg-canvas/85 backdrop-blur",
        sticky ? "sticky top-0 z-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={[container, "flex h-16 items-center justify-between"].join(" ")}>
        <AnselioLogo variant="black" size="md" href="/" priority />
        {children}
      </div>
    </header>
  );
}
