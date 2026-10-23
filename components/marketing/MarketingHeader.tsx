import { AnselioLogo } from "@/components/brand/AnselioLogo";
import { cn } from "@/lib/utils";

const container = "mx-auto w-full max-w-[1200px] px-6";

type MarketingHeaderProps = {
  children: React.ReactNode;
  center?: React.ReactNode;
  megaMenu?: React.ReactNode;
  sticky?: boolean;
  /** `overlay` sits transparently on top of the hero photograph. */
  tone?: "default" | "overlay";
};

export function MarketingHeader({
  children,
  center,
  megaMenu,
  sticky = false,
  tone = "default",
}: MarketingHeaderProps) {
  const overlay = tone === "overlay";

  return (
    <header
      className={cn(
        overlay
          ? "absolute inset-x-0 top-0 z-50 bg-transparent"
          : ["relative bg-surface-card", sticky ? "sticky top-0 z-50" : ""].filter(Boolean).join(" "),
      )}
    >
      <div className={container}>
        <div
          className={cn(
            "relative flex items-center justify-between gap-4",
            overlay ? "py-5" : "py-2.5",
          )}
        >
          <div className="flex h-full shrink-0 items-center">
            <AnselioLogo
              variant={overlay ? "white" : "black"}
              size={overlay ? "xl" : "md"}
              href="/"
              priority
            />
          </div>
          {center ? (
            <div className="hidden flex-1 items-center justify-center lg:flex xl:absolute xl:left-1/2 xl:top-1/2 xl:flex-none xl:-translate-x-1/2 xl:-translate-y-1/2">
              {center}
            </div>
          ) : null}
          <div className="flex h-full items-center gap-3">{children}</div>
        </div>
      </div>
      {megaMenu}
    </header>
  );
}
