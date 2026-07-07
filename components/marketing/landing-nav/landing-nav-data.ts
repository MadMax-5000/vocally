import type { IconSvgElement } from "@/components/ui/app-icon";
import {
  BookOpenIcon,
  BriefcaseIcon,
  FileText,
  Globe,
  LifeBuoy,
  PhoneCall,
  RefreshCwIcon,
  RocketIcon,
  Target,
  TrendingUp,
} from "@/lib/icons/app-icons";

export type MegaId = "solutions" | "resources";

export type NavLinkItem = {
  id: string;
  href: string;
  titleKey: string;
  descriptionKey: string;
  icon: IconSvgElement;
};

export type NavSection = {
  id: string;
  labelKey: string;
  items: NavLinkItem[];
};

export const plainNavLinks = [
  { id: "customers", href: "/#trust", labelKey: "customers" },
  { id: "enterprise", href: "/pricing", labelKey: "enterprise" },
  { id: "pricing", href: "/pricing", labelKey: "pricing" },
] as const;

export const solutionsSections: NavSection[] = [
  {
    id: "useCase",
    labelKey: "sections.useCase",
    items: [
      {
        id: "customer-support",
        href: "/sign-up",
        titleKey: "solutions.customerSupport.title",
        descriptionKey: "solutions.customerSupport.description",
        icon: PhoneCall,
      },
      {
        id: "sales-agent",
        href: "/sign-up",
        titleKey: "solutions.salesAgent.title",
        descriptionKey: "solutions.salesAgent.description",
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    id: "features",
    labelKey: "sections.features",
    items: [
      {
        id: "helpdesk",
        href: "/sign-up",
        titleKey: "solutions.helpdesk.title",
        descriptionKey: "solutions.helpdesk.description",
        icon: LifeBuoy,
      },
    ],
  },
];

export const industrySection: NavSection = {
  id: "industry",
  labelKey: "sections.industry",
  items: [
    {
      id: "ecommerce",
      href: "#",
      titleKey: "solutions.industries.ecommerce.title",
      descriptionKey: "solutions.industries.ecommerce.description",
      icon: Target,
    },
    {
      id: "education",
      href: "#",
      titleKey: "solutions.industries.education.title",
      descriptionKey: "solutions.industries.education.description",
      icon: BookOpenIcon,
    },
    {
      id: "fitness",
      href: "#",
      titleKey: "solutions.industries.fitness.title",
      descriptionKey: "solutions.industries.fitness.description",
      icon: TrendingUp,
    },
    {
      id: "travel",
      href: "#",
      titleKey: "solutions.industries.travel.title",
      descriptionKey: "solutions.industries.travel.description",
      icon: RocketIcon,
    },
  ],
};

export const resourcesLinks: NavLinkItem[] = [
  {
    id: "guide",
    href: "#",
    titleKey: "resources.guide.title",
    descriptionKey: "resources.guide.description",
    icon: FileText,
  },
  {
    id: "blog",
    href: "#",
    titleKey: "resources.blog.title",
    descriptionKey: "resources.blog.description",
    icon: Globe,
  },
  {
    id: "docs",
    href: "#",
    titleKey: "resources.docs.title",
    descriptionKey: "resources.docs.description",
    icon: BookOpenIcon,
  },
  {
    id: "changelog",
    href: "#",
    titleKey: "resources.changelog.title",
    descriptionKey: "resources.changelog.description",
    icon: RefreshCwIcon,
  },
];

export const recentUpdate = {
  href: "/sign-up",
  badgeKey: "resources.recentUpdate.badge",
  titleKey: "resources.recentUpdate.title",
  descriptionKey: "resources.recentUpdate.description",
};
