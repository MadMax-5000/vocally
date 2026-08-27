import {
  Airplane01Icon,
  ComputerIcon,
  CreditCardIcon,
  ShoppingBag01Icon,
  StethoscopeIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@/components/ui/app-icon";

export const INDUSTRY_IMAGE = "/images/industry.jfif";
export const GRAIN_IMAGE = "/images/grain.webp";

export const INDUSTRY_IDS = [
  "retail",
  "technology",
  "travel",
  "finance",
  "healthcare",
] as const;

export type IndustryId = (typeof INDUSTRY_IDS)[number];

export type IndustryCardDef = {
  id: IndustryId;
  accent: string;
  icon: IconSvgElement;
};

export const INDUSTRY_CARDS: IndustryCardDef[] = [
  { id: "retail", accent: "#1B4F9C", icon: ShoppingBag01Icon },
  { id: "technology", accent: "#166534", icon: ComputerIcon },
  { id: "travel", accent: "#C2410C", icon: Airplane01Icon },
  { id: "finance", accent: "#9D174D", icon: CreditCardIcon },
  { id: "healthcare", accent: "#0F766E", icon: StethoscopeIcon },
];

export type IndustryCopy = {
  id: IndustryId;
  label: string;
  user: string;
  agent: string;
};
