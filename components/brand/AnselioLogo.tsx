import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

const LOGO_SOURCES = {
  black: {
    src: "/images/logo-black.png",
    width: 1254,
    height: 1254,
  },
  primary: {
    src: "/images/logo-primary-color.png",
    width: 1254,
    height: 1254,
  },
  white: {
    src: "/images/logo-white.png",
    width: 400,
    height: 400,
  },
} as const;

const SIZE_CLASS = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
} as const;

export type AnselioLogoVariant = keyof typeof LOGO_SOURCES;
export type AnselioLogoSize = keyof typeof SIZE_CLASS;

type AnselioLogoProps = {
  variant?: AnselioLogoVariant;
  size?: AnselioLogoSize;
  href?: string;
  className?: string;
  priority?: boolean;
  showWordmark?: boolean;
};

export function AnselioLogo({
  variant = "black",
  size = "md",
  href,
  className,
  priority = false,
  showWordmark = false,
}: AnselioLogoProps) {
  const asset = LOGO_SOURCES[variant];

  const image = (
    <Image
      src={asset.src}
      alt={showWordmark ? "" : BRAND_NAME}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={cn("block shrink-0 object-contain", SIZE_CLASS[size], className)}
    />
  );

  const wordmark = showWordmark ? (
    <span
      className={cn(
        "font-display text-[17px] font-extrabold leading-none tracking-tight whitespace-nowrap",
        variant === "white" ? "text-white" : "text-ink",
      )}
    >
      {BRAND_NAME}
    </span>
  ) : null;

  const lockup = (
    <>
      {image}
      {wordmark}
    </>
  );

  if (!href) {
    if (showWordmark) {
      return (
        <span className="inline-flex shrink-0 items-center gap-2 leading-none">
          {lockup}
        </span>
      );
    }
    return image;
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center leading-none rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        showWordmark && "gap-2",
      )}
      aria-label={showWordmark ? undefined : BRAND_NAME}
    >
      {lockup}
    </Link>
  );
}
