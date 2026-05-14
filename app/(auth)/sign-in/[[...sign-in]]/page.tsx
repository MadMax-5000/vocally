import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="font-display text-display-md tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-body-md text-body">
          Sign in to your Vocally workspace
        </p>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mt-8 w-full",
              card: "w-full border border-hairline bg-surface-card p-6 rounded-xl shadow-sm",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "border border-hairline-strong rounded-md h-10 text-body-md text-ink hover:bg-surface-strong transition-colors",
              socialButtonsBlockButtonText: "text-button text-ink font-medium",
              dividerLine: "bg-hairline",
              dividerText: "text-caption text-muted",
              formFieldLabel:
                "text-caption-uppercase text-ink font-semibold tracking-wide",
              formFieldInput:
                "border border-hairline-strong rounded-md h-10 px-3 text-body-md focus:border-ink focus:border-2 focus:outline-none",
              formButtonPrimary:
                "bg-primary text-on-primary hover:bg-primary/90 active:bg-primary-active rounded-md text-button font-medium h-10 w-full mt-4 transition-colors",
              footerAction: "mt-4 justify-center",
              footerActionText: "text-body-sm text-muted",
              footerActionLink:
                "text-body-sm text-primary hover:text-primary/80 font-medium",
              identityPreviewText: "text-body-sm text-muted",
              identityPreviewEditButton: "text-body-sm text-primary",
              alertText: "text-body-sm text-semantic-error",
              formFieldErrorText: "text-caption text-semantic-error",
            },
          }}
          afterSignInUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </main>
  );
}
