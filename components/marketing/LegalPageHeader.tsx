import { AnselioLogo } from "@/components/brand/AnselioLogo";

const container = "mx-auto w-full max-w-[1200px] px-6";

export function LegalPageHeader() {
  return (
    <header className="border-b border-hairline bg-canvas">
      <div className={[container, "flex h-16 items-center"].join(" ")}>
        <AnselioLogo variant="black" size="md" href="/" />
      </div>
    </header>
  );
}
