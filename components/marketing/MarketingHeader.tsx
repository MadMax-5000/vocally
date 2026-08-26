import { AnselioLogo } from "@/components/brand/AnselioLogo";

const container = "mx-auto w-full max-w-[1200px] px-6";

type MarketingHeaderProps = {
  children: React.ReactNode;
  center?: React.ReactNode;
  megaMenu?: React.ReactNode;
  sticky?: boolean;
};

export function MarketingHeader({
  children,
  center,
  megaMenu,
  sticky = false,
}: MarketingHeaderProps) {
  return (
    <header
      className={[
        "relative bg-surface-card",
        sticky ? "sticky top-0 z-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={container}>
        <div className="flex items-center gap-4 py-2.5">
          <div className="flex h-full shrink-0 items-center">
            <AnselioLogo variant="black" size="md" href="/" priority />
          </div>
          {center ? (
            <div className="hidden h-full flex-1 items-center justify-center lg:flex">
              {center}
            </div>
          ) : null}
          <div className="ms-auto flex h-full items-center gap-3">{children}</div>
        </div>
      </div>
      {megaMenu}
    </header>
  );
}
