import Image from "next/image";

import { cn } from "@/lib/utils";

export type BoldStat = {
  value: string;
  label: string;
};

export type BoldStatsProps = {
  heading?: string;
  imageSrc?: string;
  imageAlt?: string;
  stats?: BoldStat[];
};

const STATS_IMAGE = "/images/cdn-image.jpg";

const DEFAULT_STATS: BoldStat[] = [
  { value: "80%+", label: "Issues resolved by AI" },
  { value: "<800ms", label: "Avg. AI reply" },
  { value: "9", label: "Channels live" },
  { value: "24/7", label: "Always on" },
];

export function BoldStats({
  heading = "Resolution without the wait.",
  imageSrc = STATS_IMAGE,
  imageAlt = "",
  stats = DEFAULT_STATS,
}: BoldStatsProps) {
  return (
    <section className="bg-surface-card py-section">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="relative overflow-hidden rounded-xxl">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-[center_40%]"
            sizes="(min-width: 1200px) 1200px, 100vw"
          />
          <div className="absolute inset-0 bg-surface-card/40" aria-hidden />
          <div className="relative z-10 px-6 py-10 sm:px-10 md:px-12 md:py-14">
            <h2 className="max-w-[18ch] text-[2.5rem] leading-[1.1] tracking-[-0.025em] text-ink text-balance md:text-[3.25rem]">
              {heading}
            </h2>
            <div className="mt-10 grid grid-cols-2 md:mt-14 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex flex-col gap-3 px-5 py-5 md:px-8 md:py-2",
                    index === 0 && "ps-0",
                    index > 0 && "md:border-s md:border-ink/10",
                    index % 2 === 1 && "border-s border-ink/10",
                  )}
                >
                  <p className="text-5xl font-medium tracking-tighter text-ink md:text-6xl">
                    {stat.value}
                  </p>
                  <p className="max-w-[12rem] text-xs font-semibold uppercase leading-snug tracking-widest text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BoldStats;
