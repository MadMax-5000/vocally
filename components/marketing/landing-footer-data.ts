export type FooterLink = {
  id: string;
  href: string;
};

export type FooterColumn = {
  id: "product" | "resources" | "company";
  links: FooterLink[];
};

export const footerColumns: FooterColumn[] = [
  {
    id: "product",
    links: [
      { id: "overview", href: "/" },
      { id: "pricing", href: "/pricing" },
    ],
  },
  {
    id: "resources",
    links: [
      { id: "solutions", href: "/#solutions" },
      { id: "faq", href: "/faq" },
      { id: "compare", href: "/compare" },
    ],
  },
  {
    id: "company",
    links: [
      { id: "about", href: "/about" },
      { id: "contactSales", href: "/contact/sales" },
      { id: "contactSupport", href: "/contact" },
      { id: "privacy", href: "/privacy" },
      { id: "terms", href: "/terms" },
      { id: "cookies", href: "/cookies" },
      { id: "legal", href: "/legal" },
    ],
  },
];
