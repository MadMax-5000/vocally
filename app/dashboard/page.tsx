import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <main className="min-h-dvh bg-canvas px-6 py-12 text-ink">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-card px-6 py-4">
          <div className="space-y-1">
            <div className="text-title-md tracking-body font-medium">Dashboard</div>
            <div className="text-body-sm tracking-body text-muted">
              Clerk is wired. This is a minimal placeholder.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton>
                <button className="btn-primary" type="button">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </main>
  );
}

