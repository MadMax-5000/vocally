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
        "relative border-b border-hairline bg-canvas/85 backdrop-blur",
        sticky ? "sticky top-0 z-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={container}>
        <div className="flex h-16 items-center gap-4">
          <div className="shrink-0">
            <AnselioLogo variant="black" size="md" href="/" priority />
          </div>
          {center ? (
            <div className="hidden flex-1 justify-center lg:flex">{center}</div>
          ) : null}
          <div className="ms-auto flex items-center gap-3">{children}</div>
        </div>
      </div>
      {megaMenu}
    </header>
  );
}
