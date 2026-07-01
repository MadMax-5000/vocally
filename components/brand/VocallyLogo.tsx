import Image from "next/image";
import Link from "next/link";
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

export type VocallyLogoVariant = keyof typeof LOGO_SOURCES;
export type VocallyLogoSize = keyof typeof SIZE_CLASS;

type VocallyLogoProps = {
  variant?: VocallyLogoVariant;
  size?: VocallyLogoSize;
  href?: string;
  className?: string;
  priority?: boolean;
};

export function VocallyLogo({
  variant = "black",
  size = "md",
  href,
  className,
  priority = false,
}: VocallyLogoProps) {
  const asset = LOGO_SOURCES[variant];

  const image = (
    <Image
      src={asset.src}
      alt="Vocally"
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={cn("shrink-0 object-contain", SIZE_CLASS[size], className)}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      aria-label="Vocally"
    >
      {image}
    </Link>
  );
}
