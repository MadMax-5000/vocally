import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // DESIGN.md tokens (names match intent)
        canvas: "#f5f5f5",
        "canvas-soft": "#fafafa",
        "surface-card": "#ffffff",
        "surface-strong": "#f0efed",
        hairline: "#e7e5e4",
        "hairline-soft": "#f0efed",
        "hairline-strong": "#d6d3d1",
        ink: "#0c0a09",
        body: "#4e4e4e",
        "body-strong": "#292524",
        muted: "#777169",
        "muted-soft": "#a8a29e",
        // Brand
        primary: "#FF5A36",
        secondary: "#00E5FF",
        "primary-active": "#E84A2C",
        "on-primary": "#ffffff",
        "on-secondary": "#0c0a09",
        "semantic-success": "#16a34a",
        "semantic-error": "#dc2626"
      },
      fontFamily: {
        // Nimbus Sans L isn't on Google Fonts; we use a local/system fallback.
        display: ["Nimbus Sans L", "Helvetica", "Arial", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
        normal: "0em",
        wide: "0.03em"
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "24px",
        pill: "9999px"
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        base: "16px",
        md: "20px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px"
      },
      fontSize: {
        // Display tokens
        "display-mega": ["64px", { lineHeight: "1.05", letterSpacing: "-1.92px", fontWeight: "700" }],
        "display-xl": ["48px", { lineHeight: "1.08", letterSpacing: "-0.96px", fontWeight: "700" }],
        "display-lg": ["36px", { lineHeight: "1.17", letterSpacing: "-0.36px", fontWeight: "700" }],
        "display-md": ["32px", { lineHeight: "1.13", letterSpacing: "-0.32px", fontWeight: "700" }],
        "display-sm": ["24px", { lineHeight: "1.2", letterSpacing: "0px", fontWeight: "700" }],
        // Body tokens
        "title-md": ["20px", { lineHeight: "1.35", letterSpacing: "0px", fontWeight: "500" }],
        "title-sm": ["18px", { lineHeight: "1.44", letterSpacing: "0.18px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "1.5", letterSpacing: "0.16px", fontWeight: "400" }],
        "body-strong": ["16px", { lineHeight: "1.5", letterSpacing: "0.16px", fontWeight: "500" }],
        "body-sm": ["15px", { lineHeight: "1.47", letterSpacing: "0.15px", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "1.5", letterSpacing: "0px", fontWeight: "400" }],
        "caption-uppercase": ["12px", { lineHeight: "1.4", letterSpacing: "0.96px", fontWeight: "600" }],
        button: ["15px", { lineHeight: "1", letterSpacing: "0px", fontWeight: "500" }],
        "nav-link": ["15px", { lineHeight: "1.4", letterSpacing: "0px", fontWeight: "500" }]
      }
    }
  },
   safelist: ["text-on-primary", "text-on-secondary", "bg-on-primary", "bg-on-secondary"]
  };

export default config;

