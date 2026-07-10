import { AnselioLogo } from "@/components/brand/AnselioLogo";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 py-8">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <AnselioLogo variant="black" size="lg" href="/" priority />
        <h1 className="mt-2 font-display text-display-md tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-body-md text-body">{subtitle}</p>
        <div className="mt-8 w-full">{children}</div>
      </div>
    </main>
  );
}
