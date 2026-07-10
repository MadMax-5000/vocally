import type { Appearance } from "@clerk/types";

export const authClerkAppearance: Appearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    // Wrapper chain — forces full width and centering at every Clerk layer
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full border border-hairline bg-surface-card rounded-xl shadow-sm p-6",

    // Hide internal Clerk header (we render our own title above the card)
    headerTitle: "hidden",
    headerSubtitle: "hidden",

    // Hide "Secured by Clerk" + "Development mode" strip while keeping footerAction
    footer: "bg-transparent [&>*:last-child]:hidden",

    // Social buttons
    socialButtonsBlockButton:
      "w-full border border-hairline-strong rounded-md h-10 text-body-md text-ink hover:bg-surface-strong transition-colors",
    socialButtonsBlockButtonText: "text-button text-ink font-medium",

    // Divider
    dividerLine: "bg-hairline",
    dividerText: "text-caption text-muted",

    // Form fields
    formFieldLabel:
      "text-caption-uppercase text-ink font-semibold tracking-wide",
    formFieldInput:
      "border border-hairline-strong rounded-md h-10 px-3 text-body-md focus:border-ink focus:border-2 focus:outline-none",
    formFieldErrorText: "text-caption text-semantic-error",

    // Primary CTA
    formButtonPrimary:
      "bg-primary text-on-primary hover:bg-primary/90 active:bg-primary-active rounded-md text-button font-medium h-10 w-full mt-4 transition-colors",

    // Footer switch link (e.g. "Don't have an account? Sign up")
    footerAction: "mt-4 justify-center",
    footerActionText: "text-body-sm text-muted",
    footerActionLink:
      "text-body-sm text-primary hover:text-primary/80 font-medium",

    // Identity preview (shown after entering email)
    identityPreviewText: "text-body-sm text-muted",
    identityPreviewEditButton: "text-body-sm text-primary",

    // Alerts
    alertText: "text-body-sm text-semantic-error",
  },
};
