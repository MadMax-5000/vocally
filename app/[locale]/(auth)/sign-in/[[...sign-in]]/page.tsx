import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { authClerkAppearance } from "@/lib/clerk/auth-appearance";

export default async function SignInPage() {
  const t = await getTranslations("auth");
  return (
    <AuthPageShell title={t("signInTitle")} subtitle={t("signInSubtitle")}>
      <SignIn
        appearance={authClerkAppearance}
        fallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
        signUpUrl="/sign-up"
      />
    </AuthPageShell>
  );
}
