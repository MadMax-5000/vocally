import { BRAND_EMAILS, BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: BRAND_URL,
    logo: `${BRAND_URL}/images/logo-primary-color.png`,
    email: BRAND_EMAILS.contact,
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: BRAND_EMAILS.contact,
        contactType: "customer support",
      },
      {
        "@type": "ContactPoint",
        email: BRAND_EMAILS.sales,
        contactType: "sales",
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: BRAND_URL,
    inLanguage: ["fr", "en", "ar"],
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: BRAND_URL,
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: BRAND_URL,
    offers: {
      "@type": "Offer",
      url: `${BRAND_URL}/fr/pricing`,
    },
  };
}
