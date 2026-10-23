import Airplane01Icon from "@hugeicons/core-free-icons/Airplane01Icon";
import ComputerIcon from "@hugeicons/core-free-icons/ComputerIcon";
import CreditCardIcon from "@hugeicons/core-free-icons/CreditCardIcon";
import ShoppingBag01Icon from "@hugeicons/core-free-icons/ShoppingBag01Icon";
import StethoscopeIcon from "@hugeicons/core-free-icons/StethoscopeIcon";
import type { IconSvgElement } from "@/components/ui/app-icon";

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
  icon: IconSvgElement;
};

export const INDUSTRY_CARDS: IndustryCardDef[] = [
  { id: "retail", icon: ShoppingBag01Icon },
  { id: "technology", icon: ComputerIcon },
  { id: "travel", icon: Airplane01Icon },
  { id: "finance", icon: CreditCardIcon },
  { id: "healthcare", icon: StethoscopeIcon },
];

export type IndustryCopy = {
  id: IndustryId;
  label: string;
  user: string;
  agent: string;
};
