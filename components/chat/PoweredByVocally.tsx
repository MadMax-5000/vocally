import Image from "next/image";

export function PoweredByVocally() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1 opacity-45">
      <Image
        src="/images/logo-black.png"
        alt=""
        width={14}
        height={14}
        className="size-3.5 shrink-0 object-contain"
        aria-hidden
      />
      <span className="text-[11px] text-muted">Powered by Vocally</span>
    </div>
  );
}
