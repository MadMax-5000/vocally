export type FooterLink = {
  id: string;
  href: string;
};

export type FooterColumn = {
  id: "product" | "industries" | "resources" | "company";
  links: FooterLink[];
};

export const footerColumns: FooterColumn[] = [
  {
    id: "product",
    links: [
      { id: "overview", href: "/" },
      { id: "aops", href: "#" },
      { id: "chat", href: "#" },
      { id: "email", href: "#" },
      { id: "voice", href: "#" },
      { id: "integrations", href: "#" },
      { id: "experiments", href: "#" },
      { id: "insights", href: "#" },
      { id: "customerSupport", href: "/sign-up" },
      { id: "salesAgent", href: "/sign-up" },
      { id: "helpdesk", href: "/sign-up" },
      { id: "pricing", href: "/pricing" },
      { id: "enterprise", href: "/pricing" },
    ],
  },
  {
    id: "industries",
    links: [
      { id: "retail", href: "#" },
      { id: "travel", href: "#" },
      { id: "technology", href: "#" },
      { id: "financial", href: "#" },
      { id: "health", href: "#" },
      { id: "media", href: "#" },
      { id: "telecom", href: "#" },
      { id: "education", href: "#" },
      { id: "fitness", href: "#" },
    ],
  },
  {
    id: "resources",
    links: [
      { id: "customers", href: "/#trust" },
      { id: "resourcesHub", href: "#" },
      { id: "glossary", href: "#" },
      { id: "guide", href: "#" },
      { id: "blog", href: "#" },
      { id: "docs", href: "#" },
      { id: "changelog", href: "#" },
    ],
  },
  {
    id: "company",
    links: [
      { id: "about", href: "#" },
      { id: "careers", href: "#" },
      { id: "privacy", href: "/privacy" },
      { id: "security", href: "#" },
      { id: "contactSales", href: "/contact/sales" },
      { id: "contactSupport", href: "/contact" },
      { id: "terms", href: "/terms" },
      { id: "cookies", href: "/cookies" },
    ],
  },
];

export type FooterSocial = {
  id: "x" | "linkedin" | "instagram";
  href: string;
  label: string;
};

export const footerSocials: FooterSocial[] = [
  { id: "x", href: "#", label: "X" },
  { id: "linkedin", href: "#", label: "LinkedIn" },
  { id: "instagram", href: "#", label: "Instagram" },
];
