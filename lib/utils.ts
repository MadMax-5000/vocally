import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-body-sm",
        "text-body-md",
        "text-body-strong",
        "text-display-mega",
        "text-display-xl",
        "text-display-lg",
        "text-display-md",
        "text-display-sm",
        "text-title-md",
        "text-title-sm",
        "text-caption",
        "text-caption-uppercase",
        "text-button",
        "text-nav-link",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
