import { SignUp } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { authClerkAppearance } from "@/lib/clerk/auth-appearance";

export default async function SignUpPage() {
  const t = await getTranslations("auth");
  return (
    <AuthPageShell title={t("signUpTitle")} subtitle={t("signUpSubtitle")}>
      <SignUp
        appearance={authClerkAppearance}
        fallbackRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/dashboard"
        signInUrl="/sign-in"
      />
    </AuthPageShell>
  );
}
