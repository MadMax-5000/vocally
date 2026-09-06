import { DEMO_BOOKING_URL } from "@/lib/constants/brand";

type BookDemoLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function BookDemoLink({ className, children }: BookDemoLinkProps) {
  return (
    <a
      href={DEMO_BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
