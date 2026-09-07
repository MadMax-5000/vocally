import Airplane01Icon from "@hugeicons/core-free-icons/Airplane01Icon";
import ComputerIcon from "@hugeicons/core-free-icons/ComputerIcon";
import CreditCardIcon from "@hugeicons/core-free-icons/CreditCardIcon";
import ShoppingBag01Icon from "@hugeicons/core-free-icons/ShoppingBag01Icon";
import StethoscopeIcon from "@hugeicons/core-free-icons/StethoscopeIcon";
import type { IconSvgElement } from "@/components/ui/app-icon";

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
  image: string;
};

export const INDUSTRY_CARDS: IndustryCardDef[] = [
  { id: "retail", accent: "#1B4F9C", icon: ShoppingBag01Icon, image: "/images/retail-ecommerce.webp" },
  { id: "technology", accent: "#166534", icon: ComputerIcon, image: "/images/technology.webp" },
  { id: "travel", accent: "#C2410C", icon: Airplane01Icon, image: "/images/travel-hospitality.webp" },
  { id: "finance", accent: "#9D174D", icon: CreditCardIcon, image: "/images/financial-services.webp" },
  { id: "healthcare", accent: "#0F766E", icon: StethoscopeIcon, image: "/images/healthcare.webp" },
];

export type IndustryCopy = {
  id: IndustryId;
  label: string;
  user: string;
  agent: string;
};
